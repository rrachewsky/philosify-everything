// ============================================================
// useUnderground Hook - Anonymous Confessions with Realtime
// ============================================================
// Uses shared Realtime client singleton for instant post delivery.
// Token management handled by useAuth + realtime.js centrally.

import { useState, useEffect, useCallback, useRef } from 'react';
import { undergroundService } from '../services/api/underground.js';
import { useAuth } from './useAuth.js';
import { getRealtimeClient, waitForAuth } from '../services/realtime.js';

export function useUnderground() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [posting, setPosting] = useState(false);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [myNickname, setMyNickname] = useState(null);
  const [settingNickname, setSettingNickname] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const initedRef = useRef(false);

  // Initialize realtime broadcast subscription (private, authenticated)
  // waitForAuth() gates on token. Token refresh handled by setRealtimeAuth().
  useEffect(() => {
    if (!isAuthenticated) return;
    if (initedRef.current) return;

    let cancelled = false;
    initedRef.current = true;

    async function initRealtime() {
      try {
        await waitForAuth(); // Ensure token is set before subscribing to private channel
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        const channel = sb
          .channel('underground', { config: { private: true } })
          .on('broadcast', { event: 'new-post' }, ({ payload }) => {
            const newPost = {
              ...payload,
              myReactions: [],
            };
            setPosts((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev;
              return [newPost, ...prev];
            });
          })
          .on('broadcast', { event: 'post-deleted' }, ({ payload }) => {
            console.log('[useUnderground] Post deleted broadcast:', payload?.id);
            setPosts((prev) => prev.filter((p) => p.id !== payload.id));
          })
          .on('broadcast', { event: 'post-edited' }, ({ payload }) => {
            console.log('[useUnderground] Post edited broadcast:', payload?.id);
            setPosts((prev) =>
              prev.map((p) =>
                p.id === payload.id
                  ? {
                      ...p,
                      content: payload.content,
                      encryptedContent: payload.encrypted_content,
                      nonce: payload.nonce,
                      isEncrypted: payload.is_encrypted,
                      edited_at: payload.edited_at,
                      editedAt: payload.edited_at,
                    }
                  : p
              )
            );
          })
          .subscribe((status, err) => {
            console.log(
              '[useUnderground] Subscription status:',
              status,
              err ? `error: ${err.message}` : ''
            );
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('[useUnderground] Realtime init error:', err);
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
  }, [isAuthenticated]);

  // Load posts
  const loadPosts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const result = await undergroundService.getPosts();

      // Check if user needs to set nickname
      if (result.needsNickname) {
        setNeedsNickname(true);
        setPosts([]);
        return;
      }

      setNeedsNickname(false);
      setMyNickname(result.myNickname || null);
      setPosts(result.posts || []);
      setHasMore((result.posts || []).length >= 30);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load more (older posts)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || posts.length === 0) return;

    const oldestTimestamp = posts[posts.length - 1]?.created_at;
    if (!oldestTimestamp) return;

    setLoading(true);
    try {
      const { posts: older } = await undergroundService.getPosts(oldestTimestamp);
      setPosts((prev) => [...prev, ...(older || [])]);
      setHasMore((older || []).length >= 30);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, posts]);

  // Create post
  const createPost = useCallback(
    async (content, options = {}) => {
      if (!isAuthenticated || posting) return;
      setPosting(true);
      setError(null);

      const replyToId = options.replyToId || null;

      try {
        const { post } = await undergroundService.createPost(content, { replyToId });
        // Attach reply preview from local state for optimistic display
        if (replyingTo && replyToId) {
          post.replyToId = replyToId;
          post.replyPreview = {
            id: replyingTo.id,
            nickname: replyingTo.nickname,
            content: (replyingTo.content || '').slice(0, 100),
          };
        }
        // Post will arrive via realtime, but add immediately for responsiveness
        setPosts((prev) => {
          if (prev.some((p) => p.id === post.id)) return prev;
          return [post, ...prev];
        });
        // Clear reply state
        if (replyingTo) setReplyingTo(null);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setPosting(false);
      }
    },
    [isAuthenticated, posting, replyingTo]
  );

  // Edit own post
  const editPost = useCallback(
    async (postId, newContent) => {
      if (!isAuthenticated) return;
      setError(null);

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                content: newContent,
                edited_at: new Date().toISOString(),
                editedAt: new Date().toISOString(),
              }
            : p
        )
      );
      setEditingPost(null);

      try {
        await undergroundService.editPost(postId, newContent);
      } catch (err) {
        // Revert on failure — reload from server
        setError(err.message);
        loadPosts();
      }
    },
    [isAuthenticated, loadPosts]
  );

  // Toggle reaction
  const toggleReaction = useCallback(async (postId, reaction) => {
    try {
      const { action } = await undergroundService.toggleReaction(postId, reaction);
      const camelKey = `reaction${reaction.charAt(0).toUpperCase()}${reaction.slice(1)}`;
      const snakeKey = `reaction_${reaction}`;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;

          const newReactions =
            action === 'added'
              ? [...(p.myReactions || []), reaction]
              : (p.myReactions || []).filter((r) => r !== reaction);

          const currentCount = p[camelKey] || p[snakeKey] || 0;
          const newCount = action === 'added' ? currentCount + 1 : Math.max(0, currentCount - 1);

          return {
            ...p,
            myReactions: newReactions,
            [camelKey]: newCount,
          };
        })
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Set nickname
  const submitNickname = useCallback(
    async (nickname) => {
      if (!isAuthenticated || settingNickname) return;
      setSettingNickname(true);
      setError(null);

      try {
        const result = await undergroundService.setNickname(nickname);
        setMyNickname(result.nickname);
        setNeedsNickname(false);
        // Reload posts now that we have a nickname
        loadPosts();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSettingNickname(false);
      }
    },
    [isAuthenticated, settingNickname, loadPosts]
  );

  // Delete own post (hard delete)
  const deletePost = useCallback(
    async (postId) => {
      if (!isAuthenticated) return;
      setError(null);

      // Optimistic removal
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      try {
        await undergroundService.deletePost(postId);
      } catch (err) {
        // Revert on failure — reload from server
        setError(err.message);
        loadPosts();
      }
    },
    [isAuthenticated, loadPosts]
  );

  // Auto-load on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated, loadPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    posting,
    needsNickname,
    myNickname,
    settingNickname,
    createPost,
    editPost,
    toggleReaction,
    deletePost,
    loadMore,
    submitNickname,
    refresh: loadPosts,
    userId: user?.id,
    editingPost,
    setEditingPost,
    replyingTo,
    setReplyingTo,
  };
}

export default useUnderground;
