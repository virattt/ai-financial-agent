'use client';

import { FinancialTableBase, BaseFinancialData, BaseLineItem } from './financial-table-base';
import { formatFinancialValue, isPerShareField, isShareCountField, formatPerShareValue, formatShareCount } from './financial-table-utils';

interface IncomeStatementData extends BaseFinancialData {
  revenue?: number;
  cost_of_revenue?: number;
  gross_profit?: number;
  operating_expense?: number;
  selling_general_and_administrative_expenses?: number;
  research_and_development?: number;
  operating_income?: number;
  interest_expense?: number;
  ebit?: number;
  income_tax_expense?: number;
  net_income?: number;
  net_income_common_stock?: number;
  earnings_per_share?: number;
  earnings_per_share_diluted?: number;
  weighted_average_shares?: number;
  weighted_average_shares_diluted?: number;
}

interface IncomeStatementsTableProps {
  data: IncomeStatementData[];
  title?: string;
}

interface IncomeLineItem extends BaseLineItem {
  // Can extend with income-statement specific properties if needed
}

export function IncomeStatementsTable({ 
  data,
  title = "Income Statement"
}: IncomeStatementsTableProps) {
  // Define the structure of an income statement with proper groupings
  const incomeStatementStructure: IncomeLineItem[] = [
    // Revenue Section
    { key: 'revenue', label: 'Revenue', type: 'line_item', indentLevel: 0 },
    { key: 'cost_of_revenue', label: 'Cost of Revenue', type: 'line_item', indentLevel: 0 },
    { key: 'gross_profit', label: 'Gross Profit', type: 'line_item', indentLevel: 0, isCalculated: true },
    
    // Operating Expenses (indented to show they're deductions from gross profit)
    { key: 'selling_general_and_administrative_expenses', label: 'Selling, General & Administrative', type: 'line_item', indentLevel: 1 },
    { key: 'research_and_development', label: 'Research & Development', type: 'line_item', indentLevel: 1 },
    { key: 'operating_expense', label: 'Total Operating Expenses', type: 'line_item', indentLevel: 1 },
    { key: 'operating_income', label: 'Operating Income', type: 'line_item', indentLevel: 0, isCalculated: true },
    
    // Non-Operating Items (indented to show they're deductions from operating income)
    { key: 'interest_expense', label: 'Interest Expense', type: 'line_item', indentLevel: 1 },
    { key: 'ebit', label: 'Earnings Before Income Taxes', type: 'line_item', indentLevel: 0, isCalculated: true },
    
    // Tax and Final Result (indented to show it's a deduction from pre-tax earnings)
    { key: 'income_tax_expense', label: 'Income Tax Expense', type: 'line_item', indentLevel: 1 },
    { key: 'net_income', label: 'Net Income', type: 'line_item', indentLevel: 0, isCalculated: true },
    
    // Per Share Data (indented to show they're related metrics)
    { key: 'earnings_per_share', label: 'Earnings Per Share (Basic)', type: 'line_item', indentLevel: 1 },
    { key: 'earnings_per_share_diluted', label: 'Earnings Per Share (Diluted)', type: 'line_item', indentLevel: 1 },
    { key: 'weighted_average_shares', label: 'Weighted Average Shares Outstanding', type: 'line_item', indentLevel: 1 },
    { key: 'weighted_average_shares_diluted', label: 'Weighted Average Shares Outstanding (Diluted)', type: 'line_item', indentLevel: 1 },
  ];

  // Custom formatting function for income statement data
  const formatValue = (value: any, item: IncomeLineItem) => {
    if (isPerShareField(item.key)) {
      return formatPerShareValue(value);
    }
    
    if (isShareCountField(item.key)) {
      return formatShareCount(value);
    }
    
    return formatFinancialValue(value);
  };

  return (
    <FinancialTableBase
      data={data}
      title={title}
      accordionValue="income-statements-table"
      lineItemStructure={incomeStatementStructure}
      formatValue={formatValue}
    />
  );
} 