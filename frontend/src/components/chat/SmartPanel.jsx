import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { useChatStore } from '../../lib/store';

export default function SmartPanel() {
  const smartPanelSources = useChatStore((s) => s.smartPanelSources);

  // Default popular articles to show when no specific sources are retrieved
  const defaultSources = [
    { title: 'Shipping & Delivery Policy', category: 'policies', score: null },
    { title: 'Returns & Refunds', category: 'policies', score: null },
    { title: 'Contact Support', category: 'support', score: null }
  ];

  const displaySources = smartPanelSources.length > 0 ? smartPanelSources : defaultSources;
  const isLive = smartPanelSources.length > 0;

  return (
    <div className="w-full h-full theme-panel flex flex-col border-l theme-border">
      <div className="p-4 border-b theme-border flex flex-col gap-1">
        <h3 className="font-semibold text-sm flex items-center gap-2 theme-text-primary">
          <BookOpen size={16} className="text-[#6D5BFF]" />
          Smart Panel
        </h3>
        <p className="text-xs theme-text-secondary">
          {isLive ? 'Relevant articles & context' : 'Popular help topics'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium theme-text-muted uppercase tracking-wider">
          {isLive ? (
            <><Sparkles size={12} /> Retrieved Sources</>
          ) : (
            <><TrendingUp size={12} /> Suggested Articles</>
          )}
        </div>
        
        {displaySources.map((source, i) => (
          <div key={i} className="theme-card rounded-xl p-3 space-y-1 theme-hover transition-colors cursor-default">
            <div className="flex items-start gap-2">
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(109,91,255,0.6)]"
                style={{ background: 'linear-gradient(135deg, #6D5BFF, #3EC6E0)' }}
              />
              <div>
                <p className="text-sm font-medium theme-text-primary">{source.title}</p>
                {source.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] theme-tag theme-text-secondary border theme-border uppercase tracking-wider">
                    {source.category}
                  </span>
                )}
              </div>
            </div>
            {source.score && (
              <div className="ml-4">
                <div className="h-1 rounded-full theme-tag overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full gradient-primary"
                    style={{ width: `${Math.round(source.score * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] theme-text-muted">
                  {Math.round(source.score * 100)}% relevance
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
