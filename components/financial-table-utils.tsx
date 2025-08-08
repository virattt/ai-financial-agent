// Shared utilities for financial table components

// Format large numbers in M/B notation with appropriate decimals
export const formatFinancialValue = (value: any, decimals: number = 2) => {
  if (typeof value !== 'number') return '-';
  
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

// Format currency values with $ prefix
export const formatCurrencyValue = (value: any, decimals: number = 2) => {
  if (typeof value !== 'number') return '-';
  
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  }
  return `$${value.toFixed(decimals)}`;
};

// Format share counts (usually larger numbers)
export const formatShareCount = (value: any) => {
  if (typeof value !== 'number') return '-';
  
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
};

// Format per-share values (usually smaller, need more precision)
export const formatPerShareValue = (value: any) => {
  if (typeof value !== 'number') return '-';
  return value.toFixed(2);
};

// Format percentage values
export const formatPercentage = (value: any, decimals: number = 1) => {
  if (typeof value !== 'number') return '-';
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format ratio values
export const formatRatio = (value: any, decimals: number = 2) => {
  if (typeof value !== 'number') return '-';
  return value.toFixed(decimals);
};

// Format "times" values (like turnover ratios)
export const formatTimes = (value: any, decimals: number = 1) => {
  if (typeof value !== 'number') return '-';
  return `${value.toFixed(decimals)}x`;
};

// Format days
export const formatDays = (value: any) => {
  if (typeof value !== 'number') return '-';
  return `${value.toFixed(0)} days`;
};

// Check if a field is a per-share metric
export const isPerShareField = (key: string): boolean => {
  return key.includes('earnings_per_share') || key.includes('per_share');
};

// Check if a field is a share count metric
export const isShareCountField = (key: string): boolean => {
  return key.includes('weighted_average_shares') || key.includes('outstanding_shares');
};

// Helper type for different formatting types
export type FormatType = 'currency' | 'financial' | 'percentage' | 'ratio' | 'times' | 'days' | 'shares' | 'per_share';

// Universal formatter that delegates to specific formatters
export const formatByType = (value: any, formatType: FormatType, decimals?: number): string => {
  switch (formatType) {
    case 'currency':
      return formatCurrencyValue(value, decimals);
    case 'financial':
      return formatFinancialValue(value, decimals);
    case 'percentage':
      return formatPercentage(value, decimals);
    case 'ratio':
      return formatRatio(value, decimals);
    case 'times':
      return formatTimes(value, decimals);
    case 'days':
      return formatDays(value);
    case 'shares':
      return formatShareCount(value);
    case 'per_share':
      return formatPerShareValue(value);
    default:
      return formatFinancialValue(value, decimals);
  }
}; 