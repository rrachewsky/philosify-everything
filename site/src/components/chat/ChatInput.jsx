// ChatInput - Text input + send button with reply bar
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function ChatInput({ onSend, sending, maxLength = 500, replyingTo, onCancelReply }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      onSend(trimmed, { replyToId: replyingTo?.id || null });
      setText('');
    },
    [text, sending, onSend, replyingTo]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape' && replyingTo) {
        onCancelReply?.();
      }
    },
    [handleSubmit, replyingTo, onCancelReply]
  );

  return (
    <div className="chat-input-wrapper">
      {/* Reply bar */}
      {replyingTo && (
        <div className="chat-reply-bar">
          <div className="chat-reply-bar__info">
            <span className="chat-reply-bar__label">{t('community.dm.replyingTo')}</span>
            <span className="chat-reply-bar__author">{replyingTo.display_name}</span>
            <span className="chat-reply-bar__text">
              {(replyingTo.message || '').slice(0, 80)}
              {(replyingTo.message || '').length > 80 ? '...' : ''}
            </span>
          </div>
          <button
            className="chat-reply-bar__cancel"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            &times;
          </button>
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? t('community.dm.typeReply') : t('community.agora.typeMessage')}
          maxLength={maxLength}
          disabled={sending}
          autoComplete="off"
          id="chat-input"
        />
        <button onClick={handleSubmit} disabled={!text.trim() || sending} id="chat-send-btn">
          {sending ? '...' : t('community.agora.send')}
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
