import AnimatedAvatar from '../ui/AnimatedAvatar';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 max-w-[85%] mr-auto">
      <AnimatedAvatar size={32} isThinking={true} />
      <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#6D5BFF' }} />
        <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#3EC6E0' }} />
        <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#8B5CF6' }} />
      </div>
    </div>
  );
}
