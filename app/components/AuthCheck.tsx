'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { login } from '@/app/(auth)/actions'

export function AuthCheck() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) {
      login({status: 'idle'}, new FormData())
    }
  }, [session])

  return null
} 