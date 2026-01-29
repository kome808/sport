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

                <MissingDataAlert playerId={playerId} todayDate={date} />

                <TrendChart playerId={playerId} />
            </div>
        </div>
    );
}
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function MissingDataAlert({ playerId, todayDate }: { playerId: string; todayDate: string }) {
    // 查詢過去 7 天紀錄來檢查連續未填寫
    const endDate = new Date(todayDate);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const { data: records } = usePlayerRecords(playerId, {
        from: startDate,
        to: endDate
    });

    if (!records) return null;

    // 計算連續未填寫天數（不包含今天，因為今天可能還沒過完）
    let consecutiveMissing = 0;
    // 從昨天開始往回查
    for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(endDate);
        checkDate.setDate(endDate.getDate() - i);
        const dateStr = format(checkDate, 'yyyy-MM-dd');

        const hasRecord = records.some(r => r.record_date === dateStr && r.training_load_au !== null);

        if (!hasRecord) {
            consecutiveMissing++;
        } else {
            break; // 遇到有填寫的就停止
        }
    }

    if (consecutiveMissing < 2) return null;

    return (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">填寫提醒</AlertTitle>
            <AlertDescription className="text-xs font-medium mt-1">
                您已經連續 <span className="font-black text-lg mx-1">{consecutiveMissing}</span> 天未填寫訓練紀錄。
                <br />
                請記得每日填寫以確保疲勞數據準確性！
            </AlertDescription>
        </Alert>
    );
