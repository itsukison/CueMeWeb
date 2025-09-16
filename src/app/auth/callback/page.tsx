"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('認証処理中...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Starting auth callback handling');
        
        // Handle the OAuth callback from URL hash
        const { data, error } = await supabase.auth.getSession();
        
        console.log('[AuthCallback] Session data:', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email,
          error: error?.message
        });
        
        if (error) {
          throw error;
        }

        if (data.session) {
          const redirectTo = searchParams?.get('redirect_to');
          console.log('[AuthCallback] Redirect to:', redirectTo);
          
          if (redirectTo && redirectTo.startsWith('cueme://')) {
            // Handle deep link redirect to electron app
            const callbackUrl = `${redirectTo}#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&token_type=bearer`;
            
            console.log('[AuthCallback] Redirecting to deep link:', callbackUrl.substring(0, 50) + '...');
            
            setStatus('success');
            setMessage('認証が完了しました。アプリに戻っています...');
            
            // Redirect to deep link after a short delay
            setTimeout(() => {
              console.log('[AuthCallback] Executing deep link redirect');
              window.location.href = callbackUrl;
            }, 2000);
          } else {
            // Regular web redirect
            console.log('[AuthCallback] Regular web redirect to:', redirectTo || '/dashboard');
            router.push(redirectTo || '/dashboard');
          }
        } else {
          throw new Error('認証セッションを取得できませんでした');
        }
      } catch (error) {
        console.error('[AuthCallback] Auth callback error:', error);
        setStatus('error');
        setMessage('認証に失敗しました。再度お試しください。');
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    // Also try to handle OAuth callback from URL hash directly
    const handleOAuthCallback = async () => {
      try {
        // Check if we have OAuth tokens in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Found OAuth tokens in URL hash');
          
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            throw error;
          }
          
          console.log('[AuthCallback] Session set from OAuth tokens:', {
            hasSession: !!data.session,
            userEmail: data.session?.user?.email
          });
        }
      } catch (error) {
        console.error('[AuthCallback] Error handling OAuth callback:', error);
      }
    };

    // First try OAuth callback, then regular session check
    handleOAuthCallback().then(() => {
      handleAuthCallback();
    });
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
            </>
          )}

          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}