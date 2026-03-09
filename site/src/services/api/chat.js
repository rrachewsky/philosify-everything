// ============================================================
// CHAT SERVICE
// ============================================================
// API calls for global chat functionality.
//
// Usage:
//   import { chatService } from '@/services/api/chat';
//   const { messages } = await chatService.getMessages();
//   await chatService.sendMessage('Hello!');

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Fetch recent global chat messages
 * @param {string} [before] - ISO timestamp cursor for pagination
 */
async function getMessages(before) {
  const url = new URL(`${API_BASE}/chat`);
  if (before) {
    url.searchParams.set('before', before);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load messages');
  }

  return response.json();
}

/**
 * Send a global chat message
 * @param {string} message - Message text (1-500 chars)
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.replyToId] - UUID of message being replied to
 */
async function sendMessage(message, options = {}) {
  const body = { message };
  if (options.replyToId) {
    body.reply_to_id = options.replyToId;
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Edit own global chat message
 * @param {string} messageId - UUID
 * @param {string} newMessage - Updated message text
 */
async function editMessage(messageId, newMessage) {
  const response = await fetch(`${API_BASE}/chat/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: newMessage }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to edit message');
  }

  return response.json();
}

/**
 * Delete own global chat message (hard delete)
 * @param {string} messageId - UUID
 */
async function deleteMessage(messageId) {
  const response = await fetch(`${API_BASE}/chat/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete message');
  }

  return response.json();
}

export { getMessages, sendMessage, editMessage, deleteMessage };

export const chatService = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};

export default chatService;
