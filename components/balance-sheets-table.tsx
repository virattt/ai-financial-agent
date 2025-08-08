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
import { Blue, ElectricViolet, Green } from './styles/colors';

interface BalanceSheetData {
  [key: string]: any;
  ticker: string;
  report_period: string;
  period: string;
  total_assets?: number;
  current_assets?: number;
  cash_and_equivalents?: number;
  inventory?: number;
  current_investments?: number;
  trade_and_non_trade_receivables?: number;
  non_current_assets?: number;
  property_plant_and_equipment?: number;
  goodwill_and_intangible_assets?: number;
  investments?: number;
  non_current_investments?: number;
  tax_assets?: number;
  total_liabilities?: number;
  current_liabilities?: number;
  current_debt?: number;
  trade_and_non_trade_payables?: number;
  deferred_revenue?: number;
  deposit_liabilities?: number;
  non_current_liabilities?: number;
  non_current_debt?: number;
  tax_liabilities?: number;
  shareholders_equity?: number;
  retained_earnings?: number;
  accumulated_other_comprehensive_income?: number;
  outstanding_shares?: number;
  total_debt?: number;
}

interface BalanceSheetsTableProps {
  data: BalanceSheetData[];
  title?: string;
}

interface LineItem {
  key: string;
  label: string;
  type: 'line_item' | 'subtotal';
  indentLevel: number;
  isCalculated?: boolean;
}

export function BalanceSheetsTable({ 
  data,
  title = "Balance Sheet"
}: BalanceSheetsTableProps) {
  if (!data || data.length === 0) return null;

  const ticker = data[0].ticker;

  // Define the structure of a balance sheet with proper groupings
  const balanceSheetStructure: LineItem[] = [
    // Assets Section - Components first, then totals
    { key: 'current_assets', label: 'Current Assets', type: 'subtotal', indentLevel: 0 },
    { key: 'cash_and_equivalents', label: 'Cash and Equivalents', type: 'line_item', indentLevel: 1 },
    { key: 'trade_and_non_trade_receivables', label: 'Trade and Non-Trade Receivables', type: 'line_item', indentLevel: 1 },
    { key: 'inventory', label: 'Inventory', type: 'line_item', indentLevel: 1 },
    { key: 'current_investments', label: 'Current Investments', type: 'line_item', indentLevel: 1 },
    
    { key: 'non_current_assets', label: 'Non-Current Assets', type: 'subtotal', indentLevel: 0 },
    { key: 'property_plant_and_equipment', label: 'Property, Plant & Equipment', type: 'line_item', indentLevel: 1 },
    { key: 'goodwill_and_intangible_assets', label: 'Goodwill and Intangible Assets', type: 'line_item', indentLevel: 1 },
    { key: 'investments', label: 'Investments', type: 'line_item', indentLevel: 1 },
    { key: 'non_current_investments', label: 'Non-Current Investments', type: 'line_item', indentLevel: 1 },
    { key: 'tax_assets', label: 'Tax Assets', type: 'line_item', indentLevel: 1 },
    
    // Total Assets at bottom of Assets section
    { key: 'total_assets', label: 'Total Assets', type: 'line_item', indentLevel: 0 },
    
    // Liabilities Section - Components first, then totals  
    { key: 'current_liabilities', label: 'Current Liabilities', type: 'subtotal', indentLevel: 0 },
    { key: 'current_debt', label: 'Current Debt', type: 'line_item', indentLevel: 1 },
    { key: 'trade_and_non_trade_payables', label: 'Trade and Non-Trade Payables', type: 'line_item', indentLevel: 1 },
    { key: 'deferred_revenue', label: 'Deferred Revenue', type: 'line_item', indentLevel: 1 },
    { key: 'deposit_liabilities', label: 'Deposit Liabilities', type: 'line_item', indentLevel: 1 },
    
    { key: 'non_current_liabilities', label: 'Non-Current Liabilities', type: 'subtotal', indentLevel: 0 },
    { key: 'non_current_debt', label: 'Non-Current Debt', type: 'line_item', indentLevel: 1 },
    { key: 'tax_liabilities', label: 'Tax Liabilities', type: 'line_item', indentLevel: 1 },
    
    // Total Liabilities at bottom of Liabilities section
    { key: 'total_liabilities', label: 'Total Liabilities', type: 'line_item', indentLevel: 0 },
    
    // Equity Section - Components first, then total
    { key: 'retained_earnings', label: 'Retained Earnings', type: 'line_item', indentLevel: 1 },
    { key: 'accumulated_other_comprehensive_income', label: 'Accumulated Other Comprehensive Income', type: 'line_item', indentLevel: 1 },
    { key: 'shareholders_equity', label: 'Shareholders\' Equity', type: 'line_item', indentLevel: 0 },
    
    // Additional Metrics
    { key: 'outstanding_shares', label: 'Outstanding Shares', type: 'line_item', indentLevel: 1 },
    { key: 'total_debt', label: 'Total Debt', type: 'line_item', indentLevel: 1 },
  ];

  // Filter to only show items that have data in at least one period
  const visibleItems = balanceSheetStructure.filter(item => {
    return data.some(period => period[item.key] != null);
  });

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

  // Format number values for financial data
  const formatValue = (value: any, isShareCount: boolean = false) => {
    if (typeof value !== 'number') return '-';
    
    if (isShareCount) {
      // Format share counts in billions/millions
      if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
      }
      if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(0)}K`;
      }
      return value.toFixed(0);
    }
    
    // Format large numbers in millions/billions
    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const isShareCountItem = (key: string) => {
    return key.includes('outstanding_shares');
  };

  const getRowStyling = (item: LineItem) => {
    switch (item.type) {
      case 'subtotal':
        return "font-semibold border-t border-muted-foreground/20";
      default:
        return "hover:bg-muted/10";
    }
  };

  const getCellStyling = (item: LineItem, isFirstCell: boolean = false) => {
    const indentStyle = item.indentLevel > 0 && isFirstCell ? 
      { paddingLeft: `${1.5 + (item.indentLevel * 1.5)}rem` } : {};
    
    return {
      style: indentStyle,
      className: cx({
        "font-normal": item.type === 'line_item' && item.indentLevel > 0,
        "font-medium": item.type === 'line_item' && item.indentLevel === 0,
        "font-semibold": item.type === 'subtotal',
        "text-foreground/80": item.type === 'line_item' && item.indentLevel > 0,
      })
    };
  };

  const headerTitle = `${ticker} ${title} (${formatPeriod(data[0].period)})`;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="balance-sheets-table" className="border-none">
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
                          {formatValue(period[item.key], isShareCountItem(item.key))}
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