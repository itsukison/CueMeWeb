'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LandingPage from '@/components/landing-page'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      }
    }

    checkAuth()
  }, [router])

  return <LandingPage />
}
