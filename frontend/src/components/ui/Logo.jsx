import { Sparkles } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div className="flex items-center gap-2">
      <Sparkles size={size === 'lg' ? 28 : size === 'md' ? 20 : 16} className="theme-text-primary" />
      <span className={`${sizes[size]} font-semibold theme-text-primary tracking-tight`}>
        FlowSupport
      </span>
    </div>
  );
}
