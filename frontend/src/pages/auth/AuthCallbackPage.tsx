/**
 * OAuth 回調頁面
 * 處理 Google OAuth 登入後的 redirect
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const handleCallback = async () => {
            try {
                // 處理 PKCE 驗證碼交換
                const url = new URL(window.location.href);
                const code = url.searchParams.get('code');

                if (code) {
                    // 交換 session，並不論結果如何都嘗試導向（client 背景也會處理）
                    await supabase.auth.exchangeCodeForSession(code).catch(() => { });

                    // 清理網址參數
                    url.searchParams.delete('code');
                    url.searchParams.delete('error');
                    url.searchParams.delete('error_description');
                    window.history.replaceState({}, document.title, url.toString());
                }

                if (isMounted) {
                    const redirectTo = localStorage.getItem('login_redirect_to');
                    if (redirectTo) {
                        localStorage.removeItem('login_redirect_to');
                        navigate(redirectTo, { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                }
            } catch (err) {
                console.error('Auth callback redirect error:', err);
                if (isMounted) {
                    navigate('/dashboard', { replace: true });
                }
            }
        };

        handleCallback();
        return () => { isMounted = false; };
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-slate-500 font-medium">正在進入系統...</p>
        </div>
    );
}
