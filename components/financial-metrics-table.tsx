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

interface FinancialMetricsData {
  [key: string]: any;
  ticker: string;
  report_period: string;
  period: string;
  market_cap?: number;
  enterprise_value?: number;
  price_to_earnings_ratio?: number;
  price_to_book_ratio?: number;
  price_to_sales_ratio?: number;
  enterprise_value_to_ebitda_ratio?: number;
  enterprise_value_to_revenue_ratio?: number;
  free_cash_flow_yield?: number;
  peg_ratio?: number;
  gross_margin?: number;
  operating_margin?: number;
  net_margin?: number;
  return_on_equity?: number;
  return_on_assets?: number;
  return_on_invested_capital?: number;
  asset_turnover?: number;
  inventory_turnover?: number;
  receivables_turnover?: number;
  days_sales_outstanding?: number;
  operating_cycle?: number;
  working_capital_turnover?: number;
  current_ratio?: number;
  quick_ratio?: number;
  cash_ratio?: number;
  operating_cash_flow_ratio?: number;
  debt_to_equity?: number;
  debt_to_assets?: number;
  interest_coverage?: number;
  revenue_growth?: number;
  earnings_growth?: number;
  book_value_growth?: number;
  earnings_per_share_growth?: number;
  free_cash_flow_growth?: number;
  operating_income_growth?: number;
  ebitda_growth?: number;
  payout_ratio?: number;
  earnings_per_share?: number;
  book_value_per_share?: number;
  free_cash_flow_per_share?: number;
}

interface FinancialMetricsTableProps {
  data: FinancialMetricsData[];
  title?: string;
}

interface LineItem {
  key: string;
  label: string;
  type: 'line_item' | 'subtotal';
  indentLevel: number;
  formatType: 'currency' | 'ratio' | 'percentage' | 'days' | 'times';
}

export function FinancialMetricsTable({ 
  data,
  title = "Financial Metrics"
}: FinancialMetricsTableProps) {
  if (!data || data.length === 0) return null;

  const ticker = data[0].ticker;

  // Define the structure of financial metrics with proper groupings
  const financialMetricsStructure: LineItem[] = [
    // Valuation Metrics
    { key: 'valuation_header', label: 'Valuation Metrics', type: 'subtotal', indentLevel: 0, formatType: 'currency' },
    { key: 'market_cap', label: 'Market Cap', type: 'line_item', indentLevel: 1, formatType: 'currency' },
    { key: 'enterprise_value', label: 'Enterprise Value', type: 'line_item', indentLevel: 1, formatType: 'currency' },
    { key: 'price_to_earnings_ratio', label: 'Price-to-Earnings Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'price_to_book_ratio', label: 'Price-to-Book Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'price_to_sales_ratio', label: 'Price-to-Sales Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'enterprise_value_to_ebitda_ratio', label: 'EV/EBITDA Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'enterprise_value_to_revenue_ratio', label: 'EV/Revenue Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'free_cash_flow_yield', label: 'Free Cash Flow Yield', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'peg_ratio', label: 'PEG Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    
    // Profitability Metrics
    { key: 'profitability_header', label: 'Profitability Metrics', type: 'subtotal', indentLevel: 0, formatType: 'percentage' },
    { key: 'gross_margin', label: 'Gross Margin', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'operating_margin', label: 'Operating Margin', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'net_margin', label: 'Net Margin', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'return_on_equity', label: 'Return on Equity', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'return_on_assets', label: 'Return on Assets', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'return_on_invested_capital', label: 'Return on Invested Capital', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    
    // Efficiency Metrics
    { key: 'efficiency_header', label: 'Efficiency Metrics', type: 'subtotal', indentLevel: 0, formatType: 'times' },
    { key: 'asset_turnover', label: 'Asset Turnover', type: 'line_item', indentLevel: 1, formatType: 'times' },
    { key: 'inventory_turnover', label: 'Inventory Turnover', type: 'line_item', indentLevel: 1, formatType: 'times' },
    { key: 'receivables_turnover', label: 'Receivables Turnover', type: 'line_item', indentLevel: 1, formatType: 'times' },
    { key: 'days_sales_outstanding', label: 'Days Sales Outstanding', type: 'line_item', indentLevel: 1, formatType: 'days' },
    { key: 'operating_cycle', label: 'Operating Cycle', type: 'line_item', indentLevel: 1, formatType: 'days' },
    { key: 'working_capital_turnover', label: 'Working Capital Turnover', type: 'line_item', indentLevel: 1, formatType: 'times' },
    
    // Liquidity Metrics
    { key: 'liquidity_header', label: 'Liquidity Metrics', type: 'subtotal', indentLevel: 0, formatType: 'ratio' },
    { key: 'current_ratio', label: 'Current Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'quick_ratio', label: 'Quick Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'cash_ratio', label: 'Cash Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'operating_cash_flow_ratio', label: 'Operating Cash Flow Ratio', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    
    // Leverage Metrics
    { key: 'leverage_header', label: 'Leverage Metrics', type: 'subtotal', indentLevel: 0, formatType: 'ratio' },
    { key: 'debt_to_equity', label: 'Debt-to-Equity', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'debt_to_assets', label: 'Debt-to-Assets', type: 'line_item', indentLevel: 1, formatType: 'ratio' },
    { key: 'interest_coverage', label: 'Interest Coverage', type: 'line_item', indentLevel: 1, formatType: 'times' },
    
    // Growth Metrics
    { key: 'growth_header', label: 'Growth Metrics', type: 'subtotal', indentLevel: 0, formatType: 'percentage' },
    { key: 'revenue_growth', label: 'Revenue Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'earnings_growth', label: 'Earnings Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'book_value_growth', label: 'Book Value Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'earnings_per_share_growth', label: 'EPS Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'free_cash_flow_growth', label: 'Free Cash Flow Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'operating_income_growth', label: 'Operating Income Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    { key: 'ebitda_growth', label: 'EBITDA Growth', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
    
    // Per-Share & Other Metrics
    { key: 'per_share_header', label: 'Per-Share Metrics', type: 'subtotal', indentLevel: 0, formatType: 'currency' },
    { key: 'earnings_per_share', label: 'Earnings Per Share', type: 'line_item', indentLevel: 1, formatType: 'currency' },
    { key: 'book_value_per_share', label: 'Book Value Per Share', type: 'line_item', indentLevel: 1, formatType: 'currency' },
    { key: 'free_cash_flow_per_share', label: 'Free Cash Flow Per Share', type: 'line_item', indentLevel: 1, formatType: 'currency' },
    { key: 'payout_ratio', label: 'Payout Ratio', type: 'line_item', indentLevel: 1, formatType: 'percentage' },
  ];

  // Filter to only show items that have data in at least one period, excluding headers
  const visibleItems = financialMetricsStructure.filter(item => {
    if (item.key.endsWith('_header')) return true; // Always show headers
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

  // Format values based on their type
  const formatValue = (value: any, formatType: string) => {
    if (typeof value !== 'number') return '-';
    
    switch (formatType) {
      case 'currency':
        // Format currency values (market cap, per-share values)
        if (Math.abs(value) >= 1e9) {
          return `$${(value / 1e9).toFixed(2)}B`;
        }
        if (Math.abs(value) >= 1e6) {
          return `$${(value / 1e6).toFixed(2)}M`;
        }
        if (Math.abs(value) >= 1e3) {
          return `$${(value / 1e3).toFixed(0)}K`;
        }
        return `$${value.toFixed(2)}`;
      
      case 'percentage':
        // Format as percentage
        return `${(value * 100).toFixed(1)}%`;
      
      case 'ratio':
        // Format as ratio with 2 decimal places
        return value.toFixed(2);
      
      case 'times':
        // Format as "X times" with 1 decimal place
        return `${value.toFixed(1)}x`;
      
      case 'days':
        // Format as days
        return `${value.toFixed(0)} days`;
      
      default:
        return value.toFixed(2);
    }
  };

  const getRowStyling = (item: LineItem) => {
    if (item.key.endsWith('_header')) {
      return "font-semibold border-t border-muted-foreground/20";
    }
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
    
    const isHeader = item.key.endsWith('_header');
    
    return {
      style: indentStyle,
      className: cx({
        "font-normal": item.type === 'line_item' && item.indentLevel > 0,
        "font-medium": item.type === 'line_item' && item.indentLevel === 0,
        "font-semibold": item.type === 'subtotal' || isHeader,
        "text-foreground/80": item.type === 'line_item' && item.indentLevel > 0,
      })
    };
  };

  const headerTitle = `${ticker} ${title} (${formatPeriod(data[0].period)})`;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="financial-metrics-table" className="border-none">
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
                          {formatValue(period[item.key], item.formatType)}
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