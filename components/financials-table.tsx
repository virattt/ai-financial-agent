'use client';

import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cx } from 'class-variance-authority';

interface FinancialData {
  [key: string]: any;
  report_period: string;
}

interface FinancialsTableProps {
  data: FinancialData[];
  excludeFields?: string[];
  title?: string;
}

export function FinancialsTable({ 
  data,
  excludeFields = ['ticker', 'calendar_date', 'report_period', 'period', 'currency'],
  title
}: FinancialsTableProps) {
  if (!data || data.length === 0) return null;

  // Get all unique keys from the data, excluding specified fields
  const lineItems = Object.keys(data[0]).filter(key => !excludeFields.includes(key));

  // Format period label
  const formatPeriod = (period: string) => {
    switch (period) {
      case 'ttm':
        return 'TTM';
      case 'quarterly':
        return 'Quarterly';
      case 'annual':
        return 'Annual';
      default:
        return period;
    }
  };

  // Format number values
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      // Format large numbers in millions/billions
      if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
      }
      if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
      }
      return value.toFixed(2);
    }
    return value;
  };

  // Convert snake_case to Title Case
  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="border rounded-lg">
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0">
            <TableRow className="bg-muted z-10">
              <TableHead className="w-[300px] min-w-[300px] font-bold border-r whitespace-nowrap bg-muted left-0">
                {title ? `${title} (${formatPeriod(data[0].period)})` : formatPeriod(data[0].period)}
              </TableHead>
              {data.map((period, index) => (
                <TableHead 
                  key={period.report_period} 
                  className={cx(
                    "text-right font-bold whitespace-nowrap min-w-[120px]",
                    { "border-r": index !== data.length - 1 }
                  )}
                >
                  {format(new Date(period.report_period), 'MMM d, yyyy')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => (
              <TableRow key={item}>
                <TableCell className="font-medium border-r w-[300px] min-w-[300px]">
                  {formatLabel(item)}
                </TableCell>
                {data.map((period, index) => (
                  <TableCell 
                    key={period.report_period} 
                    className={cx(
                      "text-right",
                      { "border-r": index !== data.length - 1 }
                    )}
                  >
                    {formatValue(period[item])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 