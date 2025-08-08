import { z } from 'zod';
import { validStockSearchFilters } from '@/lib/api/stock-filters';

export const financialTools = [
  'getStockPrices',
  'getIncomeStatements',
  'getBalanceSheets',
  'getCashFlowStatements',
  'getFinancialMetrics',
  'searchStocksByFilters',
  'getNews',
] as const;

export type AllowedTools = typeof financialTools[number];

export interface FinancialToolsConfig {
  financialDatasetsApiKey: string;
  dataStream: any; // Type this based on your actual dataStream type
}

export class FinancialToolsManager {
  private toolCallCache = new Set<string>();
  private config: FinancialToolsConfig;

  constructor(config: FinancialToolsConfig) {
    this.config = config;
  }

  private shouldExecuteToolCall(toolName: string, params: any): boolean {
    const key = JSON.stringify({ toolName, params });
    if (this.toolCallCache.has(key)) {
      return false;
    }
    this.toolCallCache.add(key);
    return true;
  }

  public getTools() {
    return {
      getNews: {
        description: 'Use this tool to get news and latest events for a company.  This tool will return a list of news articles and events for a company.  When using this tool, include dates in your output.',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get news for'),
          limit: z.number().optional().default(5).describe('The number of news articles to return'),
        }),
        execute: async ({ ticker, limit }: { ticker: string; limit?: number }) => {
          const response = await fetch(`https://api.financialdatasets.ai/news/?ticker=${ticker}&limit=${limit}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const data = await response.json();
          return data;
        },
      },
      getStockPrices: {
        description: 'Use this tool to get stock prices and market cap for a company.  This tool will return a snapshot of the current price, market cap, and the historical prices over a given time period.',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get historical prices for'),
          start_date: z.string().optional().describe('The start date for historical prices (YYYY-MM-DD)').default(() => {
            const date = new Date();
            date.setMonth(date.getMonth() - 1);
            return date.toISOString().split('T')[0];
          }),
          end_date: z.string().optional().describe('The end date for historical prices (YYYY-MM-DD)').default(() => {
            return new Date().toISOString().split('T')[0];
          }),
          interval: z.enum(['second', 'minute', 'day', 'week', 'month', 'year']).default('day').describe('The interval between price points (e.g. second, minute, day, week, month, year)'),
          interval_multiplier: z.number().default(1).describe('The multiplier for the interval (e.g. 1 for second, 60 for minute, 1 for day, 7 for week, 1 for month, 1 for year)'),
        }),
        execute: async ({ ticker, start_date, end_date, interval, interval_multiplier }: {
          ticker: string;
          start_date?: string;
          end_date?: string;
          interval?: 'second' | 'minute' | 'day' | 'week' | 'month' | 'year';
          interval_multiplier?: number;
        }) => {
          if (!this.shouldExecuteToolCall('getStockPrices', { ticker, start_date, end_date, interval, interval_multiplier })) {
            console.log('Skipping duplicate getStockPrices call:', { ticker, start_date, end_date, interval, interval_multiplier });
            return null;
          }

          // First, get snapshot price
          const snapshotResponse = await fetch(`https://api.financialdatasets.ai/prices/snapshot?ticker=${ticker}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const snapshotData = await snapshotResponse.json();

          // Then, get historical prices
          const urlParams = new URLSearchParams({
            ticker: ticker,
            start_date: start_date || '',
            end_date: end_date || '',
            interval: interval || 'day',
            interval_multiplier: (interval_multiplier || 1).toString(),
          });
          
          const historicalPricesResponse = await fetch(`https://api.financialdatasets.ai/prices/?${urlParams}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const historicalPricesData = await historicalPricesResponse.json();

          // Combine snapshot price with historical prices
          const combinedData = {
            ticker: ticker,
            snapshot: snapshotData,
            historical: historicalPricesData
          };
          return combinedData;
        },
      },
      getIncomeStatements: {
        description: 'Get the income statements of a company',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get income statements for'),
          period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('The period of the income statements to return'),
          limit: z.number().min(4).optional().default(5).describe('The number of income statements to return'),
          report_period_lte: z.string().optional().describe('The less than or equal to date of the income statements to return.  This lets us bound the data by date.'),
          report_period_gte: z.string().optional().describe('The greater than or equal to date of the income statements to return.  This lets us bound the data by date.'),
        }),
        execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          if (!this.shouldExecuteToolCall('getIncomeStatements', { ticker, period, limit, report_period_lte, report_period_gte })) {
            console.log('Skipping duplicate getIncomeStatements call:', { ticker, period, limit, report_period_lte, report_period_gte });
            return null;
          }

          const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });

          if (limit) params.append('limit', limit.toString());
          if (report_period_lte) params.append('report_period_lte', report_period_lte);
          if (report_period_gte) params.append('report_period_gte', report_period_gte);

          const response = await fetch(`https://api.financialdatasets.ai/financials/income-statements/?${params}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const data = await response.json();
          return data;
        },
      },
      getBalanceSheets: {
        description: 'Get the balance sheets of a company',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get balance sheets for'),
          period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('The period of the balance sheets to return'),
          limit: z.number().min(4).optional().default(5).describe('The number of balance sheets to return'),
          report_period_lte: z.string().optional().describe('The less than or equal to date of the balance sheets to return.  This lets us bound the data by date.'),
          report_period_gte: z.string().optional().describe('The greater than or equal to date of the balance sheets to return.  This lets us bound the data by date.'),
        }),
        execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          if (!this.shouldExecuteToolCall('getBalanceSheets', { ticker, period, limit, report_period_lte, report_period_gte })) {
            console.log('Skipping duplicate getBalanceSheets call:', { ticker, period, limit, report_period_lte, report_period_gte });
            return null;
          }

          const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
          if (limit) params.append('limit', limit.toString());
          if (report_period_lte) params.append('report_period_lte', report_period_lte);
          if (report_period_gte) params.append('report_period_gte', report_period_gte);

          const response = await fetch(`https://api.financialdatasets.ai/financials/balance-sheets/?${params}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const data = await response.json();
          return data;
        },
      },
      getCashFlowStatements: {
        description: 'Get the cash flow statements of a company',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get cash flow statements for'),
          period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('The period of the cash flow statements to return'),
          limit: z.number().min(4).optional().default(5).describe('The number of cash flow statements to return'),
          report_period_lte: z.string().optional().describe('The less than or equal to date of the cash flow statements to return.  This lets us bound the data by date.'),
          report_period_gte: z.string().optional().describe('The greater than or equal to date of the cash flow statements to return.  This lets us bound the data by date.'),
        }),
        execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          if (!this.shouldExecuteToolCall('getCashFlowStatements', { ticker, period, limit, report_period_lte, report_period_gte })) {
            console.log('Skipping duplicate getCashFlowStatements call:', { ticker, period, limit, report_period_lte, report_period_gte });
            return null;
          }

          const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
          if (limit) params.append('limit', limit.toString());
          if (report_period_lte) params.append('report_period_lte', report_period_lte);
          if (report_period_gte) params.append('report_period_gte', report_period_gte);

          const response = await fetch(`https://api.financialdatasets.ai/financials/cash-flow-statements/?${params}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const data = await response.json();
          return data;
        },
      },
      getFinancialMetrics: {
        description: 'Get the financial metrics of a company.  These financial metrics are derived metrics like P/E ratio, operating income, etc. that cannot be found in the income statement, balance sheet, or cash flow statement.',
        parameters: z.object({
          ticker: z.string().describe('The ticker of the company to get financial metrics for'),
          period: z.enum(['quarterly', 'annual', 'ttm']).default('ttm').describe('The period of the financial metrics to return'),
          limit: z.number().min(4).optional().default(5).describe('The number of financial metrics to return'),
          report_period_lte: z.string().optional().describe('The less than or equal to date of the financial metrics to return.  This lets us bound the data by date.'),
          report_period_gte: z.string().optional().describe('The greater than or equal to date of the financial metrics to return.  This lets us bound the data by date.'),
        }),
        execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }: {
          ticker: string; 
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          if (!this.shouldExecuteToolCall('getFinancialMetrics', { ticker, period, limit, report_period_lte, report_period_gte })) {
            console.log('Skipping duplicate getFinancialMetrics call:', { ticker, period, limit, report_period_lte, report_period_gte });
            return null;
          }

          const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
          if (limit) params.append('limit', limit.toString());
          if (report_period_lte) params.append('report_period_lte', report_period_lte);
          if (report_period_gte) params.append('report_period_gte', report_period_gte);
          const response = await fetch(`https://api.financialdatasets.ai/financial-metrics/?${params}`, {
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey
            }
          });
          const data = await response.json();
          return data;
        },
      },
      searchStocksByFilters: {
        description: 'Search for stocks based on financial criteria. Use this tool when asked to find or screen stocks based on financial metrics like revenue, net income, debt, etc. Examples: "stocks with revenue > 50B", "companies with positive net income", "find stocks with low debt". The tool supports comparing metrics like revenue, net_income, total_debt, total_assets, etc. with values using greater than (gt), less than (lt), equal to (eq), and their inclusive variants (gte, lte).',
        parameters: z.object({
          filters: z.array(
            z.object({
              field: z.enum(validStockSearchFilters as [string, ...string[]]),
              operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
              value: z.number()
            })
          ).describe('The filters to search for (e.g. [{field: "net_income", operator: "gt", value: 1000000000}, {field: "revenue", operator: "gt", value: 50000000000}])'),
          period: z.enum(['quarterly', 'annual', 'ttm']).optional().describe('The period of the financial metrics to return'),
          limit: z.number().optional().default(5).describe('The number of stocks to return'),
          order_by: z.enum(['-report_period', 'report_period']).optional().default('-report_period').describe('The order of the stocks to return'),
        }),
        execute: async ({ filters, period, limit }: {
          filters: Array<{
            field: string;
            operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
            value: number;
          }>;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
        }) => {
          if (!this.shouldExecuteToolCall('searchStocksByFilters', { filters, period, limit })) {
            console.log('Skipping duplicate searchStocksByFilters call:', { filters, period, limit });
            return null;
          }

          this.config.dataStream.writeData({
            type: 'tool-loading',
            content: {
              tool: 'searchStocksByFilters',
              isLoading: true,
              message: 'Searching for stocks matching your criteria...'
            }
          });

          const body = {
            filters,
            period: period ?? 'ttm',
            limit: limit ?? 5,
          };

          const response = await fetch('https://api.financialdatasets.ai/financials/search/', {
            method: 'POST',
            headers: {
              'X-API-Key': this.config.financialDatasetsApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            throw new Error(`API error: ${response.status} ${errorText}`);
          }

          const data = await response.json();

          this.config.dataStream.writeData({
            type: 'tool-loading',
            content: {
              tool: 'searchStocksByFilters',
              isLoading: false,
              message: null,
            }
          });

          return data;
        },
      },
    };
  }
} 