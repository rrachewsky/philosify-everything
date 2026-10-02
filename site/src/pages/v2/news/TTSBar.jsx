// TTSBar (News) - thin wrapper: news i18n + explicit lang → shared TtsAudioBar
// (components/v2/TtsAudioBar.jsx). ttsCache routes news results and panel
// results to POST /api/news/tts; generation is lazy (first press).
import { TtsAudioBar } from '../../../components/v2';

export function TTSBar({ result, lang, t }) {
  const labels = {
    listen: t('v2.news.listen', 'Listen to the analysis'),
    pause: t('v2.news.pause', 'Pause'),
    play: t('v2.news.play', 'Play'),
    cancel: t('v2.news.cancel', 'Cancel'),
    seek: t('v2.news.seek', 'Seek'),
    preparing: t('v2.news.audioPreparing', 'Preparing audio'),
    failed: t('v2.news.audioFailed', 'Audio generation failed — press play to retry'),
    timeout: t('v2.news.audioTimeout', 'Audio generation timed out — press play to retry'),
    playbackFailed: t('v2.news.audioPlaybackFailed', 'Audio playback failed'),
    speed: (x) => `${t('v2.news.speed', 'Speed')} ${x}x`,
  };
  return <TtsAudioBar result={result} lang={lang} labels={labels} />;
}

export default TTSBar;
