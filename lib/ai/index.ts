import { createOpenAI } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';
import { getOpenAIApiKey } from '../db/api-keys';

export const customModel = (apiIdentifier: string) => {
  const provider = createOpenAI({ apiKey: getOpenAIApiKey(), compatibility: 'strict' });
  return wrapLanguageModel({
    model: provider.chat(apiIdentifier),
    middleware: customMiddleware,
  });
};
