// Transcript pieces - v2 dialogue message (msg pattern: philosopher left,
// user right — no inverted block on this page) + philosopher poll.
// Flows ported from DebatePanel's ReplyItem / PhilosopherPoll (WP3 parity).
import { useState } from 'react';
import { getLocalizedContent } from '../../../hooks/useColloquium.js';
import { TranslateButton } from '../../../components/common/TranslateButton.jsx';
import { formatTimeAgo } from './utils.js';

export function ReplyMsg({ reply, isYou, onVote, onDelete, onEdit, t, isColloquium, lang, hasVerdict }) {
  const isOwner = reply.isOwner;
  const isPhilosopher = reply.is_philosopher;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // Colloquium replies (philosopher AND user) use translated content when available
  const displayContent = isColloquium
    ? getLocalizedContent(reply.metadata?.translations, lang, reply.content)
    : reply.content;

  // Can edit/delete: own non-philosopher replies, before verdict
  const canModify = isOwner && !isPhilosopher && !hasVerdict;

  const startEdit = () => {
    setEditText(reply.content);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setEditText('');
  };
  const saveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === reply.content) {
      cancelEdit();
      return;
    }
    setSaving(true);
    const ok = await onEdit(reply.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const who = isPhilosopher
    ? `${reply.philosopher_name} — ${t('v2.ideas.philosopherBadge', 'Philosopher')}`
    : reply.author;

  return (
    <div className={`msg${isYou ? ' you' : ''}${reply.parent_id ? ' nested' : ''}`}>
      <div className="who">{who}</div>
      {editing ? (
        <div className="b medit">
          <textarea
            className="f"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={3000}
            disabled={saving}
          />
          <div className="mmeta">
            <a onClick={cancelEdit} role="button" tabIndex={0}>
              {t('v2.ideas.cancel', 'Cancel')}
            </a>
            <a
              onClick={saving || !editText.trim() ? undefined : saveEdit}
              role="button"
              tabIndex={0}
              className={saving || !editText.trim() ? 'off' : ''}
            >
              {saving ? '…' : t('v2.ideas.saveEdit', 'Save')}
            </a>
          </div>
        </div>
      ) : (
        <div className="b">{displayContent}</div>
      )}
      <div className="mmeta">
        <span>{formatTimeAgo(reply.created_at, t)}</span>
        {reply.edited_at && <span>{t('v2.ideas.edited', 'Edited')}</span>}
        <a
          onClick={() => onVote(reply.id, reply.myVote === 'up' ? null : 'up')}
          role="button"
          tabIndex={0}
          className={reply.myVote === 'up' ? 'on' : ''}
        >
          ▲ {reply.upvotes || 0}
        </a>
        <a
          onClick={() => onVote(reply.id, reply.myVote === 'down' ? null : 'down')}
          role="button"
          tabIndex={0}
          className={reply.myVote === 'down' ? 'on' : ''}
        >
          ▽ {reply.downvotes || 0}
        </a>
        {canModify && !editing && (
          <>
            <a onClick={startEdit} role="button" tabIndex={0}>
              {t('v2.ideas.editReply', 'Edit')}
            </a>
            <a onClick={() => onDelete(reply.id)} role="button" tabIndex={0}>
              {t('v2.ideas.deleteReply', 'Delete')}
            </a>
          </>
        )}
      </div>
      {/* Only on user replies, not on pre-translated AI content */}
      {!editing && !(isColloquium && isPhilosopher) && <TranslateButton text={reply.content} />}
    </div>
  );
}

export function PhilosopherPoll({ philosophers, poll, onVote, threadId, t }) {
  if (!philosophers || philosophers.length === 0) return null;

  const tallies = poll?.tallies || {};
  const myVote = poll?.myVote || null;
  const totalVotes = poll?.totalVotes || 0;

  return (
    <div className="ipoll">
      <div className="ipoll-head">
        <span>{t('v2.ideas.pollTitle', 'Who argued best?')}</span>
        <span className="ipoll-total">
          {totalVotes}{' '}
          {totalVotes === 1 ? t('v2.ideas.pollVote', 'vote') : t('v2.ideas.pollVotes', 'votes')}
        </span>
      </div>
      {philosophers.map((name) => {
        const count = tallies[name] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMyVote = myVote === name;
        return (
          <button
            key={name}
            className={`ipoll-row${isMyVote ? ' voted' : ''}`}
            onClick={() => onVote(threadId, name)}
            type="button"
          >
            <span className="ipoll-name">
              {name}
              {isMyVote ? ` — ${t('v2.ideas.yourVote', 'Your vote')}` : ''}
            </span>
            <span className="ipoll-bar">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="ipoll-pct">
              {pct}% ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
