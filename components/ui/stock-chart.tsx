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
import { DarkCharcoal, Gray, Green, Pink, White } from "@/components/styles/colors";

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
    <div style={{ minWidth: "750px" }}>
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
      <div className="stock-tooltip">
        <div className="row mx-1">
          <span className="label" color={DarkCharcoal} style={{ fontWeight: "bold" }}>${`${payload[0].value}`}</span>
          <span className="ml-2" color={Gray}>{`${payload[0].payload.date}`}</span>
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
    <div>
      <div style={{ fontSize: "28px" }}>
        {ticker}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>
        ${prices[prices.length - 1].close.toFixed(2)}
      </div>
      <div style={{ fontSize: "12px", fontWeight: "bold", display: "flex" }}>
        <div style={{ marginRight: "8px" }}>
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