'use client';

import cx from 'classnames';
import { format } from 'date-fns';

interface StockSnapshot {
  snapshot?: {
    ticker: string;
    price: number;
    day_change: number;
    day_change_percent: number;
    time: string;
  };
  error?: string;
  message?: string;
}

const SAMPLE: StockSnapshot = {
  snapshot: {
    ticker: "GOOGL",
    price: 192.76,
    day_change: -3.08,
    day_change_percent: -1.57,
    time: "2024-12-28T00:59:00Z"
  }
};

export function StockPrice({
  stockData = SAMPLE,
}: {
  stockData?: StockSnapshot;
}) {
  // If there's an error, display error message
  if (stockData.error) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 max-w-[500px]">
        <div className="text-red-400 text-sm">
          {stockData.message || 'An error occurred while fetching stock data'}
        </div>
      </div>
    );
  }

  // Ensure snapshot exists before destructuring
  if (!stockData.snapshot) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 max-w-[500px]">
        <div className="text-slate-400 text-sm">
          No stock data available
        </div>
      </div>
    );
  }

  const { ticker, price, day_change, day_change_percent, time } = stockData.snapshot;
  const isPositive = day_change >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 max-w-[500px]">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-4 items-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{ticker}</div>
          <div className="text-3xl font-medium text-slate-900 dark:text-slate-100">
            ${price.toFixed(2)}
          </div>
        </div>
        
        <div className={cx(
          "flex flex-row items-center gap-2 text-sm font-medium",
          isPositive ? "text-green-400" : "text-red-400"
        )}>
          <span>{isPositive ? "+" : ""}{day_change.toFixed(2)}</span>
          <span>({isPositive ? "+" : ""}{day_change_percent.toFixed(2)}%)</span>
        </div>
      </div>

      <div className="flex flex-row justify-between items-center">
        <div className="text-xs text-slate-400">
          Last updated: {format(new Date(time), 'MMM d, h:mm a')}
        </div>
      </div>
    </div>
  );
} 