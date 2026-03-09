// InstallButton - PWA install prompt button
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showInstallPrompt, isInstalled } from '@/utils/pwa';

export function InstallButton() {
  const { t } = useTranslation();
  const [showButton, setShowButton] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isInstalled()) {
      setShowButton(false);
      return;
    }

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      setShowButton(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Check if prompt is already available
    if (window.deferredPrompt) {
      setShowButton(true);
    }

    // Listen for app installed
    const handleInstalled = () => {
      setShowButton(false);
    };

    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await showInstallPrompt();
      if (accepted) {
        setShowButton(false);
      }
    } catch (error) {
      console.error('[InstallButton] Install failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <button
      className="pwa-install-button"
      onClick={handleInstall}
      disabled={installing}
      aria-label="Install Philosify app"
    >
      {installing
        ? t('pwa.installing', { defaultValue: 'Installing...' })
        : t('pwa.install', { defaultValue: 'Install App' })}
    </button>
  );
}

export default InstallButton;
