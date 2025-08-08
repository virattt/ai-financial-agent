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
import { IncomeStatementsTable } from './income-statements-table';
import { BalanceSheetsTable } from './balance-sheets-table';
import { CashFlowStatementsTable } from './cash-flow-statements-table';
import { FinancialMetricsTable } from './financial-metrics-table';

interface FinancialData {
  [key: string]: any;
  ticker?: string;
  report_period: string;
  period?: string;
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

  // Check if this is income statement data by looking for key income statement fields
  const isIncomeStatementData = (data: FinancialData[]) => {
    const incomeStatementFields = [
      'revenue',
      'cost_of_revenue', 
      'gross_profit',
      'operating_income',
      'net_income'
    ];
    
    // If the data has at least 3 of the key income statement fields, treat it as income statement data
    const foundFields = incomeStatementFields.filter(field => 
      data.some(period => period[field] != null)
    );
    
    return foundFields.length >= 3;
  };

  // Check if this is balance sheet data by looking for key balance sheet fields
  const isBalanceSheetData = (data: FinancialData[]) => {
    const balanceSheetFields = [
      'total_assets',
      'current_assets',
      'total_liabilities',
      'current_liabilities',
      'shareholders_equity'
    ];
    
    // If the data has at least 3 of the key balance sheet fields, treat it as balance sheet data
    const foundFields = balanceSheetFields.filter(field => 
      data.some(period => period[field] != null)
    );
    
    return foundFields.length >= 3;
  };

  // Check if this is cash flow statement data by looking for key cash flow fields
  const isCashFlowStatementData = (data: FinancialData[]) => {
    const cashFlowFields = [
      'net_cash_flow_from_operations',
      'net_cash_flow_from_investing',
      'net_cash_flow_from_financing',
      'change_in_cash_and_equivalents',
      'ending_cash_balance'
    ];
    
    // If the data has at least 3 of the key cash flow fields, treat it as cash flow statement data
    const foundFields = cashFlowFields.filter(field => 
      data.some(period => period[field] != null)
    );
    
    return foundFields.length >= 3;
  };

  // Check if this is financial metrics data by looking for key metrics fields
  const isFinancialMetricsData = (data: FinancialData[]) => {
    const financialMetricsFields = [
      'market_cap',
      'price_to_earnings_ratio',
      'gross_margin',
      'current_ratio',
      'debt_to_equity',
      'revenue_growth'
    ];
    
    // If the data has at least 3 of the key financial metrics fields, treat it as financial metrics data
    const foundFields = financialMetricsFields.filter(field => 
      data.some(period => period[field] != null)
    );
    
    return foundFields.length >= 3;
  };

  // Check if the data has required properties for specialized components
  const hasRequiredProperties = (data: FinancialData[]) => {
    return data.length > 0 && data[0].ticker && data[0].period;
  };

  // If this is income statement data and has required properties, use the specialized component
  if (isIncomeStatementData(data) && hasRequiredProperties(data)) {
    return <IncomeStatementsTable data={data as any} title={title} />;
  }

  // If this is balance sheet data and has required properties, use the specialized component
  if (isBalanceSheetData(data) && hasRequiredProperties(data)) {
    return <BalanceSheetsTable data={data as any} title={title} />;
  }

  // If this is cash flow statement data and has required properties, use the specialized component
  if (isCashFlowStatementData(data) && hasRequiredProperties(data)) {
    return <CashFlowStatementsTable data={data as any} title={title} />;
  }

  // If this is financial metrics data and has required properties, use the specialized component
  if (isFinancialMetricsData(data) && hasRequiredProperties(data)) {
    return <FinancialMetricsTable data={data as any} title={title} />;
  }

  // Get ticker from first data item
  const ticker = data[0].ticker;

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

  const headerTitle = title ? `${ticker} (${title} • ${formatPeriod(data[0].period!)})` : `${ticker} (${formatPeriod(data[0].period!)})`;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="financials-table" className="border-none">
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
                  <TableHead className="w-[300px] min-w-[300px] border-r whitespace-nowrap bg-muted left-0">
                    Line Items
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
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
} 