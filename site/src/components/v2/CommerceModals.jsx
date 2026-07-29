// CommerceModals - shared v2 transaction modals (Buy Credits + quick History),
// mounted once per page via <V2ModalsHost/>. Opened by window events:
//   v2-open-buy-credits   v2-open-history
// Buy Credits binds the live packs (Addendum 3): USD packs from
// CREDIT_PACKAGES via GET /api/pricing localization; checkout via the
// existing Stripe service (unchanged underneath).
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ModalV2 } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Pill } from './Pill.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { useLocalizedPricing, formatLocalPrice } from '../../hooks/useLocalizedPricing';
import { CREDIT_PACKAGES } from '../../utils/constants';
import { getApiUrl } from '../../config';

export function V2ModalsHost() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { balance, purchaseCredits } = useCreditsContext();
  const [open, setOpen] = useState(null); // 'buy' | 'history' | null
  const [busyTier, setBusyTier] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState(false);
  const pricing = useLocalizedPricing(open === 'buy');

  useEffect(() => {
    const openBuy = () => setOpen('buy');
    const openHistory = () => setOpen('history');
    window.addEventListener('v2-open-buy-credits', openBuy);
    window.addEventListener('v2-open-history', openHistory);
    return () => {
      window.removeEventListener('v2-open-buy-credits', openBuy);
      window.removeEventListener('v2-open-history', openHistory);
    };
  }, []);

  const loadHistory = useCallback(async (retried = false) => {
    setHistoryError(false);
    try {
      const res = await fetch(`${getApiUrl()}/api/user-history`, { credentials: 'include' });
      if (res.status === 401 && !retried) {
        await fetch(`${getApiUrl().replace(/\/$/, '')}/auth/session`, { credentials: 'include' });
        return loadHistory(true);
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setHistory(data.items || data.history || data);
    } catch {
      setHistoryError(true);
    }
  }, []);

  useEffect(() => {
    if (open === 'history' && isAuthenticated) loadHistory();
  }, [open, isAuthenticated, loadHistory]);

  const buy = async (pack) => {
    setBusyTier(pack.tier);
    try {
      await purchaseCredits(pack.amount); // redirects to Stripe Checkout
    } finally {
      setBusyTier(null);
    }
  };

  // History replay — Addendum 1: rows navigate to URL targets.
  const replay = (item) => {
    setOpen(null);
    const id = item.id || item.analysisId;
    const kind = item.kind;
    const mt = item.mediaType || item.media_type;
    if (kind === 'debate') return navigate(`/ideas?debate=${id}`);
    if (kind === 'unsafe-zone') return navigate(`/unsafe-zone?session=${id}`);
    if (kind === 'quiz') return navigate('/quiz');
    if (kind === 'panel') return navigate(`/${mt === 'book' ? 'literature' : mt === 'film' ? 'cinema' : mt === 'news' ? 'news' : 'music'}?panel=${id}`);
    if (mt === 'book') return navigate(`/literature?analysis=${id}`);
    if (mt === 'film' || mt === 'cinema') return navigate(`/cinema?analysis=${id}`);
    if (mt === 'news') return navigate(`/news?analysis=${id}`);
    return navigate(`/music?analysis=${id}`);
  };

  const price = (pack) => {
    if (pricing?.currency && Array.isArray(pricing.packages)) {
      const local = pricing.packages.find((p) => String(p.tier) === String(pack.tier));
      if (local) {
        const shown = formatLocalPrice(local.amountLocal, pricing.currency, i18n.language);
        return pricing.approximate && pricing.currency !== 'USD' ? `≈ ${shown}` : shown;
      }
    }
    return `$ ${pack.amount.toFixed(2)}`;
  };

  return (
    <>
      <ModalV2
        open={open === 'buy'}
        title={t('v2.commerce.buyCredits', 'BUY CREDITS')}
        onClose={() => setOpen(null)}
        footer={
          <Button variant="secondary" onClick={() => setOpen(null)}>
            {t('v2.commerce.cancel', 'Cancel')}
          </Button>
        }
      >
        <div className="packs">
          {CREDIT_PACKAGES.map((pack, i) => (
            <a
              key={pack.tier}
              className="cell pack"
              href="#pack"
              style={{ position: 'relative', opacity: busyTier && busyTier !== pack.tier ? 0.5 : 1 }}
              onClick={(e) => {
                e.preventDefault();
                if (!busyTier) buy(pack);
              }}
            >
              {i === 1 && <span className="best">{t('v2.commerce.bestValue', 'Best value')}</span>}
              <span className="n">{pack.credits}</span>
              <span className="u">{t('v2.commerce.credits', 'Credits')}</span>
              <span className="pr">{busyTier === pack.tier ? '…' : price(pack)}</span>
            </a>
          ))}
        </div>
        <div className="mnote">
          {t(
            'v2.commerce.note',
            'Prices bind to live Stripe products. Any action that spends credits shows its cost before the click.'
          )}
          {balance ? ` · ${t('v2.nav.balance', 'Balance')}: ${balance.total}` : ''}
        </div>
      </ModalV2>

      <ModalV2
        open={open === 'history'}
        title={t('v2.commerce.history', 'HISTORY')}
        onClose={() => setOpen(null)}
      >
        {historyError && (
          <div className="mnote">{t('v2.commerce.historyError', 'Could not load history.')}</div>
        )}
        {!historyError && !history && (
          <div className="mnote">{t('v2.commerce.loading', 'Loading…')}</div>
        )}
        {Array.isArray(history) &&
          history.slice(0, 30).map((item, idx) => (
            <a
              key={item.id || idx}
              className="hrow"
              href="#row"
              onClick={(e) => {
                e.preventDefault();
                replay(item);
              }}
            >
              <span className="id">{String(item.displayId || item.id || '').slice(0, 6)}</span>
              <span className="t">{(item.title || item.song || item.name || '').toUpperCase()}</span>
              <span className="m">{item.kind === 'analysis' ? item.mediaType || 'music' : item.kind}</span>
              <span className="d">{(item.date || item.created_at || '').slice(0, 10)}</span>
              <Pill>{t('v2.commerce.complete', 'Complete')}</Pill>
            </a>
          ))}
      </ModalV2>
    </>
  );
}
