// COMPREHENSIVE ERROR KEYS FOR MIGRATION
// This file contains all error keys needed for the 23-file migration

export const NEW_ERROR_KEYS = {
  // Collective Comments (collective-comments.js)
  ANALYSIS_NOT_FOUND: 'Analysis not found',
  COLLECTIVE_MEMBERSHIP_REQUIRED: 'Join the collective to view comments',
  FAILED_TO_LOAD_COMMENTS: 'Failed to load comments',
  TOO_MANY_COMMENTS: 'Too many comments. Please slow down.',
  COLLECTIVE_COMMENT_MEMBERSHIP_REQUIRED: 'Join the collective to comment',
  ENCRYPTED_CONTENT_TOO_LARGE: 'Encrypted content too large',
  COMMENT_TOO_LONG: 'Comment required (max 2000 chars)',
  LINKS_NOT_ALLOWED: 'Links are not allowed in comments.',
  PARENT_COMMENT_NOT_FOUND: 'Parent comment not found',
  REPLY_DEPTH_EXCEEDED: 'Can only reply to top-level comments',
  FAILED_TO_ADD_COMMENT: 'Failed to add comment',
  COMMENT_NOT_FOUND: 'Comment not found',
  CANNOT_DELETE_OTHERS_COMMENTS: 'Cannot delete others\' comments',
  FAILED_TO_DELETE_COMMENT: 'Failed to delete comment',
  
  // Colloquium (colloquium.js)
  COLLOQUIUM_NAME_TOO_LONG: 'Panel name too long (max 100 chars)',
  COLLOQUIUM_NOT_FOUND: 'Panel not found',
  PHILOSOPHERS_REQUIRED: 'At least 3 philosophers required',
  TOO_MANY_PHILOSOPHERS: 'Maximum 7 philosophers allowed',
  DUPLICATE_PHILOSOPHERS: 'Cannot add same philosopher twice',
  FAILED_TO_CREATE_PANEL: 'Failed to create panel',
  PHILOSOPHER_NOT_FOUND: 'Philosopher not found in this panel',
  FAILED_TO_REMOVE_PHILOSOPHER: 'Failed to remove philosopher',
  FAILED_TO_ADD_PHILOSOPHER: 'Failed to add philosopher',
  PANEL_ALREADY_PUBLISHED: 'Panel already has published verdicts',
  FAILED_TO_DELETE_PANEL: 'Failed to delete panel',
  THREAD_NOT_FOUND: 'Discussion thread not found',
  MESSAGE_TOO_LONG: 'Message too long (max 2000 chars)',
  FAILED_TO_SEND_MESSAGE: 'Failed to send message',
  MESSAGE_NOT_FOUND: 'Message not found',
  CANNOT_DELETE_OTHERS_MESSAGES: 'Can only delete your own messages',
  FAILED_TO_DELETE_MESSAGE: 'Failed to delete message',
  VERDICT_NOT_FOUND: 'Verdict not found',
  FAILED_TO_GENERATE_VERDICT: 'Failed to generate verdict',
  FAILED_TO_LOAD_PANEL: 'Failed to load panel details',
  FAILED_TO_LOAD_THREADS: 'Failed to load discussion threads',
  FAILED_TO_LOAD_MESSAGES: 'Failed to load messages',
  INVALID_PHILOSOPHER_NAME: 'Invalid philosopher name',
  
  // Profile (profile.js)
  DISPLAY_NAME_TOO_LONG: 'Display name too long (max 50 chars)',
  BIO_TOO_LONG: 'Bio too long (max 500 chars)',
  INVALID_AVATAR_URL: 'Invalid avatar URL',
  FAILED_TO_UPDATE_PROFILE: 'Failed to update profile',
  FAILED_TO_LOAD_PROFILE: 'Failed to load profile',
  USERNAME_TAKEN: 'Username already taken',
  INVALID_USERNAME: 'Invalid username format',
  FAILED_TO_DELETE_ACCOUNT: 'Failed to delete account',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password too weak (min 8 chars)',
  FAILED_TO_CHANGE_PASSWORD: 'Failed to change password',
  FAILED_TO_UPLOAD_AVATAR: 'Failed to upload avatar',
  FILE_TOO_LARGE: 'File too large (max 2MB)',
  INVALID_FILE_TYPE: 'Invalid file type (only JPG, PNG allowed)',
  FAILED_TO_SAVE_PREFERENCES: 'Failed to save preferences',
  
  // Book/Cinema Analysis Detail
  BOOK_NOT_FOUND: 'Book analysis not found',
  FILM_NOT_FOUND: 'Film analysis not found',
  FAILED_TO_LOAD_ANALYSIS: 'Failed to load analysis',
  FAILED_TO_LOAD_BOOK: 'Failed to load book analysis',
  FAILED_TO_LOAD_FILM: 'Failed to load film analysis',
  ANALYSIS_INCOMPLETE: 'Analysis not yet complete',
  ANALYSIS_DELETED: 'Analysis has been deleted',
  
  // Spaces (spaces.js)
  SPACE_NAME_REQUIRED: 'Space name required',
  SPACE_NAME_TOO_LONG: 'Space name too long (max 100 chars)',
  SPACE_NOT_FOUND: 'Space not found',
  NOT_SPACE_OWNER: 'Only space owner can perform this action',
  FAILED_TO_CREATE_SPACE: 'Failed to create space',
  FAILED_TO_UPDATE_SPACE: 'Failed to update space',
  FAILED_TO_DELETE_SPACE: 'Failed to delete space',
  FAILED_TO_LOAD_SPACES: 'Failed to load spaces',
  ALREADY_MEMBER: 'Already a member of this space',
  NOT_A_MEMBER: 'Not a member of this space',
  
  // News (news-headlines.js, news-translate.js, news-tts.js)
  INVALID_LANGUAGE: 'Invalid language code',
  FAILED_TO_LOAD_NEWS: 'Failed to load news',
  FAILED_TO_TRANSLATE: 'Failed to translate content',
  TRANSLATION_FAILED: 'Translation failed',
  TTS_GENERATION_FAILED: 'Text-to-speech generation failed',
  ARTICLE_TOO_LONG: 'Article too long for TTS',
  UNSUPPORTED_LANGUAGE_TTS: 'Language not supported for TTS',
  FAILED_TO_GENERATE_AUDIO: 'Failed to generate audio',
  
  // Contacts (contacts.js)
  CONTACT_NAME_REQUIRED: 'Contact name required',
  CONTACT_EMAIL_INVALID: 'Invalid email address',
  MESSAGE_REQUIRED: 'Message required',
  MESSAGE_TOO_SHORT: 'Message too short (min 10 chars)',
  FAILED_TO_SEND_CONTACT: 'Failed to send message',
  SPAM_DETECTED: 'Spam detected',
  
  // Search & Film Search
  QUERY_REQUIRED: 'Search query required',
  QUERY_TOO_SHORT: 'Query too short (min 2 chars)',
  FAILED_TO_SEARCH: 'Search failed',
  SEARCH_TIMEOUT: 'Search took too long',
  NO_RESULTS: 'No results found',
  
  // Top Lists (top10.js, books-top.js, cinema-top.js)
  FAILED_TO_LOAD_TOP_LIST: 'Failed to load top list',
  INVALID_TIME_PERIOD: 'Invalid time period',
  INVALID_CATEGORY: 'Invalid category',
  
  // History (history-graph.js, user-history.js, panel-history.js)
  FAILED_TO_LOAD_HISTORY: 'Failed to load history',
  INVALID_DATE_RANGE: 'Invalid date range',
  HISTORY_NOT_AVAILABLE: 'History not available',
  
  // Ads (ads/agency.js)
  AD_NOT_FOUND: 'Advertisement not found',
  INVALID_AD_CONFIG: 'Invalid ad configuration',
  
  // TTS (tts.js)
  TEXT_REQUIRED: 'Text required for TTS',
  TEXT_TOO_LONG_TTS: 'Text too long for TTS (max 5000 chars)',
  
  // Daily Question (daily-question.js)
  QUESTION_NOT_AVAILABLE: 'Daily question not yet available',
  
  // Generic/Common
  DATABASE_ERROR: 'Database error',
  MISSING_PARAMETER: 'Missing required parameter',
  INVALID_FORMAT: 'Invalid format',
  OPERATION_FAILED: 'Operation failed',
  FORBIDDEN: 'Forbidden',
  TIMEOUT: 'Request timeout',
};
