"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');
  const [callbackUrl, setCallbackUrl] = useState<string>('');
  const [isElectronCallback, setIsElectronCallback] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Immediately check if this is an Electron callback to show the button state
    const redirectTo = searchParams?.get('redirect_to')
    if (redirectTo && (redirectTo.includes('electron-callback') || redirectTo.startsWith('cueme://'))) {
      console.log('[AuthCallback] Detected Electron callback, setting state...')
      setIsElectronCallback(true)
    }

    const handleOAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Checking for OAuth tokens in URL hash...')
        console.log('[AuthCallback] Full URL:', window.location.href)
        console.log('[AuthCallback] Hash fragment:', window.location.hash)
        
        // Check if we have OAuth tokens in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('token_type')
        const expiresIn = hashParams.get('expires_in')
        
        console.log('[AuthCallback] Hash parameters:')
        console.log('[AuthCallback] - access_token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null')
        console.log('[AuthCallback] - refresh_token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null')
        console.log('[AuthCallback] - token_type:', tokenType)
        console.log('[AuthCallback] - expires_in:', expiresIn)
        
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] ✅ Found OAuth tokens in URL hash, setting session...')
          
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('[AuthCallback] ❌ Error setting session from hash tokens:', error)
            throw error
          }
          
          console.log('[AuthCallback] ✅ Session set from OAuth tokens:')
          console.log('[AuthCallback] - hasSession:', !!data.session)
          console.log('[AuthCallback] - userEmail:', data.session?.user?.email)
          console.log('[AuthCallback] - userId:', data.session?.user?.id)
          
          return true // Indicate that OAuth tokens were processed
        } else {
          console.log('[AuthCallback] No OAuth tokens found in URL hash')
          if (window.location.hash) {
            console.log('[AuthCallback] Hash exists but no tokens - possible OAuth error or different flow')
            const errorParam = hashParams.get('error')
            const errorDescription = hashParams.get('error_description')
            if (errorParam) {
              console.error('[AuthCallback] OAuth error:', errorParam, errorDescription)
              throw new Error(`OAuth error: ${errorParam} - ${errorDescription}`)
            }
          }
          return false // No OAuth tokens to process
        }
      } catch (error) {
        console.error('[AuthCallback] ❌ Error handling OAuth callback:', error)
        throw error // Re-throw to be handled by main callback
      }
    }

    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] =============================')
        console.log('[AuthCallback] Starting auth callback handling')
        console.log('[AuthCallback] Current URL:', window.location.href)
        console.log('[AuthCallback] URL hash:', window.location.hash)
        console.log('[AuthCallback] URL search:', window.location.search)
        console.log('[AuthCallback] =============================')
        
        // First, try to handle OAuth callback from URL hash if present
        const oauthProcessed = await handleOAuthCallback()
        
        // Then get the current session (either existing or just set from OAuth)
        const { data, error } = await supabase.auth.getSession()
        
        console.log('[AuthCallback] Session data:')
        console.log('[AuthCallback] - hasSession:', !!data.session)
        console.log('[AuthCallback] - hasUser:', !!data.session?.user)
        console.log('[AuthCallback] - userEmail:', data.session?.user?.email)
        console.log('[AuthCallback] - userId:', data.session?.user?.id)
        console.log('[AuthCallback] - expiresAt:', data.session?.expires_at)
        console.log('[AuthCallback] - error:', error?.message)
        
        if (error) {
          console.error('[AuthCallback] Session error details:', {
            message: error.message,
            status: (error as any).status,
            statusCode: (error as any).statusCode
          })
          throw error
        }

        if (data.session) {
          const redirectTo = searchParams?.get('redirect_to')
          console.log('[AuthCallback] Redirect to parameter:', redirectTo)
          
          if (redirectTo && (redirectTo.includes('electron-callback') || redirectTo.startsWith('cueme://'))) {
            // Handle Electron app callback via cueme:// deep link with user interaction
            const electronCallbackUrl = redirectTo.startsWith('cueme://') 
              ? `${redirectTo}#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&token_type=bearer`
              : `cueme://auth-callback#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&token_type=bearer`
            
            console.log('[AuthCallback] ✅ Creating Electron deep link callback URL...')
            console.log('[AuthCallback] - Access token (first 20 chars):', data.session.access_token.substring(0, 20) + '...')
            console.log('[AuthCallback] - Refresh token (first 20 chars):', data.session.refresh_token.substring(0, 20) + '...')
            console.log('[AuthCallback] - Full callback URL length:', electronCallbackUrl.length)
            
            // Set the state for Electron callback
            setIsElectronCallback(true)
            setCallbackUrl(electronCallbackUrl)
            setStatus('success')
            setMessage('認証が完了しました。下のボタンをクリックしてCueMeアプリに戻ってください。')
            
            console.log('[AuthCallback] ✅ Electron callback state set, button should appear')
          } else {
            // Regular web redirect to dashboard
            console.log('[AuthCallback] Regular web redirect to:', redirectTo || '/dashboard')
            
            // Show success message briefly before redirecting to dashboard
            setStatus('success')
            setMessage('ログインが完了しました。ダッシュボードに移動しています...')
            
            setTimeout(() => {
              router.push(redirectTo || '/dashboard')
            }, 1500)
          }
        } else {
          console.error('[AuthCallback] ❌ No session found after auth')
          throw new Error('認証セッションを取得できませんでした')
        }
      } catch (error) {
        console.error('[AuthCallback] ❌ Auth callback error:', error)
        console.error('[AuthCallback] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        setStatus('error')
        setMessage('認証に失敗しました。再度お試しください。')
        
        // Redirect to login after error
        setTimeout(() => {
          console.log('[AuthCallback] Redirecting to login after error...')
          router.push('/login')
        }, 3000)
      }
    }

    // Start the authentication callback handling
    console.log('[AuthCallback] Starting auth callback process...')
    handleAuthCallback()
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
                  className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#013220" }}
                />
              </div>
              <h2 className="text-xl font-bold text-black mb-4">認証処理中</h2>
              <p className="text-gray-600 text-sm">{message}</p>
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
              <h2 className="text-xl font-bold text-black mb-4">認証成功</h2>
              <p className="text-gray-600 text-sm mb-4">{message}</p>
              
              {/* Manual protocol launch button for Electron callback */}
              {isElectronCallback && callbackUrl && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      try {
                        console.log('[AuthCallback] Manual protocol launch triggered')
                        console.log('[AuthCallback] Launching:', callbackUrl.substring(0, 100) + '...')
                        window.location.href = callbackUrl
                      } catch (error) {
                        console.error('[AuthCallback] Manual protocol launch failed:', error)
                        alert('アプリを開けませんでした。\n\n確認事項:\n1. CueMeアプリが起動していること\n2. ブラウザがカスタムプロトコルを許可していること\n\nエラー: ' + (error instanceof Error ? error.message : 'Unknown error'))
                      }
                    }}
                    className="w-full px-6 py-4 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: "#013220", boxShadow: "0 4px 15px rgba(1, 50, 32, 0.3)" }}
                  >
                    🚀 CueMeアプリを開く
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    ボタンをクリックしてCueMeアプリに移動してください
                  </p>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    デバッグ: {isElectronCallback ? 'Electron検出済み' : 'Web検出'} | URL長: {callbackUrl.length}
                  </p>
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#fef2f2" }}
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
              <h2 className="text-xl font-bold text-black mb-4">認証エラー</h2>
              <p className="text-gray-600 text-sm">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F7F7EE" }}
      >
        <div className="w-full max-w-md text-center">
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
          <div className="bg-white/70 backdrop-blur-md border-0 shadow-xl rounded-2xl p-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
              style={{ backgroundColor: "#f0f9f0" }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#013220" }}
              />
            </div>
            <h2 className="text-xl font-bold text-black mb-4">認証処理中</h2>
            <p className="text-gray-600 text-sm">認証処理中...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackForm />
    </Suspense>
  );
}