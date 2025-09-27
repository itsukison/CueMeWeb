"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function ElectronCallbackForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleElectronAuthCallback = async () => {
      try {
        console.log('[ElectronCallback] =============================')
        console.log('[ElectronCallback] Starting Electron auth callback handling')
        console.log('[ElectronCallback] Current URL:', window.location.href)
        console.log('[ElectronCallback] URL hash:', window.location.hash)
        console.log('[ElectronCallback] URL search:', window.location.search)
        console.log('[ElectronCallback] =============================')
        
        // Handle the OAuth callback from URL hash
        const { data, error } = await supabase.auth.getSession()
        
        console.log('[ElectronCallback] Session data:')
        console.log('[ElectronCallback] - hasSession:', !!data.session)
        console.log('[ElectronCallback] - hasUser:', !!data.session?.user)
        console.log('[ElectronCallback] - userEmail:', data.session?.user?.email)
        console.log('[ElectronCallback] - userId:', data.session?.user?.id)
        console.log('[ElectronCallback] - expiresAt:', data.session?.expires_at)
        console.log('[ElectronCallback] - error:', error?.message)
        
        if (error) {
          console.error('[ElectronCallback] Session error details:', {
            message: error.message,
            status: (error as any).status,
            statusCode: (error as any).statusCode
          })
          throw error
        }

        if (data.session) {
          // Always redirect to cueme:// protocol for Electron app
          const callbackUrl = `cueme://auth-callback#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&token_type=bearer`
          
          console.log('[ElectronCallback] ✅ Creating Electron deep link callback URL...')
          console.log('[ElectronCallback] - Access token (first 20 chars):', data.session.access_token.substring(0, 20) + '...')
          console.log('[ElectronCallback] - Refresh token (first 20 chars):', data.session.refresh_token.substring(0, 20) + '...')
          console.log('[ElectronCallback] - Full callback URL length:', callbackUrl.length)
          
          setStatus('success')
          setMessage('認証が完了しました。アプリに戻っています...')
          
          // Redirect to deep link after a short delay
          setTimeout(() => {
            console.log('[ElectronCallback] ✅ Executing Electron deep link redirect...')
            console.log('[ElectronCallback] Redirect URL:', callbackUrl.substring(0, 100) + '...')
            
            try {
              window.location.href = callbackUrl
              console.log('[ElectronCallback] window.location.href set successfully')
            } catch (redirectError) {
              console.error('[ElectronCallback] ❌ Error during redirect:', redirectError)
              setStatus('error')
              setMessage('アプリへの戻り処理でエラーが発生しました。')
            }
          }, 2000)
        } else {
          console.error('[ElectronCallback] ❌ No session found after auth')
          throw new Error('認証セッションを取得できませんでした')
        }
      } catch (error) {
        console.error('[ElectronCallback] ❌ Electron auth callback error:', error)
        console.error('[ElectronCallback] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        setStatus('error')
        setMessage('認証に失敗しました。再度お試しください。')
        
        // Redirect to login after error
        setTimeout(() => {
          console.log('[ElectronCallback] Redirecting to login after error...')
          router.push('/login')
        }, 3000)
      }
    }

    // Also try to handle OAuth callback from URL hash directly
    const handleOAuthCallback = async () => {
      try {
        console.log('[ElectronCallback] Checking for OAuth tokens in URL hash...')
        
        // Check if we have OAuth tokens in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('token_type')
        
        console.log('[ElectronCallback] Hash parameters:')
        console.log('[ElectronCallback] - access_token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null')
        console.log('[ElectronCallback] - refresh_token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null')
        console.log('[ElectronCallback] - token_type:', tokenType)
        
        if (accessToken && refreshToken) {
          console.log('[ElectronCallback] ✅ Found OAuth tokens in URL hash, setting session...')
          
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('[ElectronCallback] ❌ Error setting session from hash tokens:', error)
            throw error
          }
          
          console.log('[ElectronCallback] ✅ Session set from OAuth tokens:')
          console.log('[ElectronCallback] - hasSession:', !!data.session)
          console.log('[ElectronCallback] - userEmail:', data.session?.user?.email)
          console.log('[ElectronCallback] - userId:', data.session?.user?.id)
        } else {
          console.log('[ElectronCallback] No OAuth tokens found in URL hash')
        }
      } catch (error) {
        console.error('[ElectronCallback] ❌ Error handling OAuth callback:', error)
      }
    }

    // First try OAuth callback, then regular session check
    console.log('[ElectronCallback] Starting OAuth callback handling...')
    handleOAuthCallback().then(() => {
      console.log('[ElectronCallback] OAuth callback completed, starting Electron auth callback...')
      handleElectronAuthCallback()
    })
  }, [searchParams, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F7F7EE" }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div
          className="flex items-center justify-center text-2xl font-bold mb-8"
          style={{ color: "#013220" }}
        >
          <img
            src="/logo.png"
            alt="CueMe Logo"
            className="w-12 h-12 mr-3"
            style={{ verticalAlign: "middle" }}
          />
          <span className="logo-text">CueMe</span>
        </div>

        <div
          className="bg-white/70 backdrop-blur-md border-0 shadow-xl rounded-2xl p-8"
        >
          {status === 'loading' && (
            <>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{
                    border: "3px solid #e0e0e0",
                    borderTop: "3px solid #013220",
                  }}
                ></div>
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "#013220" }}
              >
                認証処理中
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#013220" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "#013220" }}
              >
                認証完了
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "#dc2626" }}
              >
                認証エラー
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ElectronCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    }>
      <ElectronCallbackForm />
    </Suspense>
  );
}