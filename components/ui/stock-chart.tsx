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
import { DarkCharcoal, Gray, Green, Pink, White, Blue } from "@/components/styles/colors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export interface PriceData {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: string;
}

export interface StockChartProps {
  ticker: string;
  prices: PriceData[];
}

export function StockChart(props: StockChartProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="stock-chart" className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-3 hover:no-underline hover:bg-muted rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Blue}
              />
              <span className="text-sm">Retrieved data:</span>{" "}
              <span className="text-muted-foreground text-sm">{props.ticker} (Prices)</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 rounded-md p-4 bg-background max-w-[750px]">
              <ChartHeader ticker={props.ticker} prices={props.prices} />
              <Chart
                data={props.prices.map((price) => {
                  return ({
                    date: formatDate(price.time),
                    value: price.close,
                  });
                })}
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
  prices: PriceData[],
}

function ChartHeader({
  ticker, prices,
}: ChartHeaderProps) {
  // Compute percent and dollar difference between end price and start price
  const startPrice = prices[0].close;
  const endPrice = prices[prices.length - 1].close;
  const percentDifference = ((endPrice - startPrice) / startPrice) * 100;
  const dollarDifference = endPrice - startPrice;

  return (
    <div className="ml-4">
      <div className="text-2xl">
        {ticker}
      </div>
      <div className="text-xl font-bold mb-1">
        ${prices[prices.length - 1].close.toFixed(2)}
      </div>
      <div className="text-sm font-bold flex">
        <div className="mr-2">
          {dollarDifference > 0 ? (
            <span style={{ color: Green }}>+${dollarDifference.toFixed(2)}</span>
          ) : (
            <span style={{ color: Pink }}>-${Math.abs(dollarDifference).toFixed(2)}</span>
          )}
        </div>
        <div>
          {percentDifference > 0 ? (
            <span style={{ color: Green }}>(+{percentDifference.toFixed(2)}%)</span>
          ) : (
            <span style={{ color: Pink }}>({percentDifference.toFixed(2)}%)</span>
          )}
        </div>
      </div>
    </div>
  );
};