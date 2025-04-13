'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo, useState } from 'react';
import { getLocalOpenAIApiKey } from '@/lib/db/api-keys';
import { ApiKeysModal } from './api-keys-modal';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  
  const suggestedActions = [
    {
      title: 'What is the current price',
      label: 'of Apple?',
      mobileTitle: 'Current price',
      mobileLabel: 'of AAPL today',
      action: 'What is the current price of Apple?',
    },
    {
      title: 'What is the latest news',
      label: 'for Microsoft?',
      mobileTitle: 'Latest news',
      mobileLabel: 'for MSFT',
      action: 'What is the latest news for Microsoft in the last 5 days?',
    },
    {
      title: 'How has Nvidia\'s price',
      label: 'changed year to date?',
      mobileTitle: 'Price history',
      mobileLabel: 'of NVDA year to date',
      action: 'How has Nvidia\'s price changed year to date?',
    },
    {
      title: 'Show me 5 stocks with',
      label: 'revenue > 100B and net income > 10B',
      mobileTitle: 'Find stocks',
      mobileLabel: 'revenue >100B, net income >10B',
      action: 'Show me 5 stocks with revenue > 100B and net income > 10B',
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 w-full">
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
            key={`suggested-action-${suggestedAction.title}-${index}`}
            className="block"
          >
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                try {
                  //  Check for API key
                  const localApiKey = getLocalOpenAIApiKey();
                  if (!localApiKey) {
                    setShowApiKeysModal(true);
                    return;
                  }
                  
                  window.history.replaceState({}, '', `/chat/${chatId}`);
                  append({
                    role: 'user',
                    content: suggestedAction.action,
                  });
                } catch (error) {
                  console.error('Error checking message count:', error);
                }
              }}
              className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full max-w-[calc(100vw-2rem)] h-auto justify-start items-start break-words"
            >
              <span className="font-medium break-words">
                <span className="hidden sm:inline">{suggestedAction.title}</span>
                <span className="sm:hidden">{suggestedAction.mobileTitle}</span>
              </span>
              <span className="text-muted-foreground break-words">
                <span className="hidden sm:inline">{suggestedAction.label}</span>
                <span className="sm:hidden">{suggestedAction.mobileLabel}</span>
              </span>
            </Button>
          </motion.div>
        ))}
      </div>

      <ApiKeysModal 
        open={showApiKeysModal} 
        onOpenChange={setShowApiKeysModal}
        title="Message Limit Reached"
        description="You have reached your free message limit. Please add your OpenAI API key to continue using the chat."
      />
    </>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
