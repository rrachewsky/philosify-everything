// PeoplePanel - Community Members Directory
// Two sections: "In Your Collectives" (sorted by shared count) and "All Members" (alphabetical)
// Includes "Find Friends" contact import (Contact Picker API on supported devices)
// Click any member to start a DM conversation
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { useContactImport } from '@hooks/useContactImport.js';

// Language code -> flag emoji mapping
const LANG_FLAGS = {
  en: '\u{1F1FA}\u{1F1F8}', // US
  pt: '\u{1F1E7}\u{1F1F7}', // Brazil
  es: '\u{1F1EA}\u{1F1F8}', // Spain
  fr: '\u{1F1EB}\u{1F1F7}', // France
  de: '\u{1F1E9}\u{1F1EA}', // Germany
  it: '\u{1F1EE}\u{1F1F9}', // Italy
  ru: '\u{1F1F7}\u{1F1FA}', // Russia
  ja: '\u{1F1EF}\u{1F1F5}', // Japan
  ko: '\u{1F1F0}\u{1F1F7}', // Korea
  zh: '\u{1F1E8}\u{1F1F3}', // China
  hi: '\u{1F1EE}\u{1F1F3}', // India
  ar: '\u{1F1F8}\u{1F1E6}', // Saudi Arabia
  he: '\u{1F1EE}\u{1F1F1}', // Israel
  nl: '\u{1F1F3}\u{1F1F1}', // Netherlands
  pl: '\u{1F1F5}\u{1F1F1}', // Poland
  tr: '\u{1F1F9}\u{1F1F7}', // Turkey
  hu: '\u{1F1ED}\u{1F1FA}', // Hungary
  fa: '\u{1F1EE}\u{1F1F7}', // Iran
};

function MemberItem({ member, onStartDM, isOnline, t }) {
  const flag = member.language ? LANG_FLAGS[member.language] || null : null;
  const online = isOnline ? isOnline(member.id) : false;

  return (
    <div
      className="people-member"
      onClick={() => onStartDM(member.id, member.displayName)}
      role="button"
      tabIndex={0}
    >
      <div className="people-member__avatar">
        {(member.displayName || '?')[0].toUpperCase()}
        {online && <span className="people-member__online-dot" />}
      </div>
      <div className="people-member__info">
        <span className="people-member__name">
          {member.displayName}
          {flag && <span className="people-member__flag">{flag}</span>}
        </span>
        {member.sharedCollectives > 0 && (
          <span className="people-member__shared">
            {member.sharedCollectives === 1
              ? t('community.people.sharedCollective', { count: member.sharedCollectives })
              : t('community.people.sharedCollectives', { count: member.sharedCollectives })}
          </span>
        )}
      </div>
    </div>
  );
}

// Greeting translations keyed by language code (receiver's language)
const ADD_GREETINGS = {
  en: 'Hi! I added you on Philosify.',
  pt: 'Oi! Te adicionei no Philosify.',
  es: 'Hola! Te agregué en Philosify.',
  fr: "Salut ! Je t'ai ajouté sur Philosify.",
  de: 'Hallo! Ich habe dich auf Philosify hinzugefügt.',
  it: 'Ciao! Ti ho aggiunto su Philosify.',
  ru: 'Привет! Я добавил тебя в Philosify.',
  ja: 'こんにちは！Philosifyであなたを追加しました。',
  ko: '안녕하세요! Philosify에서 추가했어요.',
  zh: '你好！我在Philosify上添加了你。',
  ar: 'مرحبا! أضفتك على Philosify.',
  hi: 'नमस्ते! मैंने आपको Philosify पर जोड़ा।',
  he: 'שלום! הוספתי אותך ב-Philosify.',
  nl: 'Hoi! Ik heb je toegevoegd op Philosify.',
  pl: 'Cześć! Dodałem cię na Philosify.',
  tr: "Merhaba! Seni Philosify'da ekledim.",
  hu: 'Szia! Hozzáadtalak a Philosify-on.',
  fa: 'سلام! تو را در Philosify اضافه کردم.',
};

export function PeoplePanel({ onStartDM, isOnline, onlineCount = 0 }) {
  const { t } = useTranslation();
  const [inCollectives, setInCollectives] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [pendingAddId, setPendingAddId] = useState(null); // confirm/cancel state
  const contactImport = useContactImport();

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.apiUrl}/api/people`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load members');
      }
      const data = await res.json();
      setInCollectives(data.inCollectives || []);
      setAllMembers(data.allMembers || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  if (loading) {
    return (
      <div className="people-panel">
        <div className="people-panel__empty">{t('community.people.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="people-panel">
        <div className="people-panel__error">{error}</div>
        <button className="people-panel__retry" onClick={loadPeople}>
          {t('community.people.tryAgain')}
        </button>
      </div>
    );
  }

  // Client-side search filter
  const filterFn = (member) =>
    !searchFilter || (member.displayName || '').toLowerCase().includes(searchFilter.toLowerCase());
  const filteredCollectives = inCollectives.filter(filterFn);
  const filteredMembers = allMembers.filter(filterFn);

  return (
    <div className="people-panel">
      <div className="people-panel__count">
        {totalCount === 1
          ? t('community.people.memberCountSingular')
          : t('community.people.memberCount', { count: totalCount })}
        {onlineCount > 0 && (
          <span className="people-panel__online-count">
            <span className="people-panel__online-dot" />
            {onlineCount} {t('community.people.online')}
          </span>
        )}
      </div>

      {/* Search field */}
      <div className="people-panel__search">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={t('community.people.searchMembers')}
          className="people-panel__search-input"
        />
      </div>

      {/* Find Friends - Contact Import */}
      {contactImport.supported && (
        <div className="people-section people-section--find-friends">
          {!contactImport.hasImported ? (
            <button
              className="people-find-friends-btn"
              onClick={contactImport.importContacts}
              disabled={contactImport.importing}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              {contactImport.importing
                ? t('community.people.findingFriends')
                : t('community.people.findFriends')}
            </button>
          ) : (
            <>
              {/* Matched contacts - already on Philosify */}
              {contactImport.matches.length > 0 && (
                <div className="people-section">
                  <div className="people-section__header">
                    {t('community.people.friendsOnPhilosify')}
                    {contactImport.matches.length > 1 && (
                      <button
                        className="people-add-all-btn"
                        onClick={() => {
                          contactImport.matches.forEach((match) => {
                            onStartDM(match.id, match.displayName);
                          });
                        }}
                      >
                        {t('community.people.addAll')}
                      </button>
                    )}
                  </div>
                  <div className="people-section__list">
                    {contactImport.matches.map((match) => (
                      <div key={match.id} className="people-member people-member--contact">
                        <div
                          className="people-member__clickable"
                          onClick={() => onStartDM(match.id, match.displayName)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="people-member__avatar">
                            {(match.displayName || '?')[0].toUpperCase()}
                            {isOnline && isOnline(match.id) && (
                              <span className="people-member__online-dot" />
                            )}
                          </div>
                          <div className="people-member__info">
                            <span className="people-member__name">{match.displayName}</span>
                          </div>
                        </div>
                        {pendingAddId === match.id ? (
                          <div className="people-add-confirm">
                            <button
                              className="people-add-confirm__yes"
                              onClick={() => {
                                setPendingAddId(null);
                                const greeting = ADD_GREETINGS[match.language] || ADD_GREETINGS.en;
                                onStartDM(match.id, match.displayName, { greeting });
                              }}
                              title={t('community.people.confirmAdd')}
                            >
                              &#10003;
                            </button>
                            <button
                              className="people-add-confirm__no"
                              onClick={() => setPendingAddId(null)}
                              title={t('community.people.cancelAdd')}
                            >
                              &#10005;
                            </button>
                          </div>
                        ) : (
                          <button
                            className="people-add-btn"
                            onClick={() => setPendingAddId(match.id)}
                          >
                            {t('community.people.add')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Unmatched contacts - invite them */}
              {contactImport.unmatched.length > 0 && (
                <div className="people-section">
                  <div className="people-section__header">
                    {t('community.people.inviteFriends')}
                  </div>
                  <div className="people-section__list">
                    {contactImport.unmatched.map((contact, idx) => (
                      <div key={idx} className="people-member people-member--invite">
                        <div className="people-member__avatar people-member__avatar--invite">
                          {(contact.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="people-member__info">
                          <span className="people-member__name">{contact.name}</span>
                        </div>
                        <button
                          className="people-invite-btn"
                          onClick={() => contactImport.shareInvite(contact.name)}
                        >
                          {t('community.people.invite')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {contactImport.matches.length === 0 && contactImport.unmatched.length === 0 && (
                <div className="people-panel__empty">{t('community.people.noContactMatches')}</div>
              )}
              <button
                className="people-find-friends-btn people-find-friends-btn--small"
                onClick={contactImport.clearResults}
              >
                {t('community.people.clearContacts')}
              </button>
            </>
          )}
          {contactImport.error && (
            <div className="people-panel__error" style={{ marginTop: '8px' }}>
              {contactImport.error}
            </div>
          )}
        </div>
      )}

      {/* In Your Collectives section */}
      {filteredCollectives.length > 0 && (
        <div className="people-section">
          <div className="people-section__header">{t('community.people.inYourCollectives')}</div>
          <div className="people-section__list">
            {filteredCollectives.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                onStartDM={onStartDM}
                isOnline={isOnline}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Members section */}
      {filteredMembers.length > 0 && (
        <div className="people-section">
          <div className="people-section__header">
            {filteredCollectives.length > 0
              ? t('community.people.allMembers')
              : t('community.people.membersLabel')}
          </div>
          <div className="people-section__list">
            {filteredMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                onStartDM={onStartDM}
                isOnline={isOnline}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {searchFilter && filteredCollectives.length === 0 && filteredMembers.length === 0 && (
        <div className="people-panel__empty">{t('community.dm.noResults')}</div>
      )}

      {!searchFilter && totalCount === 0 && (
        <div className="people-panel__empty">{t('community.people.noMembers')}</div>
      )}
    </div>
  );
}

export default PeoplePanel;
