/**
 * 球員詳情頁面 - 佔位符
 */

import { useParams } from 'react-router-dom';

export default function PlayerDetailPage() {
    const { playerId } = useParams<{ playerId: string }>();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">球員詳情</h2>
            <p className="text-muted-foreground">
                球員 ID: {playerId} - 功能開發中...
            </p>
        </div>
    );
}
