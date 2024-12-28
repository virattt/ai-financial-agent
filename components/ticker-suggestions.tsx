import { memo } from 'react';
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
  selectedIndex = 0
}: TickerSuggestionsProps) {
  if (!position || suggestions.length === 0) return null;

  return (
    <div
      className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden min-w-[120px]"
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
            "w-full justify-start px-3 py-1.5 text-sm",
            index === selectedIndex
              ? "bg-zinc-100 dark:bg-zinc-700"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
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