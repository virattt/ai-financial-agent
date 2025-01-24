'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { BlockKind } from './block';
import { initialBlockData, useBlock } from '@/hooks/use-block';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { useToolLoading } from '@/hooks/use-tool-loading';
import { useQueryLoading } from '@/hooks/use-query-loading';
import { DataStreamDelta, ToolLoadingContent, QueryLoadingContent } from '@/lib/types/data-stream';

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setBlock } = useBlock();
  const { setToolLoading } = useToolLoading();
  const { setQueryLoading } = useQueryLoading();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      if (delta.type === 'tool-loading') {
        const { tool, isLoading, message } = delta.content as ToolLoadingContent;
        setToolLoading(tool as any, isLoading, message);
        return;
      }

      if (delta.type === 'query-loading') {
        const { isLoading, taskNames, message } = delta.content as QueryLoadingContent;
        setQueryLoading(isLoading, taskNames);
        return;
      }

      setBlock((draftBlock) => {
        if (!draftBlock) {
          return { ...initialBlockData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftBlock,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftBlock,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftBlock,
              kind: delta.content as BlockKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftBlock,
              content: draftBlock.content + (delta.content as string),
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 400 &&
                draftBlock.content.length < 450
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 300 &&
                draftBlock.content.length < 310
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftBlock,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftBlock,
              status: 'idle',
            };

          default:
            return draftBlock;
        }
      });
    });
  }, [dataStream, setBlock, setUserMessageIdFromServer, setToolLoading, setQueryLoading]);

  return null;
}
