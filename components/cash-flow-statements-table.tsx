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

interface CashFlowStatementData {
  [key: string]: any;
  ticker: string;
  report_period: string;
  period: string;
  net_income?: number;
  depreciation_and_amortization?: number;
  share_based_compensation?: number;
  net_cash_flow_from_operations?: number;
  net_cash_flow_from_investing?: number;
  capital_expenditure?: number;
  property_plant_and_equipment?: number;
  business_acquisitions_and_disposals?: number;
  investment_acquisitions_and_disposals?: number;
  net_cash_flow_from_financing?: number;
  issuance_or_repayment_of_debt_securities?: number;
  issuance_or_purchase_of_equity_shares?: number;
  dividends_and_other_cash_distributions?: number;
  change_in_cash_and_equivalents?: number;
  effect_of_exchange_rate_changes?: number;
  ending_cash_balance?: number;
  free_cash_flow?: number;
}

interface CashFlowStatementsTableProps {
  data: CashFlowStatementData[];
  title?: string;
}

interface LineItem {
  key: string;
  label: string;
  type: 'line_item' | 'subtotal';
  indentLevel: number;
  isCalculated?: boolean;
}

export function CashFlowStatementsTable({ 
  data,
  title = "Cash Flow Statement"
}: CashFlowStatementsTableProps) {
  if (!data || data.length === 0) return null;

  const ticker = data[0].ticker;

  // Define the structure of a cash flow statement with proper groupings
  const cashFlowStatementStructure: LineItem[] = [
    // Operating Activities
    { key: 'net_income', label: 'Net Income', type: 'line_item', indentLevel: 0 },
    { key: 'depreciation_and_amortization', label: 'Depreciation and Amortization', type: 'line_item', indentLevel: 1 },
    { key: 'share_based_compensation', label: 'Share-Based Compensation', type: 'line_item', indentLevel: 1 },
    { key: 'net_cash_flow_from_operations', label: 'Net Cash Flow from Operations', type: 'subtotal', indentLevel: 0 },
    
    // Investing Activities
    { key: 'capital_expenditure', label: 'Capital Expenditure', type: 'line_item', indentLevel: 1 },
    { key: 'property_plant_and_equipment', label: 'Property, Plant & Equipment', type: 'line_item', indentLevel: 1 },
    { key: 'business_acquisitions_and_disposals', label: 'Business Acquisitions and Disposals', type: 'line_item', indentLevel: 1 },
    { key: 'investment_acquisitions_and_disposals', label: 'Investment Acquisitions and Disposals', type: 'line_item', indentLevel: 1 },
    { key: 'net_cash_flow_from_investing', label: 'Net Cash Flow from Investing', type: 'subtotal', indentLevel: 0 },
    
    // Financing Activities
    { key: 'issuance_or_repayment_of_debt_securities', label: 'Issuance or Repayment of Debt Securities', type: 'line_item', indentLevel: 1 },
    { key: 'issuance_or_purchase_of_equity_shares', label: 'Issuance or Purchase of Equity Shares', type: 'line_item', indentLevel: 1 },
    { key: 'dividends_and_other_cash_distributions', label: 'Dividends and Other Cash Distributions', type: 'line_item', indentLevel: 1 },
    { key: 'net_cash_flow_from_financing', label: 'Net Cash Flow from Financing', type: 'subtotal', indentLevel: 0 },
    
    // Net Change and Ending Balance
    { key: 'effect_of_exchange_rate_changes', label: 'Effect of Exchange Rate Changes', type: 'line_item', indentLevel: 1 },
    { key: 'change_in_cash_and_equivalents', label: 'Change in Cash and Equivalents', type: 'line_item', indentLevel: 0 },
    { key: 'ending_cash_balance', label: 'Ending Cash Balance', type: 'line_item', indentLevel: 0 },
    
    // Additional Metrics
    { key: 'free_cash_flow', label: 'Free Cash Flow', type: 'line_item', indentLevel: 1 },
  ];

  // Filter to only show items that have data in at least one period
  const visibleItems = cashFlowStatementStructure.filter(item => {
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
  const formatValue = (value: any) => {
    if (typeof value !== 'number') return '-';
    
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
      <AccordionItem value="cash-flow-statements-table" className="border-none">
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
                          {formatValue(period[item.key])}
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