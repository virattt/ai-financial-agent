'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cx } from 'class-variance-authority';
import { ArrowUpDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Blue, Green } from './styles/colors';

interface StockScreenerResult {
  ticker: string;
  report_period: string;
  period: string;
  currency: string;
  [key: string]: any;
}

interface StockScreenerTableProps {
  data: StockScreenerResult[];
  excludeFields?: string[];
}

type SortConfig = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function StockScreenerTable({ 
  data,
  excludeFields = ['period', 'currency']
}: StockScreenerTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: 'asc'
  });

  if (!data || data.length === 0) return null;

  // Get all unique keys from the data, excluding specified fields
  const metrics = Object.keys(data[0]).filter(key => !excludeFields.includes(key));

  // Format number values
  const formatValue = (value: any, metric: string, currency: string) => {
    if (metric === 'ticker' || metric === 'report_period') {
      return value;
    }

    if (typeof value === 'number') {
      const currencySymbol = currency === 'USD' ? '$' : currency;
      let formattedNumber;
      
      // Format large numbers in millions/billions
      if (Math.abs(value) >= 1e9) {
        formattedNumber = `${(value / 1e9).toFixed(2)}B`;
      } else if (Math.abs(value) >= 1e6) {
        formattedNumber = `${(value / 1e6).toFixed(2)}M`;
      } else {
        formattedNumber = value.toFixed(2);
      }
      
      return `${currencySymbol}${formattedNumber}`;
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

  // Handle column sort
  const handleSort = (column: string) => {
    setSortConfig(prevConfig => ({
      column,
      direction: 
        prevConfig.column === column && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };

  // Sort data based on current configuration
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.column) return 0;

    const column = sortConfig.column;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    // Handle different column types
    if (column === 'report_period') {
      return direction * (new Date(a[column]).getTime() - new Date(b[column]).getTime());
    } else if (column === 'ticker') {
      return direction * a[column].localeCompare(b[column]);
    } else if (typeof a[column] === 'number') {
      return direction * (a[column] - b[column]);
    }

    // Fallback to string comparison
    return direction * String(a[column]).localeCompare(String(b[column]));
  });

  return (
    <Accordion type="single" collapsible className="w-full py=">
      <AccordionItem value="stock-screener-table" className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-2 hover:no-underline hover:bg-muted/50 rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
            <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Green}
              />
              <span className="text-muted-foreground text-sm">Search Results</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow className="bg-muted z-10">
                    {metrics.map((metric, index) => (
                      <TableHead 
                        key={metric}
                        className={cx(
                          "font-bold whitespace-nowrap cursor-pointer select-none",
                          metric !== 'ticker' && "text-right",
                          { "border-r": index !== metrics.length - 1 }
                        )}
                        onClick={() => handleSort(metric)}
                      >
                        <div className="flex items-center gap-1 justify-between">
                          {formatLabel(metric)}
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((result, rowIndex) => (
                    <TableRow key={`${result.ticker}-${result.report_period}`}>
                      {metrics.map((metric, colIndex) => (
                        <TableCell 
                          key={`${result.ticker}-${metric}`}
                          className={cx(
                            metric === 'ticker' ? "font-medium" : "text-right",
                            { "border-r": colIndex !== metrics.length - 1 }
                          )}
                        >
                          {metric === 'report_period' 
                            ? format(new Date(result[metric]), 'MMM d, yyyy')
                            : formatValue(result[metric], metric, result.currency)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-2 text-sm text-muted-foreground bg-muted border-t">
              {`${data[0].period.toLowerCase() === 'ttm' 
                ? 'TTM' 
                : data[0].period.charAt(0).toUpperCase() + data[0].period.slice(1)} data in ${data[0].currency}`}
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
} 