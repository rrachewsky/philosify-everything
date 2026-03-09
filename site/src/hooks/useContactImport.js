// ============================================================
// useContactImport - Hook for importing phone contacts
// ============================================================
// Uses the Contact Picker API (Chrome Android) to read contacts,
// then matches phone numbers against Philosify profiles.
// Falls back gracefully when API is unavailable.

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../config';
import { logger } from '../utils';

// Check if Contact Picker API is available
export function isContactPickerSupported() {
  return 'contacts' in navigator && 'ContactsManager' in window;
}

// Normalize phone number to E.164 (best effort)
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  // Strip everything except digits and leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // If no leading +, assume it might be missing country code
  if (!cleaned.startsWith('+')) {
    // If it starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    }
    // Otherwise, we can't reliably determine country code; keep as-is
    // The backend will validate E.164 format
  }
  return cleaned.length >= 7 ? cleaned : null;
}

export function useContactImport() {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const [matches, setMatches] = useState([]); // matched Philosify users
  const [unmatched, setUnmatched] = useState([]); // contacts not on Philosify
  const [error, setError] = useState(null);
  const [hasImported, setHasImported] = useState(false);

  const supported = isContactPickerSupported();

  // Import contacts using the Contact Picker API
  const importContacts = useCallback(async () => {
    if (!supported) {
      setError('Contact Picker API not supported on this device');
      return;
    }

    setImporting(true);
    setError(null);
    setMatches([]);
    setUnmatched([]);

    try {
      // Request contacts with name and phone number
      const contacts = await navigator.contacts.select(['name', 'tel'], {
        multiple: true,
      });

      if (!contacts || contacts.length === 0) {
        setImporting(false);
        return;
      }

      logger.log(`[ContactImport] Selected ${contacts.length} contacts`);

      // Extract all phone numbers with associated names
      const contactsWithPhones = [];
      const phoneNumbers = [];

      for (const contact of contacts) {
        const name = contact.name?.[0] || 'Unknown';
        const phones = contact.tel || [];
        for (const phone of phones) {
          const normalized = normalizePhone(phone);
          if (normalized) {
            phoneNumbers.push(normalized);
            contactsWithPhones.push({ name, phone: normalized, originalPhone: phone });
          }
        }
      }

      if (phoneNumbers.length === 0) {
        setError('No valid phone numbers found in selected contacts');
        setImporting(false);
        return;
      }

      logger.log(`[ContactImport] Sending ${phoneNumbers.length} numbers for matching`);

      // Send to backend for matching
      const res = await fetch(`${config.apiUrl}/api/contacts/match`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to match contacts');
      }

      const data = await res.json();
      const matchedIds = new Set((data.matches || []).map((m) => m.id));

      // Separate matched and unmatched contacts
      const matchedUsers = data.matches || [];
      const unmatchedContacts = [];
      const seenPhones = new Set();

      for (const c of contactsWithPhones) {
        if (seenPhones.has(c.phone)) continue;
        seenPhones.add(c.phone);

        // Check if this phone matched any user
        matchedUsers.some(() => {
          // We don't have the phone back from API (privacy), so we just know the count
          return false; // We use the matchedIds set instead
        });

        if (!matchedIds.size) {
          unmatchedContacts.push({ name: c.name, phone: c.originalPhone });
        }
      }

      // Build unmatched list: contacts minus matched users
      // Since the API doesn't return which phone matched which user,
      // we list all contacts whose names don't match any returned displayName
      const matchedNames = new Set(matchedUsers.map((m) => (m.displayName || '').toLowerCase()));
      const uniqueUnmatched = [];
      const seenNames = new Set();

      for (const c of contactsWithPhones) {
        const lowerName = c.name.toLowerCase();
        if (seenNames.has(lowerName)) continue;
        seenNames.add(lowerName);
        if (!matchedNames.has(lowerName)) {
          uniqueUnmatched.push({ name: c.name, phone: c.originalPhone });
        }
      }

      setMatches(matchedUsers);
      setUnmatched(uniqueUnmatched);
      setHasImported(true);

      logger.log(
        `[ContactImport] ${matchedUsers.length} matches, ${uniqueUnmatched.length} unmatched`
      );
    } catch (err) {
      logger.warn('[ContactImport] Error:', err.message);
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }, [supported]);

  // Generate an invite link for a non-user contact
  const getInviteLink = useCallback(() => {
    return `${window.location.origin}/?ref=contact`;
  }, []);

  // Share invite via native share or WhatsApp (in sender's language)
  const shareInvite = useCallback(
    async (contactName) => {
      const link = getInviteLink();
      const text = t('community.people.inviteText', { name: contactName, link });

      // Try native Web Share API first
      if (navigator.share) {
        try {
          await navigator.share({ text });
          return true;
        } catch {
          // User cancelled or API failed, fall back to WhatsApp
        }
      }

      // Fall back to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return true;
    },
    [getInviteLink, t]
  );

  const clearResults = useCallback(() => {
    setMatches([]);
    setUnmatched([]);
    setHasImported(false);
    setError(null);
  }, []);

  return {
    supported,
    importing,
    matches,
    unmatched,
    error,
    hasImported,
    importContacts,
    shareInvite,
    clearResults,
  };
}

export default useContactImport;
