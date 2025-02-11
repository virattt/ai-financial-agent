'use client';

import type { Attachment, ChatRequestOptions, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, track } from '@/lib/utils';
import { getFinancialDatasetsApiKey, getLocalOpenAIApiKey } from '@/lib/db/api-keys';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import { ApiKeysModal } from '@/components/api-keys-modal';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const financialDatasetsApiKey = getFinancialDatasetsApiKey();
  const openAIApiKey = getLocalOpenAIApiKey();
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { 
      id, 
      modelId: selectedModelId,
      modelApiKey: openAIApiKey,
      financialDatasetsApiKey,
    },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const handleFormSubmit = async (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    try {
      // Only check message count if we have a local API key
      const response = await fetch('/api/messages/count');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      // Check if user has reached their free message limit
      const maxFreeMessageCount = 0;
      const localApiKey = getLocalOpenAIApiKey();
      if (data.count >= maxFreeMessageCount && !localApiKey) {
        setShowApiKeysModal(true);
        return;
      }

      // Track the message submission
      track('chat_message_submit');

      handleSubmit(event, chatRequestOptions);
    } catch (error) {
      console.error('Error checking message count:', error);
    }
  };

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleFormSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleFormSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />

      <ApiKeysModal 
        open={showApiKeysModal} 
        onOpenChange={setShowApiKeysModal}
        title="Message Limit Reached"
        description="You have reached your free message limit. Please add your OpenAI API key to continue using the chat."
      />
    </>
  );
}
