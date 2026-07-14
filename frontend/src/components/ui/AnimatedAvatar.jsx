import { useChatStore } from '../../lib/store';
import { motion } from 'framer-motion';

export default function AnimatedAvatar({ size = 36, isThinking = false, isAgent = false }) {
  const { currentSentiment } = useChatStore();
  const sizeClass = `w-[${size}px] h-[${size}px]`;

  if (isAgent) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{
          width: size, height: size,
          background: 'linear-gradient(135deg, #3EC6E0, #6D5BFF)',
        }}
      >
        SA
      </div>
    );
  }

  // Emotion-aware color shifting based on sentiment (-1 to 1)
  let bgGradient = 'linear-gradient(135deg, #6D5BFF, #3EC6E0, #8B5CF6)'; // Neutral
  let shadow = '0 0 12px rgba(109, 91, 255, 0.5), 0 0 24px rgba(62, 198, 224, 0.2)';

  if (currentSentiment < -0.3) {
    // Frustrated/Negative
    bgGradient = 'linear-gradient(135deg, #FF6B6B, #FFA26B)';
    shadow = '0 0 12px rgba(255, 107, 107, 0.5), 0 0 24px rgba(255, 162, 107, 0.2)';
  } else if (currentSentiment > 0.4) {
    // Happy/Positive
    bgGradient = 'linear-gradient(135deg, #4ADE80, #3EC6E0)';
    shadow = '0 0 12px rgba(74, 222, 128, 0.5), 0 0 24px rgba(62, 198, 224, 0.2)';
  }

  return (
    <motion.div
      className={`rounded-full shrink-0 ${isThinking ? 'orb-glow' : ''}`}
      animate={{ background: bgGradient, boxShadow: shadow }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        background: bgGradient,
        boxShadow: shadow,
      }}
    />
  );
}
