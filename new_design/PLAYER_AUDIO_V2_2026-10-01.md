# Player de áudio v2 (TTS) — telemetria igual à da análise · DIAGNÓSTICO E PROPOSTA · 01/10/2026

**Branch:** `redesign/v2` · **HEAD:** `de0c058` · **Estado:** proposta para OK; nada aplicado.
**Decisão do Bob (30/09, com prints):** a telemetria do áudio segue o padrão ANALISANDO (cronômetro vivo + barra de progresso), nas quatro superfícies (música, cinema, literatura, news). Primeiro o defeito do fio de progresso, depois o design.

---

## A) Defeito: por que "nada aparece"

### A1. Os prints do Bob são da superfície de **News**, e lá não existe telemetria nenhuma

| Sintoma no print | Código | Arquivo:linha |
|---|---|---|
| "PREPARANDO ÁUDIO…" estático, sem cronômetro | o rótulo é fixo: `t('v2.news.audioPreparing', 'Preparing audio…')`; não há cronômetro nem `elapsed` no componente | `site/src/pages/v2/news/TTSBar.jsx:111-113` |
| sem barra de geração | `TTSBar` não renderiza `Telemetry`; só passa `label`/`speed`/`playing` ao `AudioBar` | `TTSBar.jsx:115-122` |
| fio vazio no play | `AudioBar` renderiza `<span className="aline" />` **vazio**, sem `<i>` de preenchimento; e `TTSBar.play()` não liga `ontimeupdate` nem lê `duration` | `site/src/components/v2/AnalysisStack.jsx:110-123`; `TTSBar.jsx:41-50` |

Em News, portanto, não é bug de CSS nem de evento: **a telemetria nunca foi construída**. O `AudioBar` de `AnalysisStack` é o esqueleto do mockup, sem comportamento.

### A2. Em música, cinema e literatura o fio técnicamente enche, mas é perceptivamente invisível

`V2AudioBar` (`site/src/pages/v2/music/V2AudioBar.jsx`, espelhado em cinema e literatura, só muda o prefixo i18n):

| Elo | Estado | Arquivo:linha |
|---|---|---|
| `ontimeupdate` ligado | sim: `audio.ontimeupdate = () => { if (audio.duration) setProgress(audio.currentTime / audio.duration); }` | `V2AudioBar.jsx:53-55` |
| `width` setado | sim: `<i style={{ width: \`${Math.round(progress * 100)}%\` }} />` | `V2AudioBar.jsx:182` |
| `duration` disponível | sim: o worker responde o MP3 com `Content-Length` (`api/src/handlers/tts.js:372-373, 428-429`), o cliente faz `response.blob()` e toca por `blob:` URL (`ttsCache.js:213-222`); duração finita |
| CSS do preenchimento | `.pg-music .audio .aline i{position:absolute;left:0;top:50%;height:1px;background:var(--ink)}` sobre `.aline::before{…top:50%;height:1px;background:var(--line)}` | `music.css:66-69`, `cinema.css:65-68`, `literature.css:65-68` |
| Geração | tem cronômetro no texto (`Preparando áudio · 00:15`, visto ao vivo em 29/09), **não tem barra** | `V2AudioBar.jsx:154-158` |

O que o olho vê: um traço de **1 px** cor `--ink` desenhado **exatamente em cima** de um traço de 1 px cor `--line` (`rgba(255,255,255,.11)`), na mesma altura (`top:50%`). O progresso é só a diferença de brilho num fio de 1 px sobre fundo preto, sem cabeça de leitura, sem números. Num print, é "fio vazio". Não há evento quebrado para consertar; o desenho é que não comunica. A medição de console que desenhei em 30/09 (`setInterval(() => console.log(document.querySelector('.audio .aline i').style.width), 2000)`) continua válida se o Bob quiser a prova numérica numa dessas três páginas, mas o conserto abaixo não depende dela.

### A3. Nexo com os ciclos anteriores

Nenhum. `V2AudioBar` e `TTSBar` estão iguais desde 29/07/2026 (`2b8d1ee`, `fc2beb8`); o deploy de 29/09 (`ef6b8fc4`) levou só o DM.

### A4. O padrão que o Bob quer já existe no repo

`site/src/pages/v2/ideas/VerdictAudio.jsx` (áudio do veredito dos debates) faz exatamente isto: `Telemetry` com cronômetro `mm:ss.cc` e barra estimada durante a geração (`:284-290`), e no play `mm:ss` + `.aline.aseek` com `<i>` + `mm:ss` (`:258-274`), com `stop` e seek. A proposta B generaliza esse componente para o TTS das quatro superfícies.

---

## B) Proposta: um componente só, `TtsAudioBar`, com a telemetria da análise

### B1. Comportamento

**Geração** (do clique em ▶ até o áudio pronto):

- Linha do player: ▶ vira ✕ (cancela), rótulo `PREPARANDO ÁUDIO`.
- Logo abaixo, o mesmo bloco `Telemetry` da análise (`.state`): rótulo + cronômetro vivo `mm:ss.cc` em prata + barra magenta `--progress` + "Cancelar".
- Barra **estimada**, pela mesma lei de ritmo da análise: `analysisProgress(elapsed, expectedMs)`, assintótica em 96 %, nunca cravando 100 % antes do áudio chegar (regra de 31/07). `expectedMs` = 45 000 (a geração de 29/09 levou 35 s; o `VerdictAudio` usa 120 s porque o veredito é maior). Ajustável por superfície via prop.
- Indeterminada foi descartada: a análise usa estimada, e o Bob pediu o mesmo padrão.

**Play:**

- `mm:ss` decorrido · fio de progresso · `mm:ss` duração · `Velocidade 1x`.
- Fio: linha de 1 px `--line` com preenchimento de **2 px** `--ink` e uma **cabeça de leitura** de 1 × 9 px `--ink` na ponta. Sem glow, sem raio, sem cor além de `--ink` sobre `--line` (Design Law: hairline, silver scarcity, magenta só em barra de análise/timer). Área de clique de 14 px de altura para o seek, como no `VerdictAudio`.
- Tempo em `tabular-nums`, cor `--ink-mid` (tier de chrome, 10.5 px uppercase, como o resto da linha).
- Pausa mantém a posição; o fio continua visível com o tempo parado.

**Erro:** rótulo em `--warn` na própria linha, como hoje.

### B2. Arquivos

| Ação | Arquivo |
|---|---|
| **novo** | `site/src/components/v2/TtsAudioBar.jsx` (componente + `formatChrono` + `formatPlayTime` + `useChronometer` locais, copiados de `ideas/utils.js` para não acoplar a página de ideias) |
| export | `site/src/components/v2/index.js`: `export { TtsAudioBar } from './TtsAudioBar.jsx';` |
| **reescrito como wrapper** | `site/src/pages/v2/music/V2AudioBar.jsx`, `cinema/V2AudioBar.jsx`, `literature/V2AudioBar.jsx`: só mapeiam as chaves i18n da página para `labels` e delegam |
| **reescrito como wrapper** | `site/src/pages/v2/news/TTSBar.jsx`: idem, com `lang` vindo da prop (news passa `userLang`) |
| CSS compartilhado | `site/src/styles/v2-components.css`: regras `.v2 .audio .aseek`, `.aseek::before`, `.aseek i`, `.aseek i::after`, `.atime`, `.aspeed`, `.aerrtxt` |
| CSS removido | os blocos "Audio bar extras (V2AudioBar)" de `music.css:65-73`, `cinema.css:64-72`, `literature.css:64-72` (passam a vir do compartilhado) |
| i18n | **zero chave nova**: cada wrapper usa as chaves que já tem (`v2.music.listen/pause/play/cancel/seek/speed/preparingAudio/audioFailed/audioTimeout/audioPlaybackFailed`, idem cinema e literatura; news usa `v2.news.listen/audioPreparing/audioFailed/audioTimeout/audioPlaybackFailed/speed`). News não tem `pause/play/cancel/seek`: o wrapper usa `t()` com default em inglês para esses quatro, e aí sim entram 4 chaves × 18 idiomas num passo separado se o Bob quiser localizado |
| intocado | `ideas/VerdictAudio.jsx` (já está no padrão), `AudioBar` de `AnalysisStack` (fica para quem mais o usar) |

### B3. O componente (novo arquivo, íntegro)

```jsx
// TtsAudioBar - shared v2 TTS audio bar (music / cinema / literature / news).
// Telemetry mirrors the ANALYZING state: live chronometer + estimated bar while
// the audio is generated; visible seekable progress + mm:ss / mm:ss while it
// plays. Wired to services/ttsCache.js (lazy generation on first press).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Telemetry, analysisProgress } from './Telemetry.jsx';
import {
  getPreloadedAudio,
  getAudioStatus,
  getAudioError,
  preloadTTS,
  cancelPreload,
} from '../../services/ttsCache';

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];
const EXPECTED_GEN_MS = 45_000;

/** mm:ss.cc — same shape as the analysis chronometer */
export function formatChrono(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

/** m:ss playback time */
export function formatPlayTime(secs) {
  if (!secs || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Elapsed-ms chronometer while `active` (rAF-driven, resets on start) */
function useChronometer(active) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      setElapsed(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional reset
      const tick = () => {
        if (startRef.current) setElapsed(Date.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);
  return elapsed;
}

/**
 * @param {object} result   analysis object understood by ttsCache (music/cinema/literature/news)
 * @param {string} lang     TTS language
 * @param {object} labels   { listen, pause, play, cancel, seek, preparing, failed, timeout,
 *                            playbackFailed, speed: (x) => string }
 * @param {number} expectedMs pacing of the estimated generation bar
 */
export function TtsAudioBar({ result, lang, labels, expectedMs = EXPECTED_GEN_MS }) {
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const wantsPlayRef = useRef(false);
  const speedRef = useRef(1);
  const seekRef = useRef(null);
  const genElapsed = useChronometer(preparing);

  const detach = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.onended = null;
      a.onerror = null;
      a.ontimeupdate = null;
      a.onloadedmetadata = null;
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    detach();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [detach]);

  const playUrl = useCallback(
    (url) => {
      detach();
      const audio = new Audio(url);
      audio.playbackRate = speedRef.current;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setError(labels.playbackFailed);
        setPlaying(false);
      };
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);
      if (audio.duration) setDuration(audio.duration);
      audioRef.current = audio;
      audio.play().catch(() => {
        setError(labels.playbackFailed);
        setPlaying(false);
      });
      setPlaying(true);
    },
    [detach, labels.playbackFailed]
  );

  // Poll the TTS cache while the audio is being prepared
  useEffect(() => {
    if (!preparing || !result) return undefined;
    const id = setInterval(() => {
      const status = getAudioStatus(result, lang);
      if (status === 'ready') {
        clearInterval(id);
        setPreparing(false);
        if (wantsPlayRef.current) {
          wantsPlayRef.current = false;
          const url = getPreloadedAudio(result, lang);
          if (url) playUrl(url);
        }
      } else if (status === 'error') {
        clearInterval(id);
        setPreparing(false);
        wantsPlayRef.current = false;
        setError(getAudioError(result, lang) === 'timeout' ? labels.timeout : labels.failed);
      }
    }, 400);
    return () => clearInterval(id);
  }, [preparing, result, lang, playUrl, labels.timeout, labels.failed]);

  const cancelGeneration = () => {
    wantsPlayRef.current = false;
    setPreparing(false);
    cancelPreload(result, lang);
  };

  const handlePlay = () => {
    setError(null);
    if (preparing) return cancelGeneration();
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }
    const url = getPreloadedAudio(result, lang);
    if (url) return playUrl(url);
    wantsPlayRef.current = true;
    setPreparing(true);
    const status = getAudioStatus(result, lang);
    if (status !== 'loading' && status !== 'retrying') preloadTTS(result, lang);
  };

  const handleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    speedRef.current = next;
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = seekRef.current;
    if (!audio || !duration || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  // Global stop (module navigation, new analysis) + result/lang change + unmount
  useEffect(() => {
    window.addEventListener('stopAllAudio', stop);
    return () => {
      window.removeEventListener('stopAllAudio', stop);
      stop();
    };
  }, [stop]);
  useEffect(() => () => stop(), [result, lang, stop]);

  const hasProgress = !!audioRef.current && duration > 0;
  const label = error ? error : preparing ? labels.preparing : labels.listen;

  return (
    <>
      <div className="audio">
        <button
          className="play"
          onClick={handlePlay}
          aria-label={preparing ? labels.cancel : playing ? labels.pause : labels.play}
        >
          {preparing ? '✕' : playing ? '❚❚' : '▶'}
        </button>
        <span className={error ? 'aerrtxt' : undefined}>{label}</span>
        {hasProgress ? (
          <>
            <span className="atime">{formatPlayTime(currentTime)}</span>
            <span
              className="aline aseek"
              ref={seekRef}
              onClick={handleSeek}
              role="slider"
              aria-label={labels.seek}
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              tabIndex={0}
            >
              <i style={{ width: `${(currentTime / duration) * 100}%` }} />
            </span>
            <span className="atime">{formatPlayTime(duration)}</span>
          </>
        ) : (
          <span className="aline" />
        )}
        <button className="aspeed" onClick={handleSpeed}>
          {labels.speed(speed)}
        </button>
      </div>
      {preparing && (
        <Telemetry
          label={labels.preparing}
          time={formatChrono(genElapsed)}
          progress={analysisProgress(genElapsed, expectedMs)}
          onCancel={cancelGeneration}
          cancelLabel={labels.cancel}
        />
      )}
    </>
  );
}

export default TtsAudioBar;
```

### B4. Wrappers (um por superfície; os três `V2AudioBar` ficam idênticos a menos do prefixo)

`site/src/pages/v2/music/V2AudioBar.jsx` (cinema: `v2.cinema`; literatura: `v2.literature`):

```jsx
// V2AudioBar (Music) - thin wrapper: page i18n → shared TtsAudioBar.
import { useTranslation } from 'react-i18next';
import { TtsAudioBar } from '../../../components/v2';

export function V2AudioBar({ result }) {
  const { t, i18n } = useTranslation();
  const p = 'v2.music';
  const labels = {
    listen: t(`${p}.listen`, 'Listen to the analysis'),
    pause: t(`${p}.pause`, 'Pause'),
    play: t(`${p}.play`, 'Play'),
    cancel: t(`${p}.cancel`, 'Cancel'),
    seek: t(`${p}.seek`, 'Seek'),
    preparing: t(`${p}.preparingAudio`, 'Preparing audio'),
    failed: t(`${p}.audioFailed`, 'Audio unavailable — try again'),
    timeout: t(`${p}.audioTimeout`, 'Audio timed out — try again'),
    playbackFailed: t(`${p}.audioPlaybackFailed`, 'Audio playback failed'),
    speed: (x) => `${t(`${p}.speed`, 'Speed')} ${x}x`,
  };
  return <TtsAudioBar result={result} lang={i18n.language || 'en'} labels={labels} />;
}

export default V2AudioBar;
```

`site/src/pages/v2/news/TTSBar.jsx`:

```jsx
// TTSBar (News) - thin wrapper: news i18n + explicit lang → shared TtsAudioBar.
// ttsCache routes news results to POST /api/news/tts.
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
```

Nota: `v2.news.audioPreparing` hoje é "Preparing audio…" com reticências; no `Telemetry` o cronômetro vem ao lado, então proponho tirar as reticências dessa chave nos 18 idiomas no mesmo commit (edição de texto, não chave nova).

### B5. CSS compartilhado (`v2-components.css`, logo após `.v2 .audio .aline`)

```css
/* ---- TtsAudioBar: visible playback progress + times (01 Oct) ----
   Hairline --line, 2px --ink fill, 1x9px playhead. No glow, no radius. */
.v2 .audio .aseek{position:relative;flex:1;height:14px;background:none;cursor:pointer;align-self:center}
.v2 .audio .aseek::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--line)}
.v2 .audio .aseek i{position:absolute;left:0;top:calc(50% - 1px);height:2px;background:var(--ink)}
.v2 .audio .aseek i::after{content:"";position:absolute;right:0;top:-4px;width:1px;height:9px;background:var(--ink)}
.v2 .audio .atime{flex:none;font-variant-numeric:tabular-nums;color:var(--ink-mid)}
.v2 .audio .aspeed{background:none;border:0;padding:0;cursor:pointer;color:var(--mid);font:inherit;letter-spacing:inherit;text-transform:inherit}
.v2 .audio .aspeed:hover{color:var(--ink)}
.v2 .audio .aerrtxt{color:var(--warn);text-transform:none;letter-spacing:.04em}
```

E remoção dos blocos "Audio bar extras (V2AudioBar)" em `music.css`, `cinema.css`, `literature.css` (as regras `.aline`/`.aline::before`/`.aline i`/`.aspeed`/`.aerrtxt` por página), que ficam cobertas pelo compartilhado. `ideas.css:78-82` fica como está.

No mobile (`@media` existente em `v2-components.css:444`, `.v2 .audio{flex-wrap:wrap}`), o par `atime · aseek · atime` quebra para a segunda linha junto; se ficar apertado, `.aseek{flex-basis:60%}` na mesma media query. Confirmo no build.

### B6. Testes de aceite (Bob, um play real em cada superfície)

1. **Música**, análise sem áudio na sessão (ex.: trocar o idioma do TTS): ▶ → linha mostra `PREPARANDO ÁUDIO`, bloco abaixo com cronômetro correndo `00:0x.xx` e barra magenta enchendo; ✕ cancela.
2. Áudio pronto: toca sozinho; aparecem `0:00`, fio com preenchimento de 2 px e cabeça, `m:ss` da duração; o fio anda e o tempo conta; clique no fio busca; ❚❚ pausa e mantém posição.
3. **Cinema** e **Literatura**: mesma sequência.
4. **News**: mesma sequência (antes não tinha nada disso).
5. Velocidade continua ciclando 0.8 → 1 → 1.2 → 1.5 → 1.8.
6. Ideias (veredito dos debates) inalterado.

### B7. Entrega

OK do Bob → aplico (1 componente novo, 4 wrappers, CSS compartilhado + 3 remoções, 18 textos de `audioPreparing` sem reticências) → lint + build → entra no próximo deploy do site → aceite com play real → commit `audio: telemetria do tts no padrao da analise (cronometro, barra e progresso visivel)`. Sem autoria de IA.

---

## O que preciso do Bob

1. **OK na B** como proposta, ou ajustes: espessura do preenchimento (2 px), cabeça de leitura (sim/não), `expectedMs` da barra estimada (45 s), reticências fora de `audioPreparing`.
2. Confirmação de que os prints de 30/09 eram do **News** (bate com A1). Se algum print for de música/cinema/literatura com o fio vazio, a medição de console da seção A2 fecha a dúvida antes de eu aplicar.
3. As 4 chaves novas de news (`pause/play/cancel/seek`) localizadas nos 18 idiomas: no mesmo ciclo ou depois.

---

## Execução (02/10/2026, após o OK consolidado do Bob)

Decisões do Bob: preenchimento 2 px **com** cabeça de leitura; `expectedMs` 45 s; reticências fora de `audioPreparing` nos 18; chaves novas de news localizadas no mesmo ciclo pela terminologia das chaves de música. Prints de 30/09 confirmados como News.

| Passo | Resultado |
|---|---|
| Componente | `site/src/components/v2/TtsAudioBar.jsx` novo (B3, com uma correção de lint: `hasProgress = duration > 0`, sem ler ref no render); export em `components/v2/index.js` |
| Wrappers | `pages/v2/music/V2AudioBar.jsx`, `cinema/V2AudioBar.jsx`, `literature/V2AudioBar.jsx`, `news/TTSBar.jsx` reescritos como mapeamento i18n → `TtsAudioBar` |
| CSS | bloco compartilhado em `v2-components.css` após `.v2 .audio .aline` (`.aseek`, `::before`, `i` 2 px, `i::after` cabeça 1×9, `.atime`, `.aspeed`, `.aerrtxt`) + `.aseek{flex-basis:60%}` na media query mobile; removidos os 3 blocos "Audio bar extras" de `music.css`, `cinema.css`, `literature.css` |
| i18n | 18 arquivos: `v2.news.audioPreparing` sem reticências; `v2.news.pause/play/seek` copiados de `v2.music` do mesmo idioma (`cancel` e `speed` já existiam em news, logo 3 chaves novas, não 4). Validado por `JSON.parse` e releitura |
| Lint | `eslint` nos 6 arquivos de código: limpo |
| Build | `vite build` OK em 32 s; chunks novos `index-DKV63omd.js`, `MusicPage-DV1YkSVv.js`, `NewsPage-CDLCS5rY.js`, `CinemaPage-XOp1qAn-.js`, `LiteraturePage-DTSJ8V06.js` |
| Deploy | comando entregue ao Bob (abaixo); sem commit até o aceite |

**Deploy (Bob, no terminal da sessão):**

```
cd site && npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```

Depois: Ctrl+F5 e os 6 testes de aceite da seção B6. Com o "ok": commit `audio: telemetria do tts no padrao da analise (cronometro, barra e progresso visivel)`, push, hash.

**Deploy (02/10):** Bob mandou o comando; deployment `359b68aa.philosify-frontend.pages.dev`, branch `production`. Verificado ao vivo: `philosify.org/` referencia `index-DKV63omd.js`; o componente vai no chunk próprio `TtsAudioBar-AZdCTDZE.js` e o CSS compartilhado em `Button-LTHWTS6R.css`, ambos servidos com `aseek` (1 e 1 ocorrências). Aguardando o aceite com play real nas 4 superfícies.

**Aceite do Bob (02/10): "ok".** Ciclo fechado; commit abaixo.
