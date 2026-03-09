// ============================================================
// COLLECTIVE SERVICE
// ============================================================
// API calls for The Collective (artist fan clubs with feed-based discussions).
// Supports E2E encryption for comments using group keys.
//
// Usage:
//   import { collectiveService } from '@/services/api/collective';
//   await collectiveService.browseCollectives('radiohead');
//   await collectiveService.getCollectiveDetail(groupId);

import { config } from '@/config';
import { logger } from '@/utils';
import * as cryptoService from '@/services/crypto';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Browse/search public collectives
 * @param {string} [query] - Optional search term
 */
async function browseCollectives(query) {
  const url = new URL(`${API_BASE}/collective/browse`);
  if (query) url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to browse collectives');
  }

  return response.json();
}

/**
 * List user's joined collectives
 */
async function getMyCollectives() {
  const response = await fetch(`${API_BASE}/collective`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load collectives');
  }

  return response.json();
}

/**
 * Join a collective by group ID (free)
 * @param {string} groupId - UUID
 */
async function joinCollective(groupId) {
  const response = await fetch(`${API_BASE}/collective/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to join collective');
  }

  return response.json();
}

/**
 * Get collective detail with analyses feed
 * @param {string} groupId - UUID
 */
async function getCollectiveDetail(groupId) {
  const response = await fetch(`${API_BASE}/collective/${groupId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load collective');
  }

  return response.json();
}

/**
 * Get paginated analyses for a collective
 * @param {string} groupId - UUID
 * @param {number} [offset] - Pagination offset
 */
async function getCollectiveAnalyses(groupId, offset = 0) {
  const url = new URL(`${API_BASE}/collective/${groupId}/analyses`);
  if (offset > 0) url.searchParams.set('offset', offset.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load analyses');
  }

  return response.json();
}

/**
 * Leave a collective
 * @param {string} groupId - UUID
 */
async function leaveCollective(groupId) {
  const response = await fetch(`${API_BASE}/collective/${groupId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to leave collective');
  }

  return response.json();
}

/**
 * Decrypt a single comment if encrypted
 * @param {Object} comment - Comment object from API
 * @param {string} groupId - Group ID for key lookup
 * @returns {Promise<Object>} Comment with decrypted content
 */
async function decryptCommentIfNeeded(comment, groupId) {
  if (!comment.isEncrypted || !comment.encryptedContent || !comment.nonce) {
    return comment;
  }

  try {
    const decrypted = await cryptoService.decryptCollectiveMessage(
      comment.encryptedContent,
      comment.nonce,
      groupId
    );

    if (decrypted) {
      return {
        ...comment,
        content: decrypted,
        decrypted: true,
      };
    }
  } catch (err) {
    logger.warn('[Collective] Failed to decrypt comment:', err.message);
  }

  return {
    ...comment,
    content: '[Unable to decrypt]',
    decryptionFailed: true,
  };
}

/**
 * Get comments for an analysis (decrypts encrypted comments)
 * @param {string} collectiveAnalysisId - UUID
 * @param {string} [groupId] - Optional group ID for decryption (will be fetched if not provided)
 */
async function getComments(collectiveAnalysisId, groupId = null) {
  const response = await fetch(`${API_BASE}/collective/analyses/${collectiveAnalysisId}/comments`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load comments');
  }

  const data = await response.json();

  // Get groupId from analysis if not provided
  const actualGroupId = groupId || data.analysis?.group_id;

  // Decrypt comments if we have a group ID
  if (actualGroupId && data.comments && data.comments.length > 0) {
    data.comments = await Promise.all(
      data.comments.map((c) => decryptCommentIfNeeded(c, actualGroupId))
    );
  }

  return data;
}

/**
 * Add a comment to an analysis (with E2E encryption if available)
 * @param {string} collectiveAnalysisId - UUID
 * @param {string} content - Comment text
 * @param {string} [parentId] - Parent comment ID for replies
 * @param {string} [groupId] - Group ID for encryption
 */
async function addComment(collectiveAnalysisId, content, parentId = null, groupId = null) {
  let body = { content };
  if (parentId) body.parentId = parentId;

  // Try to encrypt the comment if we have a group ID
  if (groupId) {
    try {
      const encrypted = await cryptoService.encryptCollectiveMessage(content, groupId);
      if (encrypted) {
        body = {
          encrypted_content: encrypted.encrypted_content,
          nonce: encrypted.nonce,
        };
        if (parentId) body.parentId = parentId;
        logger.log('[Collective] Sending encrypted comment');
      } else {
        logger.log('[Collective] Sending plaintext (encryption not available)');
      }
    } catch (err) {
      logger.warn('[Collective] Encryption failed, sending plaintext:', err.message);
    }
  }

  const response = await fetch(`${API_BASE}/collective/analyses/${collectiveAnalysisId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add comment');
  }

  return response.json();
}

/**
 * Delete a comment
 * @param {string} commentId - UUID
 */
async function deleteComment(commentId) {
  const response = await fetch(`${API_BASE}/collective/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete comment');
  }

  return response.json();
}

export {
  browseCollectives,
  getMyCollectives,
  joinCollective,
  getCollectiveDetail,
  getCollectiveAnalyses,
  leaveCollective,
  getComments,
  addComment,
  deleteComment,
};

export const collectiveService = {
  browseCollectives,
  getMyCollectives,
  joinCollective,
  getCollectiveDetail,
  getCollectiveAnalyses,
  leaveCollective,
  getComments,
  addComment,
  deleteComment,
};

export default collectiveService;
