import { createOpenAI } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string, openAIApiKey: string) => {
  const provider = createOpenAI({ apiKey: openAIApiKey, compatibility: 'strict' });
  return wrapLanguageModel({
    model: provider.chat(apiIdentifier),
    middleware: customMiddleware,
  });
};
