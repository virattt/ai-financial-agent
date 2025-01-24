'use client';

import cx from 'classnames';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Blue, Green, Pink } from '@/components/styles/colors';

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
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="stock-price" className="border-none">
          <div className="border rounded-lg">
            <AccordionTrigger className="w-full px-4 py-3 hover:no-underline hover:bg-muted rounded-t-lg">
              <span className="flex flex-row items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={'sm'}
                  color={Blue}
                />
                <span className="text-sm">Retrieved data:</span>{" "}
                <span className="text-muted-foreground text-sm">Stock Price (Error)</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4 rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 max-w-[500px] mt-4">
                <div className="text-red-400 text-sm">
                  {stockData.message || 'An error occurred while fetching stock data'}
                </div>
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>
    );
  }

  // Ensure snapshot exists before destructuring
  if (!stockData.snapshot) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="stock-price" className="border-none">
          <div className="border rounded-lg">
            <AccordionTrigger className="w-full px-4 py-3 hover:no-underline hover:bg-muted rounded-t-lg">
              <span className="flex flex-row items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={'sm'}
                  color={Blue}
                />
                <span className="text-sm">Retrieved data:</span>{" "}
                <span className="text-muted-foreground text-sm">Stock Price (No Data)</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4 rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 max-w-[500px]">
                <div className="text-slate-400 text-sm">
                  No stock data available
                </div>
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>
    );
  }

  const { ticker, price, day_change, day_change_percent, time } = stockData.snapshot;
  const isPositive = day_change >= 0;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="stock-price" className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-3 hover:no-underline hover:bg-muted rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Blue}
              />
              <span className="text-sm">Retrieved data:</span>{" "}
              <span className="text-muted-foreground text-sm">{ticker} (Current Price)</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-1 rounded-md p-4 bg-background max-w-[500px] ml-4">
              <div className="ml-1">
                <div className="text-2xl">
                  {ticker}
                </div>
                <div className="text-xl font-bold mb-1">
                  ${price.toFixed(2)}
                </div>
                <div className="text-sm font-bold flex">
                  <div className="mr-2">
                    {isPositive ? (
                      <span style={{ color: Green }}>+${day_change.toFixed(2)}</span>
                    ) : (
                      <span style={{ color: Pink }}>-${Math.abs(day_change).toFixed(2)}</span>
                    )}
                  </div>
                  <div>
                    {isPositive ? (
                      <span style={{ color: Green }}>(+{day_change_percent.toFixed(2)}%)</span>
                    ) : (
                      <span style={{ color: Pink }}>({day_change_percent.toFixed(2)}%)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground ml-1">
                Last updated: {format(new Date(time), 'MMM d, h:mm a')}
              </div>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
} 