/**
 * Wellness 趨勢圖表元件
 * 支援顯示 Wellness 總分與 Training Load
 */

import { useState } from 'react';
import {
    LineChart,
    BarChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DailyRecord } from '@/types';

interface WellnessChartProps {
    records: DailyRecord[];
}

export default function WellnessChart({ records }: WellnessChartProps) {
    const [chartMode, setChartMode] = useState<'wellness' | 'load'>('wellness');

    // 將紀錄按日期排序（舊到新）
    const sortedRecords = [...records].sort(
        (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    );

    // 準備圖表資料
    const chartData = sortedRecords.map((record) => ({
        date: new Date(record.record_date).toLocaleDateString('zh-TW', {
            month: 'numeric',
            day: 'numeric',
        }),
        fullDate: record.record_date,
        wellness: record.wellness_total || 0,
        load: record.training_load_au || ((record.srpe_score || 0) * (record.training_minutes || 0)),
        minutes: record.training_minutes || 0,
        rpe: record.srpe_score || 0,
    }));

    if (records.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                尚無資料可顯示
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 圖表模式切換 */}
            <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as 'wellness' | 'load')} className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="wellness">Wellness 狀態</TabsTrigger>
                    <TabsTrigger value="load">訓練負荷 (Load)</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'wellness' ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                            <YAxis domain={[0, 25]} tickCount={6} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--popover-foreground))' }}
                            />
                            <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '良好', position: 'insideRight', fill: '#22c55e', fontSize: 10 }} />
                            <ReferenceLine y={15} stroke="#eab308" strokeDasharray="5 5" label={{ value: '注意', position: 'insideRight', fill: '#eab308', fontSize: 10 }} />
                            <Line
                                type="monotone"
                                dataKey="wellness"
                                name="Wellness 總分"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Legend />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                            <YAxis
                                yAxisId="left"
                                label={{ value: 'Load (au)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 300]}
                                hide
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--popover-foreground))' }}
                                formatter={(value, name) => {
                                    if (name === 'Load') return [`${value} au`, '訓練負荷'];
                                    return [value, name];
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="load"
                                name="Load"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                            />
                            <Legend />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* 說明文字 */}
            <div className="text-xs text-muted-foreground text-center">
                {chartMode === 'wellness'
                    ? '總分範圍 5-25，分數越高代表狀態越好'
                    : '訓練負荷 (Load) = sRPE (強度 0-10) × 訓練時間 (分鐘)'}
            </div>
        </div>
    );
}
