// Ideas v2 feed cards - session matchup cells per the ideas mockup
// ("COLLOQUIUM NNNN // MATCHUP" cards + "DEBATE // TITLE" cards).
// Data flows ported from DebatePanel's ColloquiumListItem / DebateListItem.
import { getLocalizedContent } from '../../../hooks/useColloquium.js';
import { formatTimeAgo, formatCountdown } from './utils.js';

function excerpt(text) {
  if (!text) return '';
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
}

export function ColloquiumCard({ item, onOpen, t, lang, featured = false }) {
  const isEnded = item.has_verdict;
  const collType = item.metadata?.colloquium_type || item.colloquium_type;
  const isDaily = collType === 'daily';
  const isOpenDebate = collType === 'open_debate';
  const philosophers = item.philosophers || [];
  const prices = item.philosopher_prices || {};
  const userAddedSet = new Set(
    item.user_added_philosophers || item.metadata?.user_added_philosophers || []
  );
  const access = item.access || {};
  // Open debates have no countdown (proposer triggers the verdict manually)
  const countdown = !isEnded && !isDaily && !isOpenDebate ? formatCountdown(item.verdict_at) : null;

  const localizedTitle = getLocalizedContent(item.translations?.title, lang, item.title);
  const text = getLocalizedContent(item.translations?.content, lang, item.excerpt);

  const tag = isOpenDebate
    ? t('v2.ideas.openDebateTag', 'OPEN DEBATE')
    : t('v2.ideas.colloquiumTag', 'COLLOQUIUM');
  // Matchup headline for the daily session ("ARISTOTLE VS. KANT")
  const matchup =
    isDaily && philosophers.length >= 2
      ? philosophers.map((n) => n.toUpperCase()).join(` ${t('v2.ideas.versus', 'VS.')} `)
      : null;

  const meta = [];
  if (isOpenDebate) meta.push(t('v2.ideas.badgeOpenDebate', 'Open debate'));
  else if (isDaily) meta.push(t('v2.ideas.badgeDaily', 'Daily by the system'));
  else meta.push(t('v2.ideas.badgeUser', 'Proposed by a user'));
  if (item.visibility === 'closed') meta.push(t('v2.ideas.badgeClosed', 'Private'));
  if (access.hasAccess && !isOpenDebate) meta.push(t('v2.ideas.unlocked', 'Unlocked'));
  meta.push(
    t('v2.ideas.repliesCount', { defaultValue: '{{count}} replies', count: item.reply_count || 0 })
  );
  if (countdown)
    meta.push(
      t('v2.ideas.countdownRemaining', { defaultValue: '{{time}} remaining', time: countdown })
    );

  return (
    <a
      className={`cell icard${featured ? ' featured' : ''}${isEnded ? ' ended' : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onOpen(item.id, 'colloquium');
      }}
      href={`/ideas?debate=${item.id}`}
    >
      <h2>
        {tag} {'//'} {matchup || localizedTitle}
      </h2>
      {matchup && <p>{localizedTitle}</p>}
      {featured && (
        <p>
          {t(
            'v2.ideas.dailyExplainer',
            'Generated daily by the system. One question, two thinkers in character, timestamped transcript, synthesis panel at the end. A new colloquium replaces this one tomorrow; past ones remain readable.'
          )}
        </p>
      )}
      {!featured && text && <p>{excerpt(text)}</p>}
      {philosophers.length > 0 && !matchup && (
        <div className="chips">
          {philosophers.map((name) => (
            <span key={name} className={`pill${userAddedSet.has(name) ? ' star' : ''}`}>
              {userAddedSet.has(name) ? '★ ' : ''}
              {name} · {prices[name] || 2}
              {t('v2.ideas.creditAbbr', 'cr')}
            </span>
          ))}
        </div>
      )}
      <div className="cmeta">
        <span>{meta.join(' · ')}</span>
        <span>
          {isOpenDebate ? (
            t('v2.ideas.freeToRead', 'Free to read')
          ) : !access.hasAccess ? (
            <span className="hl">{t('v2.ideas.creditToAccess', '1 credit to access')}</span>
          ) : isEnded ? (
            t('v2.ideas.statusArchived', 'Archived')
          ) : (
            t('v2.ideas.statusActive', 'Active')
          )}
          {' · '}
          {formatTimeAgo(item.created_at, t)}
        </span>
      </div>
    </a>
  );
}

export function DebateCard({ debate, onOpen, t }) {
  const isEnded = !!debate.wrapup;
  return (
    <a
      className={`cell icard${isEnded ? ' ended' : ''}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onOpen(debate.id, 'debate');
      }}
      href={`/ideas?debate=${debate.id}`}
    >
      <h2>
        {t('v2.ideas.debateTag', 'DEBATE')} {'//'} {debate.title}
      </h2>
      {debate.content && <p>{excerpt(debate.content)}</p>}
      <div className="cmeta">
        <span>
          {t('v2.ideas.openedBy', { defaultValue: 'Opened by {{name}}', name: debate.author })}
          {' · '}
          {t('v2.ideas.repliesCount', {
            defaultValue: '{{count}} replies',
            count: debate.reply_count || 0,
          })}
        </span>
        <span>
          {isEnded ? (
            t('v2.ideas.statusArchived', 'Archived')
          ) : (
            <span className="hl">{t('v2.ideas.statusActive', 'Active')}</span>
          )}
          {' · '}
          {formatTimeAgo(debate.created_at, t)}
        </span>
      </div>
    </a>
  );
}
