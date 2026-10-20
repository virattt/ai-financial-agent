import { FinancialToolsManager, type FinancialToolsConfig } from './financial-tools';
import { createWebResearchTools } from './web-research';

export function createChatTools(config: FinancialToolsConfig & {
  chatId: string;
  abortSignal?: AbortSignal;
}) {
  const financialTools = new FinancialToolsManager(config).getTools();
  if (process.env.WEB_SEARCH_ENABLED === 'false') return financialTools;

  return {
    ...financialTools,
    ...createWebResearchTools(config),
  };
}
