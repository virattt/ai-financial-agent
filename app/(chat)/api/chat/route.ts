import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  generateObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  systemPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { AISDKExporter } from 'langsmith/vercel';
import { validStockSearchFilters } from '@/lib/api/stock-filters';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const financialTools = [
  'getStockPrices',
  'getIncomeStatements',
  'getBalanceSheets',
  'getCashFlowStatements',
  'getFinancialMetrics',
  'searchStocksByFilters',
  'getNews',
] as const;

type AllowedTools = typeof financialTools[number];

const allTools: AllowedTools[] = [...financialTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
    financialDatasetsApiKey,
    modelApiKey,
  }: {
    id: string;
    messages: Array<Message>;
    modelId: string;
    financialDatasetsApiKey?: string;
    modelApiKey?: string;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  if (!modelApiKey) {
    return new Response('Model API key is required', { status: 400 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage, modelApiKey });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  // Create a Set to track tool calls
  const toolCallCache = new Set<string>();

  // Helper function to check and track tool calls
  const shouldExecuteToolCall = (toolName: string, params: any): boolean => {
    const key = JSON.stringify({ toolName, params });
    if (toolCallCache.has(key)) {
      return false;
    }
    toolCallCache.add(key);
    return true;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      dataStream.writeData({
        type: 'query-loading',
        content: {
          isLoading: true,
          taskNames: []
        }
      });

      const { object } = await generateObject({
        model: customModel('gpt-4.1-nano-2025-04-14', modelApiKey),
        output: 'array',
        schema: z.object({
          task_name: z.string(),
          class: z
            .string()
            .describe('The name of the sub-task'),
        }),
        prompt: `You are a reasoning agent.  
        Given the following user query: ${userMessage.content}, 
        break it down to small, tightly-scoped sub-tasks 
        that need to be taken to answer the query.  
        
        Your task breakdown should:
        - Be comprehensive and cover all aspects needed to fully answer the query
        - Follow a logical research sequence from basic information to deeper analysis
        - Include 2-4 tasks maximum - fewer is better as long as they cover the complete question
        - Prioritize the most essential research steps and consolidate similar actions
        - Start with gathering fundamental data before moving to analysis and comparison
        - Make thought processes transparent to users who will see these tasks
        - Show a clear progression of reasoning that builds toward the answer
        
        Format requirements:
        - Include the ticker or company name where appropriate
        - Use present progressive tense (e.g., "Analyzing", "Retrieving", "Comparing")
        - Keep task names short (3-7 words) but specific and informative
        - Make tasks distinct with no overlap or redundancy
        - Begin with data collection tasks, then move to analysis tasks
        
        Your output will guide another LLM in executing these tasks, and users will see these steps as the system works.
        Ensure tasks are optimally structured for the available financial tools and clearly communicate the research approach.
        Focus on minimizing the number of steps while maintaining comprehensiveness.
        
        Examples of good task sequences:
        - "Retrieving AAPL financials", "Analyzing AAPL performance trends" 
        - "Finding top tech stocks", "Evaluating financial health"`,
      });

      // Stream the tasks in the query loading state
      dataStream.writeData({
        type: 'query-loading',
        content: {
          isLoading: true,
          taskNames: object.map(task => task.task_name)
        }
      });

      let receivedFirstChunk = false;

      // Create a transient version of coreMessages with task names
      const coreMessagesWithTaskNames = [...coreMessages];
      // Replace the last user message content with task names
      const lastMessage = coreMessagesWithTaskNames[coreMessagesWithTaskNames.length - 1];
      if (coreMessagesWithTaskNames.length > 0 && lastMessage?.role === 'user') {
        const taskList = object.map(task => task.task_name).join('\n');
        coreMessagesWithTaskNames[coreMessagesWithTaskNames.length - 1] = {
          role: 'user',
          content: taskList
        };
      }

      const result = streamText({
        model: customModel(model.apiIdentifier, modelApiKey),
        system: systemPrompt,
        messages: coreMessagesWithTaskNames,
        maxSteps: 10,
        experimental_activeTools: allTools,
        experimental_telemetry: AISDKExporter.getSettings(),
        onChunk: (event) => {
          const isToolCall = event.chunk.type === 'tool-call';
          if (!receivedFirstChunk && !isToolCall) {
            receivedFirstChunk = true;
            // Set query-loading to false on first token
            dataStream.writeData({
              type: 'query-loading',
              content: {
                isLoading: false,
                taskNames: []
              }
            });
          }
        },
        onFinish: async ({ response }) => {
          // CAUTION: this is a hack to prevent stream from being cut off :(
          // TODO: find a better solution
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // save the response
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls = sanitizeResponseMessages(response.messages);

              if (responseMessagesWithoutIncompleteToolCalls.length > 0) {
                await saveMessages({
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      if (message.role === 'assistant') {
                        dataStream.writeMessageAnnotation({
                          messageIdFromServer: messageId,
                        });
                      }

                      return {
                        id: messageId,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      };
                    },
                  ),
                });
              } else {
                console.log('No valid messages to save');
              }
            } catch (error) {
              console.error('Failed to save chat:', error);
            }
          }
        },
        tools: {
          getNews: {
            description: 'Use this tool to get news and latest events for a company.  This tool will return a list of news articles and events for a company.',
            parameters: z.object({
              ticker: z.string().describe('The ticker of the company to get news for'),
            }),
            execute: async ({ ticker }) => {
              const response = await fetch(`https://api.financialdatasets.ai/news/?ticker=${ticker}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
            execute: async ({ ticker, start_date, end_date, interval, interval_multiplier }) => {
              if (!shouldExecuteToolCall('getStockPrices', { ticker, start_date, end_date, interval, interval_multiplier })) {
                console.log('Skipping duplicate getStockPrices call:', { ticker, start_date, end_date, interval, interval_multiplier });
                return null;
              }

              // First, get snapshot price
              const snapshotResponse = await fetch(`https://api.financialdatasets.ai/prices/snapshot?ticker=${ticker}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
                }
              });
              const snapshotData = await snapshotResponse.json();

              // Then, get historical prices
              const urlParams = new URLSearchParams({
                ticker: ticker,
                start_date: start_date,
                end_date: end_date,
                interval: interval,
                interval_multiplier: interval_multiplier.toString(),
              });
              
              const historicalPricesResponse = await fetch(`https://api.financialdatasets.ai/prices/?${urlParams}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
              limit: z.number().optional().default(1).describe('The number of income statements to return'),
              report_period_lte: z.string().optional().describe('The less than or equal to date of the income statements to return.  This lets us bound the data by date.'),
              report_period_gte: z.string().optional().describe('The greater than or equal to date of the income statements to return.  This lets us bound the data by date.'),
            }),
            execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }) => {
              if (!shouldExecuteToolCall('getIncomeStatements', { ticker, period, limit, report_period_lte, report_period_gte })) {
                console.log('Skipping duplicate getIncomeStatements call:', { ticker, period, limit, report_period_lte, report_period_gte });
                return null;
              }

              const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });

              if (limit) params.append('limit', limit.toString());
              if (report_period_lte) params.append('report_period_lte', report_period_lte);
              if (report_period_gte) params.append('report_period_gte', report_period_gte);

              const response = await fetch(`https://api.financialdatasets.ai/financials/income-statements/?${params}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
              limit: z.number().optional().default(1).describe('The number of balance sheets to return'),
              report_period_lte: z.string().optional().describe('The less than or equal to date of the balance sheets to return.  This lets us bound the data by date.'),
              report_period_gte: z.string().optional().describe('The greater than or equal to date of the balance sheets to return.  This lets us bound the data by date.'),
            }),
            execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }) => {
              if (!shouldExecuteToolCall('getBalanceSheets', { ticker, period, limit, report_period_lte, report_period_gte })) {
                console.log('Skipping duplicate getBalanceSheets call:', { ticker, period, limit, report_period_lte, report_period_gte });
                return null;
              }

              const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
              if (limit) params.append('limit', limit.toString());
              if (report_period_lte) params.append('report_period_lte', report_period_lte);
              if (report_period_gte) params.append('report_period_gte', report_period_gte);

              const response = await fetch(`https://api.financialdatasets.ai/financials/balance-sheets/?${params}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
              limit: z.number().optional().default(1).describe('The number of cash flow statements to return'),
              report_period_lte: z.string().optional().describe('The less than or equal to date of the cash flow statements to return.  This lets us bound the data by date.'),
              report_period_gte: z.string().optional().describe('The greater than or equal to date of the cash flow statements to return.  This lets us bound the data by date.'),
            }),
            execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }) => {
              if (!shouldExecuteToolCall('getCashFlowStatements', { ticker, period, limit, report_period_lte, report_period_gte })) {
                console.log('Skipping duplicate getCashFlowStatements call:', { ticker, period, limit, report_period_lte, report_period_gte });
                return null;
              }

              const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
              if (limit) params.append('limit', limit.toString());
              if (report_period_lte) params.append('report_period_lte', report_period_lte);
              if (report_period_gte) params.append('report_period_gte', report_period_gte);

              const response = await fetch(`https://api.financialdatasets.ai/financials/cash-flow-statements/?${params}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
              limit: z.number().optional().default(1).describe('The number of financial metrics to return'),
              report_period_lte: z.string().optional().describe('The less than or equal to date of the financial metrics to return.  This lets us bound the data by date.'),
              report_period_gte: z.string().optional().describe('The greater than or equal to date of the financial metrics to return.  This lets us bound the data by date.'),
            }),
            execute: async ({ ticker, period, limit, report_period_lte, report_period_gte }) => {
              if (!shouldExecuteToolCall('getFinancialMetrics', { ticker, period, limit, report_period_lte, report_period_gte })) {
                console.log('Skipping duplicate getFinancialMetrics call:', { ticker, period, limit, report_period_lte, report_period_gte });
                return null;
              }

              const params = new URLSearchParams({ ticker, period: period ?? 'ttm' });
              if (limit) params.append('limit', limit.toString());
              if (report_period_lte) params.append('report_period_lte', report_period_lte);
              if (report_period_gte) params.append('report_period_gte', report_period_gte);
              const response = await fetch(`https://api.financialdatasets.ai/financial-metrics/?${params}`, {
                headers: {
                  'X-API-Key': `${financialDatasetsApiKey}`
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
            execute: async ({ filters, period, limit }) => {
              if (!shouldExecuteToolCall('searchStocksByFilters', { filters, period, limit })) {
                console.log('Skipping duplicate searchStocksByFilters call:', { filters, period, limit });
                return null;
              }

              dataStream.writeData({
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
                  'X-API-Key': `${financialDatasetsApiKey}`,
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

              dataStream.writeData({
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
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
