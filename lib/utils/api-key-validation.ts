import { OpenAI } from "openai";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
  /**
   * We can check if an OpenAI API key is valid by making a request to 
   * OpenAI's Models API. If the key is valid, we will receive a list of models.
   * If the key is invalid, we will receive an error.
   */
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const list = await openai.models.list();

    if (list.data.length > 0) {
      return { isValid: true };
    }
    return { 
      isValid: false, 
      error: 'Invalid OpenAI API key' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid OpenAI API key. Please check your key and try again.' 
    };
  }
}
