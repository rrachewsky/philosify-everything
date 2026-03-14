// InstallButton - PWA install prompt button
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showInstallPrompt, isInstalled } from '@/utils/pwa';

export function InstallButton() {
  const { t } = useTranslation();
  const [showButton, setShowButton] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

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
      setInstalled(true);
      // Hide the success message after 4 seconds
      setTimeout(() => {
        setShowButton(false);
        setInstalled(false);
      }, 4000);
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
      if (!accepted) {
        // User dismissed — keep button visible
        setInstalling(false);
      }
      // If accepted, the 'appinstalled' event will handle the success state
    } catch (error) {
      console.error('[InstallButton] Install failed:', error);
      setInstalling(false);
    }
  };

  if (!showButton) {
    return null;
  }

  if (installed) {
    return (
      <div className="pwa-install-success">
        {t('pwa.installed', { defaultValue: 'App installed successfully!' })}
      </div>
    );
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
