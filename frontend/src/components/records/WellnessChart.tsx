import { useState, useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DailyRecord } from '@/types';

interface WellnessChartProps {
    records: DailyRecord[];
}

export default function WellnessChart({ records }: WellnessChartProps) {
    const [chartMode, setChartMode] = useState<'wellness' | 'load' | 'rhr'>('rhr');

    // 將紀錄按日期排序（舊到新）
    const sortedRecords = useMemo(() =>
    ([...records].sort(
        (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    )), [records]
    );

    // 準備 Nivo Line Chart 資料 (Wellness)
    const wellnessSeries = useMemo(() => [
        {
            id: "身心總分 Wellness",
            color: "#0ea5e9",
            data: sortedRecords.map(r => ({
                x: new Date(r.record_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
                y: r.wellness_total || 0
            }))
        }
    ], [sortedRecords]);

    const rhrSeries = useMemo(() => [
        {
            id: "晨間心跳 RHR",
            color: "#EF4F3B",
            data: sortedRecords.filter(r => r.rhr_bpm !== undefined && r.rhr_bpm !== null).map(r => ({
                x: new Date(r.record_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
                y: r.rhr_bpm as number
            }))
        }
    ], [sortedRecords]);



    if (records.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-slate-400 font-bold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                尚無資料可顯示
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as any)} className="w-full">
                    <TabsList className="grid w-full max-w-[450px] grid-cols-3 rounded-xl bg-slate-100 p-1">
                        <TabsTrigger value="rhr" className="rounded-lg font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">晨間心跳</TabsTrigger>
                        <TabsTrigger value="wellness" className="rounded-lg font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">身心狀態</TabsTrigger>
                        <TabsTrigger value="load" className="rounded-lg font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">訓練負荷</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="w-full h-[320px] bg-white rounded-2xl border border-slate-100 shadow-inner p-4 relative">
                {chartMode === 'wellness' || chartMode === 'rhr' || chartMode === 'load' ? (
                    <ResponsiveLine
                        data={
                            chartMode === 'wellness' ? wellnessSeries :
                                chartMode === 'rhr' ? rhrSeries :
                                    [{
                                        id: "訓練負荷 sRPE",
                                        color: "#3b82f6",
                                        data: sortedRecords.map(r => ({
                                            x: new Date(r.record_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
                                            y: r.training_load_au || 0
                                        }))
                                    }]
                        }
                        margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
                        xScale={{ type: 'point' }}
                        yScale={{
                            type: 'linear',
                            min: chartMode === 'rhr' ? 'auto' : 0,
                            max: chartMode === 'wellness' ? 50 : 'auto',
                            stacked: false,
                            reverse: false
                        }}
                        yFormat=" >-.0f"
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 10,
                            tickRotation: 0,
                            legend: '日期',
                            legendOffset: 40,
                            legendPosition: 'middle'
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: chartMode === 'rhr' ? 'bpm' : chartMode === 'load' ? 'AU' : '分數',
                            legendOffset: -40,
                            legendPosition: 'middle'
                        }}
                        enableGridX={false}
                        colors={chartMode === 'wellness' ? ["#0ea5e9"] : chartMode === 'rhr' ? ["#EF4F3B"] : ["#3b82f6"]}
                        lineWidth={3}
                        pointSize={8}
                        pointColor="#ffffff"
                        pointBorderWidth={2}
                        pointBorderColor={{ from: 'serieColor' }}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        enableArea={true}
                        areaOpacity={0.1}
                        theme={{
                            axis: {
                                ticks: {
                                    text: {
                                        fontSize: 10,
                                        fill: '#000000',
                                        fontWeight: 700
                                    }
                                },
                                legend: {
                                    text: {
                                        fontSize: 10,
                                        fill: '#000000',
                                        fontWeight: 900
                                    }
                                }
                            },
                            grid: {
                                line: {
                                    stroke: '#f1f5f9',
                                    strokeWidth: 1
                                }
                            }
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">無圖表數據</div>
                )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 font-bold text-center">
                    {chartMode === 'wellness' ? '💡 Wellness 總分範圍 5-50，分數越高代表身體狀態越理想' :
                        chartMode === 'load' ? '💡 訓練負荷 (Training Load) = 自覺強度 (sRPE) × 總訓練時間' :
                            '💡 晨間心跳 (RHR) 的變化能反映自主神經系統的疲勞與恢復程度'}
                </p>
            </div>
        </div>
    );
}
