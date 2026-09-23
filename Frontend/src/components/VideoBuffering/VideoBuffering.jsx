import { motion } from 'framer-motion';

export default function VideoBuffering({ 
  message = 'Buffering...', 
  subtext = 'Optimizing playback stream',
  size = 'md',
  overlay = true 
}) {
  const isSmall = size === 'sm';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`${
        overlay 
          ? 'absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-black/50 backdrop-blur-[3px]' 
          : 'w-full h-full flex flex-col items-center justify-center bg-slate-950/80'
      } select-none`}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Animated Glow & Rings */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow */}
          <div 
            className="absolute rounded-full filter blur-xl opacity-60 animate-pulse"
            style={{
              width: isSmall ? '60px' : '90px',
              height: isSmall ? '60px' : '90px',
              background: 'radial-gradient(circle, rgba(14,165,233,0.5) 0%, rgba(139,92,246,0.3) 70%, transparent 100%)'
            }}
          />

          {/* Outer Rotating Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className={`rounded-full border-t-2 border-r-2 border-transparent border-t-[#0EA5E9] border-r-[#8B5CF6] ${
              isSmall ? 'w-10 h-10' : 'w-16 h-16'
            }`}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.6))'
            }}
          />

          {/* Inner Counter-Rotating Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
            className={`absolute rounded-full border-b-2 border-l-2 border-transparent border-b-[#8B5CF6] border-l-[#38BDF8] opacity-70 ${
              isSmall ? 'w-7 h-7' : 'w-11 h-11'
            }`}
          />

          {/* Center Pulsing Orb */}
          <motion.div
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className={`absolute rounded-full bg-gradient-to-tr from-[#0EA5E9] to-[#8B5CF6] shadow-[0_0_12px_rgba(14,165,233,0.8)] ${
              isSmall ? 'w-2.5 h-2.5' : 'w-4 h-4'
            }`}
          />
        </div>

        {/* Buffering Text & Wave Dots */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 shadow-lg backdrop-blur-md">
            <span className="text-white text-xs font-semibold tracking-wide flex items-center gap-1">
              {message}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" />
            </span>
          </div>

          {subtext && !isSmall && (
            <p className="text-[11px] text-white/60 font-medium tracking-normal m-0 drop-shadow-sm">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
