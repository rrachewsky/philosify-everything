// V2AudioBar (Literature) - thin wrapper: page i18n → shared TtsAudioBar
// (components/v2/TtsAudioBar.jsx). Mirrors pages/v2/music/V2AudioBar.jsx.
import { useTranslation } from 'react-i18next';
import { TtsAudioBar } from '../../../components/v2';

const P = 'v2.literature';

export function V2AudioBar({ result }) {
  const { t, i18n } = useTranslation();
  const labels = {
    listen: t(`${P}.listen`, 'Listen to the analysis'),
    pause: t(`${P}.pause`, 'Pause'),
    play: t(`${P}.play`, 'Play'),
    cancel: t(`${P}.cancel`, 'Cancel'),
    seek: t(`${P}.seek`, 'Seek'),
    preparing: t(`${P}.preparingAudio`, 'Preparing audio'),
    failed: t(`${P}.audioFailed`, 'Audio unavailable — try again'),
    timeout: t(`${P}.audioTimeout`, 'Audio timed out — try again'),
    playbackFailed: t(`${P}.audioPlaybackFailed`, 'Audio playback failed'),
    speed: (x) => `${t(`${P}.speed`, 'Speed')} ${x}x`,
  };
  return <TtsAudioBar result={result} lang={i18n.language || 'en'} labels={labels} />;
}

export default V2AudioBar;
