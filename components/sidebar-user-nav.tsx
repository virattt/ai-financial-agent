'use client';
import { ChevronUp } from 'lucide-react';
import type { User } from 'next-auth';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ApiKeysModal } from '@/components/api-keys-modal';

export function SidebarUserNav({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-sidebar data-[state=open]:text-sidebar-accent-foreground h-10 hover:bg-background">
                {/* <Image
                  src={`https://avatar.vercel.sh/${user.email}`}
                  alt={user.email ?? 'User Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                /> */}
                {/* <span className="truncate">{user?.email}</span> */}
                <span className="truncate">Settings</span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="w-full cursor-pointer"
                  onClick={() => setIsApiKeysModalOpen(true)}
                >
                  Configure API keys
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <ApiKeysModal 
        open={isApiKeysModalOpen} 
        onOpenChange={setIsApiKeysModalOpen}
      />
    </>
  );
}
