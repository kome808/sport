/**
 * OAuth 回調頁面
 * 處理 Google OAuth 登入後的 redirect
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // 等待 Supabase 處理 OAuth callback (URL hash 中的 token)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (!session?.user) {
                    throw new Error('無法取得登入資訊');
                }

                // 確保 sport.coaches 資料存在
                const email = session.user.email;
                const name = session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    email?.split('@')[0] || '教練';

                await supabase
                    .schema(SCHEMA_NAME)
                    .from('coaches')
                    .upsert({ email, name }, { onConflict: 'email' });

                // 查詢教練所屬的球隊
                const { data: teams } = await supabase
                    .schema(SCHEMA_NAME)
                    .from('teams')
                    .select('slug')
                    .limit(1);

                if (teams && teams.length > 0) {
                    navigate(`/${teams[0].slug}`, { replace: true });
                } else {
                    navigate('/team/setup', { replace: true });
                }

            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || '登入處理失敗');
            }
        };

        handleCallback();
    }, [navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-destructive">{error}</p>
                <button
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline"
                >
                    返回登入頁
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">正在完成登入...</p>
        </div>
    );
}
