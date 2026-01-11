/**
 * 球員登入頁面 - 佔位符
 */

import { useParams } from 'react-router-dom';

export default function PlayerLoginPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold">球員登入</h2>
                <p className="text-muted-foreground mt-2">
                    球隊: {teamSlug} / 球員ID: {playerId}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                    功能開發中...
                </p>
            </div>
        </div>
    );
}
