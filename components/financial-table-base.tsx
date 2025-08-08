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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Green } from './styles/colors';

// Common base data interface
export interface BaseFinancialData {
  ticker: string;
  report_period: string;
  period: string;
  [key: string]: any;
}

// Common line item interface
export interface BaseLineItem {
  key: string;
  label: string;
  type: 'line_item' | 'subtotal' | 'intermediate' | 'total';
  indentLevel: number;
  isCalculated?: boolean;
}

export interface FinancialTableBaseProps<T extends BaseFinancialData, L extends BaseLineItem> {
  data: T[];
  title?: string;
  accordionValue: string;
  lineItemStructure: L[];
  formatValue: (value: any, item: L) => string;
  getRowStyling?: (item: L) => string;
  getCellStyling?: (item: L, isFirstCell?: boolean) => { style: any; className: string };
}

// Common utility functions
export const formatPeriod = (period: string) => {
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

export const defaultGetRowStyling = (item: BaseLineItem) => {
  // Handle header rows for financial metrics
  if (item.key.endsWith('_header')) {
    return "font-semibold border-t border-muted-foreground/20";
  }
  
  switch (item.type) {
    case 'subtotal':
      return "font-semibold border-t border-muted-foreground/20";
    case 'intermediate':
      return "font-semibold border-t border-muted-foreground/20 text-muted-foreground";
    case 'total':
      return "font-bold border-t border-b border-muted-foreground/40 bg-muted/40";
    default:
      return "hover:bg-muted/10";
  }
};

export const defaultGetCellStyling = (item: BaseLineItem, isFirstCell: boolean = false) => {
  const indentStyle = item.indentLevel > 0 && isFirstCell ? 
    { paddingLeft: `${1.5 + (item.indentLevel * 1.5)}rem` } : {};
  
  const isHeader = item.key.endsWith('_header');
  
  return {
    style: indentStyle,
    className: cx({
      "font-normal": item.type === 'line_item' && item.indentLevel > 0,
      "font-medium": item.type === 'line_item' && item.indentLevel === 0,
      "font-semibold": item.type === 'subtotal' || item.type === 'intermediate' || isHeader,
      "font-bold": item.type === 'total',
      "text-foreground/80": item.type === 'line_item' && item.indentLevel > 0,
      "text-muted-foreground": item.type === 'intermediate',
    })
  };
};

export function FinancialTableBase<T extends BaseFinancialData, L extends BaseLineItem>({ 
  data,
  title = "Financial Data",
  accordionValue,
  lineItemStructure,
  formatValue,
  getRowStyling = defaultGetRowStyling,
  getCellStyling = defaultGetCellStyling
}: FinancialTableBaseProps<T, L>) {
  if (!data || data.length === 0) return null;

  const ticker = data[0].ticker;

  // Filter to only show items that have data in at least one period, but always show headers
  const visibleItems = lineItemStructure.filter(item => {
    if (item.key.endsWith('_header')) return true; // Always show headers
    return data.some(period => period[item.key] != null);
  });

  const headerTitle = `${ticker} ${title} (${formatPeriod(data[0].period)})`;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={accordionValue} className="border-none">
        <div className="border rounded-lg">
          <AccordionTrigger className="w-full px-4 py-2 hover:no-underline hover:bg-muted rounded-t-lg">
            <span className="flex flex-row items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={'sm'}
                color={Green}
              />
              <span className="text-muted-foreground text-sm">{headerTitle}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="bg-muted">
                  <TableHead className="w-[350px] min-w-[350px] border-r whitespace-nowrap bg-muted left-0">
                    {title}
                  </TableHead>
                  {data.map((period, index) => (
                    <TableHead 
                      key={period.report_period} 
                      className={cx(
                        "text-right font-bold whitespace-nowrap min-w-[120px] hover:bg-muted",
                        { "border-r": index !== data.length - 1 }
                      )}
                    >
                      {format(new Date(period.report_period), 'MMM d, yyyy')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item) => {
                  const cellStyling = getCellStyling(item, true);
                  const isHeader = item.key.endsWith('_header');
                  
                  // For headers, span across all columns
                  if (isHeader) {
                    return (
                      <TableRow key={item.key} className={getRowStyling(item)}>
                        <TableCell 
                          className={cx("border-r w-[350px] min-w-[350px] py-2", cellStyling.className)}
                          style={cellStyling.style}
                          colSpan={data.length + 1}
                        >
                          {item.label}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return (
                    <TableRow key={item.key} className={getRowStyling(item)}>
                      <TableCell 
                        className={cx("border-r w-[350px] min-w-[350px] py-2", cellStyling.className)}
                        style={cellStyling.style}
                      >
                        {item.label}
                      </TableCell>
                      {data.map((period, index) => (
                        <TableCell 
                          key={period.report_period} 
                          className={cx(
                            "text-right tabular-nums py-2",
                            { "border-r": index !== data.length - 1 }
                          )}
                        >
                          {formatValue(period[item.key], item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
} 