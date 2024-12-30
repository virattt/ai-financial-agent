import { getLocalStorage, setLocalStorage } from "../utils";

export const getOpenAIApiKey = () => {
  const envApiKey = process.env.OPENAI_API_KEY;
  if (envApiKey) return envApiKey;
  
  const apiKey = getLocalStorage('openaiApiKey');
  return apiKey;
};

export const setOpenAIApiKey = (apiKey: string) => {
  setLocalStorage('openaiApiKey', apiKey);
};

export const getFinancialDatasetsApiKey = () => {
  const envApiKey = process.env.FINANCIAL_DATASETS_API_KEY;
  if (envApiKey) return envApiKey;
  
  const apiKey = getLocalStorage('financialDatasetsApiKey');
  return apiKey;
};

export const setFinancialDatasetsApiKey = (apiKey: string) => {
  setLocalStorage('financialDatasetsApiKey', apiKey);
};