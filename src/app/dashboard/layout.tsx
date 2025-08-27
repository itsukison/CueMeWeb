'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User as UserIcon, LogOut, Settings } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      if (!user) {
        router.push('/login')
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7EE' }}>
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7EE' }}>
      {/* Header with Landing Page Style */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: '#013220' }}>
                CueMe
              </h1>
              <span className="ml-3 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Dashboard
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 bg-white/50 backdrop-blur-md rounded-full px-4 py-2 border border-gray-200/50 hover:bg-white/70 transition-all">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0f9f0', color: '#013220' }}>
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur-md">
                  <DropdownMenuItem className="rounded-xl">
                    <Settings className="w-4 h-4 mr-2" />
                    設定
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl text-red-600" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-12">
        {children}
      </main>
    </div>
  )
}