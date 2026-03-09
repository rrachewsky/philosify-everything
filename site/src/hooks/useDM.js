// ============================================================
// useDM - Hook for Direct Messages (conversation-based)
// ============================================================
// Supports both 1-to-1 (direct) and group conversations.
// Uses shared Realtime client singleton for instant message delivery.

import { useState, useCallback, useEffect, useRef } from 'react';
import { dmService } from '../services/api/dm.js';
import { blockService } from '../services/api/block.js';
import { useAuth } from './useAuth.js';
import { getRealtimeClient, waitForAuth } from '../services/realtime.js';
import * as cryptoService from '../services/crypto.js';
import { logger } from '../utils';

export function useDM() {
  const { user, isAuthenticated } = useAuth();

  // Conversations list state
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);

  // Active conversation state
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Sending state
  const [sending, setSending] = useState(false);

  // Reply/Edit state
  const [replyingTo, setReplyingTo] = useState(null); // message being replied to
  const [editingMessage, setEditingMessage] = useState(null); // message being edited

  // Typing indicators state
  const [typingUsers, setTypingUsers] = useState([]); // array of display names currently typing
  const typingTimersRef = useRef(new Map()); // userId -> timeout for auto-clear

  // Realtime refs
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const typingChannelRef = useRef(null);
  const activeConversationRef = useRef(null);
  const initedRef = useRef(false);

  // Keep ref in sync with state (for realtime callback)
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationsError(null);

    try {
      const data = await dmService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setConversationsError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Open conversation by ID
  const openConversation = useCallback(
    async (conversationId) => {
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);

      // Set minimal active conversation from list (if available)
      const fromList = conversations.find((c) => c.id === conversationId);
      setActiveConversation(fromList || { id: conversationId });

      try {
        const data = await dmService.getMessages(conversationId);
        setMessages(data.messages || []);
        setHasMoreMessages((data.messages || []).length >= 50);

        // Mark as read
        try {
          await dmService.markRead(conversationId);
        } catch {
          // Non-critical
        }

        // Update unread count in conversations list
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        setMessagesError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [conversations]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || loadingMessages || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoadingMessages(true);
    try {
      const data = await dmService.getMessages(activeConversation.id, oldestMessage.createdAt);
      const newMessages = data.messages || [];
      setMessages((prev) => [...newMessages, ...prev]);
      setHasMoreMessages(newMessages.length >= 50);
    } catch (err) {
      setMessagesError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeConversation, loadingMessages, messages]);

  // Send a message (with optional reply)
  const sendMessage = useCallback(
    async (text, options = {}) => {
      if (!activeConversation || !text.trim()) return;

      setSending(true);
      try {
        const convInfo = {
          type: activeConversation.type,
          members: activeConversation.members,
        };

        // Include replyToId if replying
        const sendOptions = {
          replyToId: options.replyToId || replyingTo?.id || null,
          isForwarded: options.isForwarded || false,
        };

        const data = await dmService.sendMessage(
          activeConversation.id,
          text.trim(),
          convInfo,
          user?.id,
          sendOptions
        );

        // Add message to list with reply preview if replying
        if (data.message) {
          const messageWithReplyPreview = {
            ...data.message,
            replyPreview: replyingTo
              ? {
                  id: replyingTo.id,
                  senderId: replyingTo.senderId,
                  senderName: replyingTo.senderName,
                  message: replyingTo.message?.slice(0, 100) || '',
                }
              : null,
          };
          setMessages((prev) => [...prev, messageWithReplyPreview]);
        }

        // Clear reply state after sending
        setReplyingTo(null);

        // Update conversation in list
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === activeConversation.id);
          if (existing) {
            return prev
              .map((c) =>
                c.id === activeConversation.id
                  ? {
                      ...c,
                      lastMessage: text.trim(),
                      lastMessageAt: new Date().toISOString(),
                      lastSenderId: user?.id,
                    }
                  : c
              )
              .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
          }
          // Should not happen — conversation should exist in list
          return prev;
        });

        return data.message;
      } finally {
        setSending(false);
      }
    },
    [activeConversation, user?.id, replyingTo]
  );

  // Close conversation
  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setMessagesError(null);
    setTypingUsers([]);
    // Clean up typing channel
    if (typingChannelRef.current && clientRef.current) {
      clientRef.current.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }
  }, []);

  // Typing indicator: subscribe to typing channel when active conversation changes
  useEffect(() => {
    if (!activeConversation?.id || !isAuthenticated || !user?.id) {
      setTypingUsers([]);
      return;
    }

    let cancelled = false;

    async function setupTypingChannel() {
      try {
        const sb = clientRef.current || (await getRealtimeClient());
        if (cancelled) return;

        // Clean up previous typing channel
        if (typingChannelRef.current) {
          sb.removeChannel(typingChannelRef.current);
        }

        const ch = sb
          .channel(`dm-typing:${activeConversation.id}`)
          .on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (payload.userId === user?.id) return; // Skip self
            const name = payload.displayName || 'Someone';

            setTypingUsers((prev) => {
              if (!prev.includes(name)) return [...prev, name];
              return prev;
            });

            // Auto-clear after 3 seconds
            const existing = typingTimersRef.current.get(payload.userId);
            if (existing) clearTimeout(existing);
            typingTimersRef.current.set(
              payload.userId,
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((n) => n !== name));
                typingTimersRef.current.delete(payload.userId);
              }, 3000)
            );
          })
          .subscribe();

        if (!cancelled) {
          typingChannelRef.current = ch;
        }
      } catch (err) {
        logger.warn('[useDM] Typing channel setup error:', err.message);
      }
    }

    setupTypingChannel();

    // Copy ref value so it's stable in cleanup
    const timers = typingTimersRef.current;
    return () => {
      cancelled = true;
      // Clear all typing timers
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
      setTypingUsers([]);
    };
  }, [activeConversation?.id, isAuthenticated, user?.id]);

  // Broadcast typing event to the active conversation
  const broadcastTyping = useCallback(() => {
    if (!typingChannelRef.current || !activeConversation?.id) return;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user?.id,
        displayName:
          user?.user_metadata?.full_name ||
          user?.user_metadata?.display_name ||
          user?.email?.split('@')[0] ||
          'Someone',
      },
    });
  }, [activeConversation?.id, user]);

  // Start conversation with a user (from Agora, People tab, etc.)
  // Creates a direct conversation if one doesn't exist, or opens existing one.
  // Optional greeting: if provided, auto-sends as first message when conversation is new.
  const startConversation = useCallback(
    async (userId, displayName, options = {}) => {
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);

      // Show placeholder while we create/find the conversation
      setActiveConversation({
        id: null,
        type: 'direct',
        name: null,
        members: [{ id: userId, displayName: displayName || 'Loading...' }],
      });

      try {
        // Create (or find existing) direct conversation
        const data = await dmService.createConversation({
          type: 'direct',
          memberIds: [userId],
        });

        const conv = data.conversation;
        setActiveConversation(conv);

        // Load messages for this conversation
        const msgData = await dmService.getMessages(conv.id);
        const existingMessages = msgData.messages || [];
        setMessages(existingMessages);
        setHasMoreMessages(existingMessages.length >= 50);

        // Auto-send greeting if provided and conversation is brand new (no messages)
        if (options.greeting && existingMessages.length === 0) {
          try {
            const convInfo = { type: conv.type, members: conv.members };
            const greetingData = await dmService.sendMessage(
              conv.id,
              options.greeting,
              convInfo,
              user?.id,
              {}
            );
            if (greetingData.message) {
              setMessages((prev) => [...prev, greetingData.message]);
            }
          } catch (greetErr) {
            logger.warn('[useDM] Auto-greeting failed:', greetErr.message);
            // Non-critical, don't block the conversation opening
          }
        }

        // Mark as read
        try {
          await dmService.markRead(conv.id);
        } catch {
          // Non-critical
        }

        // Add to conversations list if not already there
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conv.id);
          if (exists) {
            return prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c));
          }
          return [{ ...conv, unreadCount: 0 }, ...prev];
        });
      } catch (err) {
        setMessagesError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [user?.id]
  );

  // Create a new group conversation
  const createGroup = useCallback(async (memberIds, name) => {
    try {
      const data = await dmService.createConversation({
        type: 'group',
        memberIds,
        name,
      });

      const conv = data.conversation;

      // Add to conversations list
      setConversations((prev) => [{ ...conv, unreadCount: 0 }, ...prev]);

      // Open it
      setActiveConversation(conv);
      setMessages([]);
      setHasMoreMessages(false);

      return conv;
    } catch (err) {
      setConversationsError(err.message);
      return null;
    }
  }, []);

  // Add members to current group conversation
  const addMembers = useCallback(
    async (memberIds) => {
      if (!activeConversation) return false;
      try {
        const data = await dmService.addMembers(activeConversation.id, memberIds);
        // Update active conversation with new members
        if (data.conversation) {
          setActiveConversation(data.conversation);
          // Update in list too
          setConversations((prev) =>
            prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
          );
        }
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Remove a member from current group conversation (admin only)
  const removeMember = useCallback(
    async (userId) => {
      if (!activeConversation) return false;
      try {
        const data = await dmService.removeMember(activeConversation.id, userId);
        // Update active conversation
        if (data.conversation) {
          setActiveConversation(data.conversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
          );
        }
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Rename a group conversation
  const renameConversation = useCallback(
    async (name) => {
      if (!activeConversation) return false;
      try {
        const data = await dmService.updateConversation(activeConversation.id, { name });
        if (data.conversation) {
          setActiveConversation(data.conversation);
          setConversations((prev) =>
            prev.map((c) => (c.id === data.conversation.id ? { ...c, ...data.conversation } : c))
          );
        }
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Leave / delete conversation
  const leaveConversation = useCallback(
    async (conversationId) => {
      const targetId = conversationId || activeConversation?.id;
      if (!targetId) return false;
      try {
        await dmService.leaveConversation(targetId);
        // Remove from list
        setConversations((prev) => prev.filter((c) => c.id !== targetId));
        // If viewing this conversation, close it
        if (activeConversation?.id === targetId) {
          setActiveConversation(null);
          setMessages([]);
        }
        return true;
      } catch (err) {
        setConversationsError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Delete a single message
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!activeConversation) return false;
      try {
        await dmService.deleteMessage(activeConversation.id, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Edit a message
  const editMessage = useCallback(
    async (messageId, newText) => {
      if (!activeConversation || !newText.trim()) return false;
      try {
        const convInfo = {
          type: activeConversation.type,
          members: activeConversation.members,
        };
        const data = await dmService.editMessage(
          activeConversation.id,
          messageId,
          newText.trim(),
          convInfo,
          user?.id
        );
        // Update message in list
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    message: data.message.isEncrypted ? m.message : newText.trim(), // Keep decrypted or use new
                    editedAt: data.message.editedAt,
                  }
                : m
            )
          );
        }
        setEditingMessage(null);
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation, user?.id]
  );

  // Toggle a philosophical reaction on a message (optimistic update)
  const toggleReaction = useCallback(
    async (messageId, reactionType) => {
      if (!activeConversation) return false;

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const myReactions = m.myReactions || [];
          const reactions = { ...(m.reactions || {}) };
          const hasReaction = myReactions.includes(reactionType);

          if (hasReaction) {
            // Remove
            reactions[reactionType] = Math.max((reactions[reactionType] || 1) - 1, 0);
            if (reactions[reactionType] === 0) delete reactions[reactionType];
            return {
              ...m,
              reactions,
              myReactions: myReactions.filter((r) => r !== reactionType),
            };
          } else {
            // Add
            reactions[reactionType] = (reactions[reactionType] || 0) + 1;
            return {
              ...m,
              reactions,
              myReactions: [...myReactions, reactionType],
            };
          }
        })
      );

      try {
        await dmService.toggleReaction(activeConversation.id, messageId, reactionType);
        return true;
      } catch (err) {
        // Revert optimistic update on failure by reloading
        logger.warn('[useDM] Reaction toggle failed, reverting:', err.message);
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // Share an analysis as a rich card in the active conversation
  const shareAnalysis = useCallback(
    async (analysisData) => {
      if (!activeConversation) return false;

      try {
        const data = await dmService.shareAnalysis(activeConversation.id, analysisData);
        // Add the analysis share message to the local messages list
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }

        // Update conversation in list
        const preview = `Shared: ${analysisData.songName} - ${analysisData.artist}`;
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === activeConversation.id);
          if (existing) {
            return prev
              .map((c) =>
                c.id === activeConversation.id
                  ? {
                      ...c,
                      lastMessage: preview,
                      lastMessageAt: new Date().toISOString(),
                      lastSenderId: user?.id,
                    }
                  : c
              )
              .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
          }
          return prev;
        });

        return data.message;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation, user?.id]
  );

  // Block a user (for direct conversations only)
  const blockUser = useCallback(
    async (targetUserId) => {
      try {
        await blockService.blockUser(targetUserId);
        // Remove conversations involving this user
        setConversations((prev) =>
          prev.filter((c) => {
            if (c.type === 'direct') {
              return !c.members?.some((m) => m.id === targetUserId);
            }
            return true; // Keep group conversations
          })
        );
        // Close if viewing a direct conversation with this user
        if (
          activeConversation?.type === 'direct' &&
          activeConversation?.members?.some((m) => m.id === targetUserId)
        ) {
          setActiveConversation(null);
          setMessages([]);
        }
        return true;
      } catch (err) {
        setMessagesError(err.message);
        return false;
      }
    },
    [activeConversation]
  );

  // ============================================================
  // REALTIME SUBSCRIPTION
  // ============================================================
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (initedRef.current) return;

    let cancelled = false;
    initedRef.current = true;

    async function initRealtime() {
      try {
        await waitForAuth();
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        const channel = sb
          .channel(`dm:${user.id}`, { config: { private: true } })
          .on('broadcast', { event: 'new-message' }, async ({ payload }) => {
            logger.log('[useDM] Broadcast received:', payload.id);

            // Map snake_case from database trigger to camelCase
            let processedMsg = {
              id: payload.id,
              senderId: payload.sender_id,
              senderName: payload.sender_name || null,
              message: payload.message,
              conversationId: payload.conversation_id,
              createdAt: payload.created_at,
              isEncrypted: payload.is_encrypted,
              encryptedContent: payload.encrypted_content,
              nonce: payload.nonce,
              isMine: false,
              messageType: payload.message_type || 'text',
              metadata: payload.metadata || null,
            };

            // GUARD: Skip messages from self (sender already has it from sendMessage)
            // This prevents duplicate messages when DB trigger broadcasts to all members
            if (processedMsg.senderId === user?.id) {
              logger.log('[useDM] Skipping broadcast from self:', processedMsg.id);
              return;
            }

            // Decrypt if encrypted
            if (payload.is_encrypted && payload.encrypted_content && payload.nonce) {
              let decrypted = null;

              // Try pairwise first (direct conversations)
              try {
                decrypted = await cryptoService.decryptDM(
                  payload.encrypted_content,
                  payload.nonce,
                  payload.sender_id
                );
              } catch (err) {
                logger.warn('[useDM] Pairwise decryption failed:', err.message);
              }

              // Try group key (group conversations)
              if (!decrypted && payload.conversation_id) {
                try {
                  decrypted = await cryptoService.decryptGroupDM(
                    payload.encrypted_content,
                    payload.nonce,
                    payload.conversation_id
                  );
                } catch (err) {
                  logger.warn('[useDM] Group decryption failed:', err.message);
                }
              }

              if (decrypted) {
                processedMsg.message = decrypted;
                processedMsg.decrypted = true;
              } else {
                processedMsg.message = '[Unable to decrypt]';
                processedMsg.decryptionFailed = true;
              }
            }

            // Check if we're currently viewing this conversation
            const currentConv = activeConversationRef.current;
            const isViewing = currentConv?.id === payload.conversation_id;

            if (isViewing) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === processedMsg.id)) return prev;
                return [...prev, processedMsg];
              });

              // Mark as read since we're viewing it
              try {
                await dmService.markRead(payload.conversation_id);
              } catch {
                // Non-critical
              }
            }

            // Notify useDMUnreadCount via custom event + play notification sound
            if (!isViewing) {
              window.dispatchEvent(new CustomEvent('dm-received'));
              // Play notification sound (non-blocking)
              try {
                const audio = new Audio('/sounds/dm-notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {}); // Ignore autoplay restrictions
              } catch {
                // ignored
              }
            }

            // Update conversations list
            setConversations((prev) => {
              const existing = prev.find((c) => c.id === payload.conversation_id);
              if (existing) {
                return prev
                  .map((c) =>
                    c.id === payload.conversation_id
                      ? {
                          ...c,
                          lastMessage: processedMsg.message,
                          lastMessageAt: payload.created_at,
                          lastSenderId: payload.sender_id,
                          unreadCount: isViewing ? 0 : (c.unreadCount || 0) + 1,
                        }
                      : c
                  )
                  .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
              } else {
                // New conversation — reload the full list to get proper data
                loadConversations();
                return prev;
              }
            });
          })
          .on('broadcast', { event: 'message-deleted' }, ({ payload }) => {
            logger.log('[useDM] Message deleted broadcast:', payload.id);

            const deletedId = payload.id;

            // Remove from current messages list (minimal payload: only {id, action})
            // The message ID is unique, so we can filter without knowing conversation_id
            setMessages((prev) => {
              const hadMessage = prev.some((m) => m.id === deletedId);
              if (hadMessage) {
                logger.log('[useDM] Removing deleted message from current view:', deletedId);
                return prev.filter((m) => m.id !== deletedId);
              }
              return prev;
            });

            // Note: With minimal payload, we don't have conversation_id.
            // Conversation preview will refresh on next load or when user opens the conversation.
          })
          .on('broadcast', { event: 'message-edited' }, async ({ payload }) => {
            logger.log('[useDM] Message edited broadcast:', payload.id);

            const editedId = payload.id;
            let newMessage = payload.message;

            // Decrypt if encrypted
            if (payload.is_encrypted && payload.encrypted_content && payload.nonce) {
              try {
                const crypto = await cryptoService.decryptDM(
                  payload.encrypted_content,
                  payload.nonce,
                  payload.sender_id
                );
                if (crypto) newMessage = crypto;
              } catch (err) {
                logger.warn('[useDM] Edit decryption failed:', err.message);
                // Try group key
                try {
                  const crypto = await cryptoService.decryptGroupDM(
                    payload.encrypted_content,
                    payload.nonce,
                    payload.conversation_id
                  );
                  if (crypto) newMessage = crypto;
                } catch (err2) {
                  logger.warn('[useDM] Edit group decryption failed:', err2.message);
                }
              }
            }

            // Update message in list
            setMessages((prev) =>
              prev.map((m) =>
                m.id === editedId
                  ? {
                      ...m,
                      message: newMessage || m.message,
                      editedAt: payload.edited_at,
                    }
                  : m
              )
            );
          })
          .on('broadcast', { event: 'reaction-toggled' }, ({ payload }) => {
            logger.log('[useDM] Reaction toggled broadcast:', payload.messageId, payload.action);

            const {
              messageId: reactedMsgId,
              reactionType,
              action,
              userId: reactorId,
              conversationId: reactConvId,
            } = payload;

            // Check if we're viewing the conversation this reaction belongs to
            const currentConv = activeConversationRef.current;
            const isViewingConv = currentConv?.id === reactConvId;

            if (isViewingConv) {
              // Update messages in the active conversation view
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== reactedMsgId) return m;
                  const reactions = { ...(m.reactions || {}) };
                  const myReactions = [...(m.myReactions || [])];

                  if (action === 'added') {
                    reactions[reactionType] = (reactions[reactionType] || 0) + 1;
                    if (reactorId === user?.id && !myReactions.includes(reactionType)) {
                      myReactions.push(reactionType);
                    }
                  } else if (action === 'removed') {
                    reactions[reactionType] = Math.max((reactions[reactionType] || 1) - 1, 0);
                    if (reactions[reactionType] === 0) delete reactions[reactionType];
                    if (reactorId === user?.id) {
                      const idx = myReactions.indexOf(reactionType);
                      if (idx !== -1) myReactions.splice(idx, 1);
                    }
                  }

                  return { ...m, reactions, myReactions };
                })
              );
            }

            // Show toast for reactions (whether viewing or not)
            if (action === 'added') {
              window.dispatchEvent(
                new CustomEvent('dm-reaction-received', {
                  detail: { reactionType, conversationId: reactConvId },
                })
              );
            }
          })
          .subscribe((status, err) => {
            logger.log('[useDM] Subscription status:', status, err ? `error: ${err.message}` : '');
          });

        channelRef.current = channel;
        logger.log('[useDM] Private broadcast subscription active for dm:' + user.id);
      } catch (err) {
        logger.warn('[useDM] Realtime init error:', err.message);
        initedRef.current = false;
      }
    }

    initRealtime();

    return () => {
      cancelled = true;
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      initedRef.current = false;
    };
  }, [isAuthenticated, user?.id, loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  // Total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return {
    // Conversations
    conversations,
    loadingConversations,
    conversationsError,
    loadConversations,
    totalUnread,

    // Active conversation
    activeConversation,
    messages,
    loadingMessages,
    messagesError,
    hasMoreMessages,
    openConversation,
    closeConversation,
    loadMoreMessages,
    startConversation,

    // Group operations
    createGroup,
    addMembers,
    removeMember,
    renameConversation,
    leaveConversation,

    // Sending
    sending,
    sendMessage,

    // Reply & Edit
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,

    // Reactions
    toggleReaction,

    // Analysis sharing
    shareAnalysis,

    // Delete & block
    deleteMessage,
    blockUser,

    // Typing
    typingUsers,
    broadcastTyping,

    // User info
    userId: user?.id,
  };
}

export default useDM;
