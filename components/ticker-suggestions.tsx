import { Button } from './ui/button';
import { cx } from 'class-variance-authority';

interface TickerSuggestionsProps {
  suggestions: string[];
  onSelect: (ticker: string) => void;
  position: { top: number; left: number } | null;
  selectedIndex?: number;
}

export function TickerSuggestions({ 
  suggestions, 
  onSelect, 
  position,
  selectedIndex = -1
}: TickerSuggestionsProps) {
  if (!position || suggestions.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-muted dark:bg-zinc-900/95 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[300px]"
      style={{
        bottom: `calc(100vh - ${position.top}px)`,
        left: `${position.left}px`,
      }}
    >
      {suggestions.map((ticker, index) => (
        <Button
          key={ticker}
          variant="ghost"
          className={cx(
            "w-full justify-start px-3 py-1.5 text-sm text-foreground hover:bg-muted-foreground/80"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(ticker);
          }}
        >
          {ticker}
        </Button>
      ))}
    </div>
  );
}