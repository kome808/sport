/**
 * 每日紀錄歷史檢視元件
 * 教練端與球員端共用，透過 variant 控制顯示模式
 */

import { useState } from 'react';
import { Loader2, Calendar, TrendingUp } from 'lucide-react';
import { type DateRange } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { usePlayerRecords } from '@/hooks/usePlayer';
import WellnessChart from './WellnessChart';
import RecordTable from './RecordTable';

interface DailyRecordHistoryProps {
    playerId: string;
    variant: 'full' | 'compact';
    defaultPeriod?: '7d' | '14d' | '28d';
}

const periodDays = {
    '7d': 7,
    '14d': 14,
    '28d': 28,
};

export default function DailyRecordHistory({
    playerId,
    variant,
    defaultPeriod = '7d',
}: DailyRecordHistoryProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - periodDays[defaultPeriod]);
        return { from, to };
    });

    const { data: records, isLoading, error } = usePlayerRecords(playerId, {
        from: dateRange?.from,
        to: dateRange?.to,
    });

    // 處理快速區間切換
    const handlePeriodChange = (value: string) => {
        const days = periodDays[value as keyof typeof periodDays];
        if (days) {
            const to = new Date();
            const from = new Date();
            from.setDate(to.getDate() - days);
            setDateRange({ from, to });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                    載入失敗，請稍後再試
                </CardContent>
            </Card>
        );
    }

    // 精簡版（球員端）- 維持固定 7 天
    if (variant === 'compact') {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        近 7 天紀錄
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RecordTable records={records || []} compact />
                </CardContent>
            </Card>
        );
    }

    // 完整版（教練端）
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        歷史紀錄
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <Tabs
                            defaultValue={defaultPeriod}
                            onValueChange={handlePeriodChange}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                                <TabsTrigger value="7d">7 天</TabsTrigger>
                                <TabsTrigger value="14d">14 天</TabsTrigger>
                                <TabsTrigger value="28d">30 天</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="hidden sm:block text-muted-foreground">|</div>
                        <DateRangePicker
                            date={dateRange}
                            setDate={setDateRange}
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-10 pt-6">
                <WellnessChart records={records || []} />
                <RecordTable records={records || []} />
            </CardContent>
        </Card>
    );
}
