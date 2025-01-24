import { Suggestion } from '@/lib/db/schema';

export type ToolLoadingContent = {
  tool: string;
  isLoading: boolean;
  message?: string;
};

export type QueryLoadingContent = {
  isLoading: boolean;
  taskNames: string[];
  message?: string;
};

export type DataStreamDeltaType =
  | 'text-delta'
  | 'code-delta'
  | 'title'
  | 'id'
  | 'suggestion'
  | 'clear'
  | 'finish'
  | 'user-message-id'
  | 'kind'
  | 'tool-loading'
  | 'query-loading';

export type DataStreamDelta = {
  type: DataStreamDeltaType;
  content: string | Suggestion | ToolLoadingContent | QueryLoadingContent;
}; 