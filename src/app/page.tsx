'use client'


import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg mb-4">Redirecting...</div>
        <Link href="/landing" className="text-blue-600 hover:underline">
          View Landing Page
        </Link>
      </div>
    </div>
  )
}
