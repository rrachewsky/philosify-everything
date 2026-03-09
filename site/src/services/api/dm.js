// ============================================================
// DM API Service - Conversation-based (direct + group)
// ============================================================
// Supports E2E encryption: pairwise for direct, group key for groups.

import { config } from '@/config';
import { logger } from '@/utils';

// NOTE: cryptoService is lazily imported to avoid circular dependency
// (crypto.js imports api/dm.js for group key endpoints)
let _cryptoService = null;
async function getCryptoService() {
  if (!_cryptoService) {
    _cryptoService = await import('@/services/crypto');
  }
  return _cryptoService;
}

const API_BASE = `${config.apiUrl}/api`;

// ============================================================
// CONVERSATIONS
// ============================================================

/** Get all DM conversations */
export async function getConversations() {
  const res = await fetch(`${API_BASE}/dm/conversations`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load conversations');
  }
  return res.json();
}

/** Create a conversation (direct or group) */
export async function createConversation({ type, memberIds, name }) {
  const res = await fetch(`${API_BASE}/dm/conversations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, memberIds, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create conversation');
  }
  return res.json();
}

/** Update conversation (rename group) */
export async function updateConversation(conversationId, { name }) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update conversation');
  }
  return res.json();
}

/** Leave / delete conversation */
export async function leaveConversation(conversationId) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to leave conversation');
  }
  return res.json();
}

// ============================================================
// MESSAGES
// ============================================================

/** Decrypt a single message if encrypted */
async function decryptMessageIfNeeded(message) {
  if (!message.isEncrypted || !message.encryptedContent || !message.nonce) {
    return message;
  }

  const crypto = await getCryptoService();

  try {
    // Try pairwise decryption first (for direct conversations)
    const decrypted = await crypto.decryptDM(
      message.encryptedContent,
      message.nonce,
      message.senderId
    );
    if (decrypted) {
      return { ...message, message: decrypted, decrypted: true };
    }
  } catch (err) {
    logger.warn('[DM] Pairwise decryption failed, trying group key:', err.message);
  }

  // Try group key decryption (for group conversations)
  if (message.conversationId) {
    try {
      const decrypted = await crypto.decryptGroupDM(
        message.encryptedContent,
        message.nonce,
        message.conversationId
      );
      if (decrypted) {
        return { ...message, message: decrypted, decrypted: true };
      }
    } catch (err) {
      logger.warn('[DM] Group decryption failed:', err.message);
    }
  }

  return { ...message, message: '[Unable to decrypt]', decryptionFailed: true };
}

/** Get messages for a conversation (with decryption) */
export async function getMessages(conversationId, before) {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  const query = params.toString();
  const url = `${API_BASE}/dm/conversations/${conversationId}/messages${query ? `?${query}` : ''}`;

  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load messages');
  }

  const data = await res.json();

  // Preload public keys for senders (for pairwise decryption)
  const crypto = await getCryptoService();
  const senderIds = [...new Set(data.messages?.map((m) => m.senderId).filter(Boolean))];
  if (senderIds.length > 0) {
    await crypto.preloadPublicKeys(senderIds);
  }

  // Decrypt messages
  if (data.messages && data.messages.length > 0) {
    data.messages = await Promise.all(data.messages.map(decryptMessageIfNeeded));
  }

  return data;
}

/**
 * @param {Object} convInfo - { type, members } for encryption routing
 * @param {string} currentUserId - for identifying the partner in direct convs
 * @param {Object} options - { replyToId, isForwarded } optional
 */
export async function sendMessage(
  conversationId,
  message,
  convInfo = {},
  currentUserId = null,
  options = {}
) {
  const { replyToId = null, isForwarded = false } = options;
  let body = { message };

  try {
    const crypto = await getCryptoService();
    if (convInfo.type === 'direct' && currentUserId) {
      // Pairwise encryption for direct conversations
      const partnerId = convInfo.members?.find((m) => m.id !== currentUserId)?.id;
      if (partnerId) {
        const encrypted = await crypto.encryptDM(message, partnerId);
        if (encrypted) {
          body = { encrypted_content: encrypted.encrypted_content, nonce: encrypted.nonce };
          logger.log('[DM] Sending pairwise-encrypted message');
        }
      }
    } else if (convInfo.type === 'group') {
      // Group key encryption
      const encrypted = await crypto.encryptGroupDM(message, conversationId);
      if (encrypted) {
        body = { encrypted_content: encrypted.encrypted_content, nonce: encrypted.nonce };
        logger.log('[DM] Sending group-encrypted message');
      }
    }
  } catch (err) {
    logger.warn('[DM] Encryption failed, sending plaintext:', err.message);
  }

  // Add reply/forward options
  if (replyToId) body.reply_to_id = replyToId;
  if (isForwarded) body.is_forwarded = true;

  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

/** Delete a single message (own only) */
export async function deleteMessage(conversationId, messageId) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/messages/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete message');
  }
  return res.json();
}

/** Edit a message (own only) */
export async function editMessage(
  conversationId,
  messageId,
  newMessage,
  convInfo = {},
  currentUserId = null
) {
  let body = { message: newMessage };

  // Encrypt if needed
  try {
    const crypto = await getCryptoService();
    if (convInfo.type === 'direct' && currentUserId) {
      const partnerId = convInfo.members?.find((m) => m.id !== currentUserId)?.id;
      if (partnerId) {
        const encrypted = await crypto.encryptDM(newMessage, partnerId);
        if (encrypted) {
          body = { encrypted_content: encrypted.encrypted_content, nonce: encrypted.nonce };
        }
      }
    } else if (convInfo.type === 'group') {
      const encrypted = await crypto.encryptGroupDM(newMessage, conversationId);
      if (encrypted) {
        body = { encrypted_content: encrypted.encrypted_content, nonce: encrypted.nonce };
      }
    }
  } catch (err) {
    logger.warn('[DM] Edit encryption failed, sending plaintext:', err.message);
  }

  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/messages/${messageId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to edit message');
  }
  return res.json();
}

/** Mark conversation as read */
export async function markRead(conversationId) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to mark read');
  }
  return res.json();
}

// ============================================================
// MEMBERS
// ============================================================

/** Add members to a conversation */
export async function addMembers(conversationId, memberIds) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/members`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add members');
  }
  return res.json();
}

/** Remove a member from a conversation */
export async function removeMember(conversationId, userId) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/members/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove member');
  }
  return res.json();
}

// ============================================================
// USER PROFILE
// ============================================================

/** Get user profile (display name) */
export async function getUserProfile(userId) {
  const res = await fetch(`${API_BASE}/dm/user/${userId}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'User not found');
  }
  return res.json();
}

// ============================================================
// REACTIONS
// ============================================================

/** Toggle a philosophical reaction on a message (add or remove) */
export async function toggleReaction(conversationId, messageId, reactionType) {
  const res = await fetch(
    `${API_BASE}/dm/conversations/${conversationId}/messages/${messageId}/reactions`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: reactionType }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to toggle reaction');
  }
  return res.json();
}

// ============================================================
// ANALYSIS SHARING
// ============================================================

/** Share an analysis as a rich card message in a DM conversation */
export async function shareAnalysis(conversationId, analysisData) {
  const { analysisId, songName, artist, finalScore, classification, shareSlug } = analysisData;
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/share-analysis`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, songName, artist, finalScore, classification, shareSlug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to share analysis');
  }
  return res.json();
}

// ============================================================
// GROUP KEYS
// ============================================================

/** Get my encrypted group key for a conversation */
export async function getConversationKey(conversationId) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/key`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get key');
  }
  return res.json();
}

/** Set group keys for all members */
export async function setConversationKeys(conversationId, memberKeys) {
  const res = await fetch(`${API_BASE}/dm/conversations/${conversationId}/key`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberKeys }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to set keys');
  }
  return res.json();
}

// ============================================================
// EXPORTS
// ============================================================

export const dmService = {
  getConversations,
  createConversation,
  updateConversation,
  leaveConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
  addMembers,
  removeMember,
  getUserProfile,
  getConversationKey,
  setConversationKeys,
  toggleReaction,
  shareAnalysis,
};

export default dmService;
