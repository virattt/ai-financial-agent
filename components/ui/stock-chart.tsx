import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { Gray, Green, Pink, Blue } from "@/components/styles/colors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';

export interface Price {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: string;
}

export interface Snapshot {
  ticker: string;
  price: number;
  day_change: number;
  day_change_percent: number;
  market_cap: number;
  volume: number;
  time: string;
}

export interface HistoricalResult {
  ticker: string;
  prices: Price[];
}

export interface SnapshotResult {
  snapshot: Snapshot;
}

export interface StockPriceResult {
  ticker: string;
  snapshot: SnapshotResult | null;
  historical: HistoricalResult | null;
}

export interface StockChartProps {
  result: StockPriceResult;
  ticker: string;
}

export function StockChart(props: StockChartProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="stock-chart" className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-2 hover:no-underline hover:bg-muted rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Green}
              />
              <span className="text-muted-foreground text-sm">{props.ticker} (Prices)</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 rounded-md p-4 bg-background max-w-[750px]">
              <ChartHeader
                ticker={props.ticker}
                prices={props.result.historical?.prices || []}
                snapshot={props.result.snapshot?.snapshot || null}
              />
              <Chart
                data={props.result.historical?.prices?.map((price) => ({
                  date: formatDate(price.time),
                  value: price.close,
                })) || []}
              />
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  };
  return date.toLocaleDateString('en-US', options);
}

type ChartProps = {
  data: ChartData[];
};

interface ChartData {
  value: number;
  date: string;
  date_label?: string;
}

function Chart({ data }: ChartProps) {
  if (data.length === 0) {
    return <div />;
  }

  const startValue = data[0].value;
  const endValue = data[data.length - 1].value;
  const maxValue = Math.max(startValue, endValue, startValue);
  const minValue = Math.min(startValue, endValue, startValue);

  const color = endValue > startValue ? Green : Pink;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart className="ml-n2" data={data}>
        <Area
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="transparent"
        />

        <XAxis
          dataKey='date_label'
          axisLine={false}
          tickLine={false}
          tickFormatter={str => {
            if (str === "09:30 AM" || str === "12 PM" || str === "3 PM") {
              return str;
            }
            const date = parseISO(str);
            if (date.getDate() % 7 === 0) {
              return format(date, "MMM, d");
            }
            return "";
          }}
        />

        <YAxis
          dataKey="value"
          width={20}
          axisLine={false}
          tickLine={false}
          tick={false}
          domain={[minValue - getDomainBuffer(minValue), maxValue + getDomainBuffer(maxValue)]}
        />

        <ReferenceLine y={startValue} stroke={Gray} strokeDasharray="1 3" />
        <Tooltip content={<CustomTooltip />} />

        <CartesianGrid opacity={0.1} vertical={false} />

      </AreaChart>
    </ResponsiveContainer>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="stock-tooltip bg-background border rounded-md px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">${`${payload[0].value}`}</span>
          <span className="text-muted-foreground">{`${payload[0].payload.date}`}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const getDomainBuffer = (maxValue: number) => {
  if (maxValue >= 100000) {
    return 1000;
  }
  if (maxValue >= 100000) {
    return 10;
  }

  if (maxValue >= 1000) {
    return 1
  }
  return .1;
};


interface ChartHeaderProps {
  ticker: string,
  prices: Price[],
  snapshot: Snapshot | null,
}

function formatLargeNumber(num: number): string {
  const trillion = 1000000000000;
  const billion = 1000000000;
  const million = 1000000;
  const thousand = 1000;

  if (num >= trillion) {
    return `${(num / trillion).toFixed(2)}T`;
  } else if (num >= billion) {
    return `${(num / billion).toFixed(2)}B`;
  } else if (num >= million) {
    return `${(num / million).toFixed(2)}M`;
  } else if (num >= thousand) {
    return `${(num / thousand).toFixed(2)}k`;
  }
  return num.toString();
}

function ChartHeader({
  ticker, prices, snapshot
}: ChartHeaderProps) {
  // Return null only if both prices and snapshot are missing
  if ((!prices || prices.length === 0) && !snapshot) {
    return null;
  }

  // Default values in case snapshot is null
  const dayChange = snapshot?.day_change ?? 0;
  const dayChangePercent = snapshot?.day_change_percent ?? 0;
  const volume = snapshot?.volume ?? 0;
  const marketCap = snapshot?.market_cap ?? 0;
  
  // Get current price from either snapshot or last price in prices array
  const currentPrice = snapshot?.price ?? 
    (prices && prices.length > 0 ? prices[prices.length - 1].close : 0);

  return (
    <div className="ml-4">
      <div className="text-2xl">
        {ticker}
      </div>
      <div className="text-3xl font-bold mb-1">
        ${currentPrice.toFixed(2)}
      </div>
      <div className="text-sm flex">
        <div className="mr-2">
          {dayChange > 0 ? (
            <span style={{ color: Green }}>+${dayChange.toFixed(2)}</span>
          ) : (
            <span style={{ color: Pink }}>-${Math.abs(dayChange).toFixed(2)}</span>
          )}
        </div>
        <div>
          {dayChangePercent > 0 ? (
            <span style={{ color: Green }}>(+{dayChangePercent.toFixed(2)}%)</span>
          ) : (
            <span style={{ color: Pink }}>({dayChangePercent.toFixed(2)}%)</span>
          )}
        </div>
        <div className="ml-2 flex items-center">
          {dayChangePercent > 0 ? (
            <span style={{ color: Green }}>
              <FontAwesomeIcon icon={faCaretUp} className="mr-1" />
              Today
            </span>
          ) : (
            <span style={{ color: Pink }}>
              <FontAwesomeIcon icon={faCaretDown} className="mr-1" />
              Today
            </span>
          )}
        </div>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Mkt Cap: ${formatLargeNumber(marketCap)}</span>
      </div>
    </div>
  );
};