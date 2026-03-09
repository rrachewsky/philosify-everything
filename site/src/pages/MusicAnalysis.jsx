import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, User, Headphones, Sparkles } from 'lucide-react';

/**
 * MusicAnalysis - Cyberpunk Neon Glow Music Analysis Screen
 *
 * A production-ready React component for the Philosify app
 * featuring a high-end Cyberpunk/Neon UI design with Framer Motion animations.
 */

// ============================================================================
// STYLES
// ============================================================================

// Inject Google Fonts
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@300;400;500;600;700&display=swap');
`;

// Keyframes CSS
const keyframesCSS = `
  @keyframes pulse-ring {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.15);
      opacity: 0.2;
    }
  }
  
  @keyframes heartbeat {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.03);
    }
  }
  
  @keyframes float-particle {
    0%, 100% {
      transform: translateY(0) translateX(0);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-30px) translateX(15px);
      opacity: 0.8;
    }
  }
  
  @keyframes scan-line {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100vh);
    }
  }
  
  @keyframes glow-pulse {
    0%, 100% {
      filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6));
    }
    50% {
      filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.9));
    }
  }

  @keyframes grid-scroll {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 50px;
    }
  }

  @keyframes border-glow {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
`;

// ============================================================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================================================

// Floating Particle
function Particle({ delay, duration, left, size, color, xOffsets }) {
  return (
    <motion.div
      initial={{ y: '110vh', opacity: 0 }}
      animate={{
        y: '-10vh',
        opacity: [0, 0.8, 0.8, 0],
        x: [0, xOffsets[0], xOffsets[1], 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'absolute',
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// Retro Grid Background
function RetroGrid() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: '-50%',
        right: '-50%',
        height: '50%',
        background: `
          linear-gradient(to top, rgba(124, 58, 237, 0.15) 0%, transparent 70%),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 60px,
            rgba(0, 240, 255, 0.08) 60px,
            rgba(0, 240, 255, 0.08) 61px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 60px,
            rgba(0, 240, 255, 0.08) 60px,
            rgba(0, 240, 255, 0.08) 61px
          )
        `,
        transform: 'perspective(400px) rotateX(65deg)',
        transformOrigin: 'bottom center',
        animation: 'grid-scroll 4s linear infinite',
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
      }}
    />
  );
}

// Scan Line Effect
function ScanLine() {
  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: '100vh' }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

// ============================================================================
// WAVEFORM VISUALIZATION
// ============================================================================

function WaveformBar({ index, isPlaying }) {
  const baseHeight = 20 + Math.sin(index * 0.5) * 15;

  const [randomValues] = useState(() => ({
    h1: Math.random() * 60 + 30,
    h2: Math.random() * 50 + 20,
    h3: Math.random() * 70 + 25,
    dur: 0.8 + Math.random() * 0.4,
  }));

  return (
    <motion.div
      animate={
        isPlaying
          ? {
              height: [
                `${baseHeight}%`,
                `${randomValues.h1}%`,
                `${randomValues.h2}%`,
                `${randomValues.h3}%`,
                `${baseHeight}%`,
              ],
            }
          : {
              height: `${baseHeight}%`,
            }
      }
      transition={
        isPlaying
          ? {
              duration: randomValues.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.02,
            }
          : {
              duration: 0.5,
            }
      }
      style={{
        width: '3px',
        borderRadius: '2px',
        background: 'linear-gradient(to top, #00f0ff 0%, #7c3aed 50%, #ff00aa 100%)',
        boxShadow: isPlaying
          ? '0 0 8px rgba(0, 240, 255, 0.6), 0 0 16px rgba(124, 58, 237, 0.4)'
          : '0 0 4px rgba(0, 240, 255, 0.3)',
        transition: 'box-shadow 0.3s ease',
      }}
    />
  );
}

function Waveform({ isPlaying }) {
  const barCount = 35;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '120px',
        padding: '1rem 0',
      }}
    >
      {Array.from({ length: barCount }, (_, i) => (
        <WaveformBar key={i} index={i} total={barCount} isPlaying={isPlaying} />
      ))}
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Glowing Border Card
function GlassCard({ children, className = '', style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'relative',
        background: 'rgba(10, 0, 32, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {/* Animated border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5rem',
          padding: '1px',
          background: 'linear-gradient(135deg, #00f0ff 0%, #7c3aed 50%, #ff00aa 100%)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          animation: 'border-glow 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      {/* Inner glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5rem',
          boxShadow:
            'inset 0 0 60px rgba(124, 58, 237, 0.1), inset 0 0 100px rgba(0, 240, 255, 0.05)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </motion.div>
  );
}

// Neon Button
function NeonButton({ children, onClick, variant = 'primary', disabled = false, style = {} }) {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #ff00aa 0%, #7c3aed 50%, #9d00ff 100%)',
      shadow: '0 0 20px rgba(255, 0, 170, 0.4), 0 0 40px rgba(124, 58, 237, 0.2)',
      hoverShadow: '0 0 30px rgba(255, 0, 170, 0.6), 0 0 60px rgba(124, 58, 237, 0.4)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%)',
      shadow: '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(124, 58, 237, 0.2)',
      hoverShadow: '0 0 25px rgba(0, 240, 255, 0.6), 0 0 50px rgba(124, 58, 237, 0.4)',
    },
    ghost: {
      background: 'rgba(124, 58, 237, 0.2)',
      shadow: '0 0 10px rgba(124, 58, 237, 0.2)',
      hoverShadow: '0 0 20px rgba(124, 58, 237, 0.4)',
    },
  };

  const v = variants[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, boxShadow: v.hoverShadow }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: v.background,
        border: 'none',
        borderRadius: '0.75rem',
        padding: '1rem 2rem',
        color: '#ffffff',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: v.shadow,
        opacity: disabled ? 0.5 : 1,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// Play/Pause Button with Ring Animation
function PlayButton({ isPlaying, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'relative',
        width: '5rem',
        height: '5rem',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ff00aa 0%, #7c3aed 50%, #9d00ff 100%)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 30px rgba(255, 0, 170, 0.5), 0 0 60px rgba(124, 58, 237, 0.3)',
      }}
    >
      {/* Pulsing ring */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.2, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 0, 170, 0.5)',
        }}
      />
      {/* Second ring */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.1, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
        style={{
          position: 'absolute',
          inset: '-12px',
          borderRadius: '50%',
          border: '1px solid rgba(124, 58, 237, 0.4)',
        }}
      />
      {/* Icon */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isPlaying ? 'pause' : 'play'}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {isPlaying ? (
            <Pause size={28} color="#fff" fill="#fff" />
          ) : (
            <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: '3px' }} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

// Control Button (Skip, etc.)
function ControlButton({ icon: Icon, onClick, size = 28 }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon
        size={size}
        color="#00f0ff"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))' }}
      />
    </motion.button>
  );
}

// Progress Bar
function ProgressBar({ progress, onProgressChange }) {
  return (
    <div style={{ padding: '0 0.5rem' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '4px',
          background: 'rgba(0, 240, 255, 0.2)',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newProgress = (x / rect.width) * 100;
          onProgressChange(Math.max(0, Math.min(100, newProgress)));
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #00f0ff 0%, #7c3aed 100%)',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
            width: `${progress}%`,
          }}
          layout
          transition={{ duration: 0.1 }}
        />
        {/* Knob */}
        <motion.div
          style={{
            position: 'absolute',
            left: `${progress}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            background: '#00f0ff',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.8)',
          }}
          whileHover={{ scale: 1.3 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        <span>1:14</span>
        <span>3:32</span>
      </div>
    </div>
  );
}

// User Avatar with Neon Ring
function UserAvatar() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #00f0ff)',
        padding: '3px',
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a0a3e, #0f0628)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User size={24} color="rgba(0, 240, 255, 0.7)" />
      </div>
    </motion.div>
  );
}

// Corner Play Button
function CornerPlayButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 15px rgba(124, 58, 237, 0.5)',
        zIndex: 10,
      }}
    >
      <Play size={16} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MusicAnalysis() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35);

  // Mock data
  const trackData = {
    title: 'WOMAN',
    artist: 'JOHN LENNON',
  };

  // Generate particles (with stable random offsets for animation)
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 8,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.8)' : 'rgba(255, 0, 170, 0.8)',
      xOffsets: [Math.random() * 40 - 20, Math.random() * 60 - 30],
    }))
  );

  // Auto-progress when playing
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.3));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <>
      {/* Inject styles */}
      <style>{fontStyles}</style>
      <style>{keyframesCSS}</style>

      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          background: 'linear-gradient(180deg, #050011 0%, #0a0020 40%, #0d0025 70%, #000814 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Exo 2', sans-serif",
          color: '#ffffff',
        }}
      >
        {/* Animated Grid Background */}
        <RetroGrid />

        {/* Scan Line Effect */}
        <ScanLine />

        {/* Floating Particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {particles.map((p) => (
            <Particle key={p.id} {...p} />
          ))}
        </div>

        {/* Ambient Glow Effects */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '-20%',
            width: '60%',
            height: '40%',
            background: 'radial-gradient(ellipse, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '-20%',
            width: '60%',
            height: '40%',
            background: 'radial-gradient(ellipse, rgba(255, 0, 170, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '28rem',
            margin: '0 auto',
            padding: '1.5rem',
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ff00aa 0%, #9d00ff 50%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  lineHeight: 1.1,
                  marginBottom: '0.5rem',
                  textShadow: '0 0 30px rgba(255, 0, 170, 0.3)',
                }}
              >
                Análise
                <br />
                de música
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '0.7rem',
                  color: '#00f0ff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  textShadow: '0 0 15px rgba(0, 240, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={14} style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
                Análise gerada por IA
              </motion.p>
            </div>

            <UserAvatar />
          </motion.header>

          {/* Player Card */}
          <GlassCard style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Corner Play Button */}
            <CornerPlayButton onClick={() => setIsPlaying(!isPlaying)} />

            {/* Track Info - Above Waveform */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                textAlign: 'left',
                marginBottom: '0.5rem',
                marginTop: '0.5rem',
                paddingRight: '3rem', // Space for corner button
              }}
            >
              <h2
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: 700,
                  color: '#00f0ff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
                  marginBottom: '0.25rem',
                }}
              >
                {trackData.title}
              </h2>
              <p
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.9rem',
                  color: '#ff00aa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  textShadow: '0 0 10px rgba(255, 0, 170, 0.5)',
                }}
              >
                {trackData.artist}
              </p>
            </motion.div>

            {/* Waveform Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Waveform isPlaying={isPlaying} />
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <ProgressBar progress={progress} onProgressChange={setProgress} />
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2.5rem',
                marginTop: 'auto',
                paddingBottom: '0.5rem',
              }}
            >
              <ControlButton icon={SkipBack} onClick={() => setProgress(0)} size={32} />
              <PlayButton isPlaying={isPlaying} onClick={() => setIsPlaying(!isPlaying)} />
              <ControlButton icon={SkipForward} onClick={() => setProgress(100)} size={32} />
            </motion.div>
          </GlassCard>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '1.5rem',
              animation: 'heartbeat 2s ease-in-out infinite',
            }}
          >
            <NeonButton
              onClick={() => console.log('Listen to analysis')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
              }}
            >
              <Headphones size={20} />
              Ouvir a Análise
            </NeonButton>
          </motion.div>

          {/* Spacer for bottom */}
          <div style={{ height: '1rem' }} />
        </div>
      </div>
    </>
  );
}
