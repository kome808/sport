import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FatigueGuard } from '@/components/fatigue/FatigueGuard';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { TrendChart } from '@/components/fatigue/TrendChart';

export default function PlayerPortalPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const [date] = useState<string>(new Date().toISOString().split('T')[0]);

    if (!playerId) return <div>Invalid Player ID</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">疲勞監測中心</h1>
                        <p className="text-xs text-slate-500">
                            {teamSlug}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        {format(new Date(date), 'MM月dd日', { locale: zhTW })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 py-6 space-y-6">

                <FatigueGuard playerId={playerId} date={date} />

                <TrendChart playerId={playerId} />
            </div>
        </div>
    );
}
