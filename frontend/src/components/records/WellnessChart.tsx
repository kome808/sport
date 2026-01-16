import { useState, useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DailyRecord } from '@/types';

interface WellnessChartProps {
    records: DailyRecord[];
}

export default function WellnessChart({ records }: WellnessChartProps) {
    const [chartMode, setChartMode] = useState<'wellness' | 'load'>('wellness');

    // 將紀錄按日期排序（舊到新）
    const sortedRecords = useMemo(() =>
    ([...records].sort(
        (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    )), [records]
    );

    // 準備 Nivo Line Chart 資料 (Wellness)
    const wellnessData = useMemo(() => [
        {
            id: "身心總分 Wellness",
            color: "hsl(var(--primary))",
            data: sortedRecords.map(r => ({
                x: new Date(r.record_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
                y: r.wellness_total || 0
            }))
        }
    ], [sortedRecords]);

    // 準備 Nivo Bar Chart 資料 (Load)
    const loadData = useMemo(() =>
        sortedRecords.map(r => ({
            date: new Date(r.record_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
            "訓練負荷 sRPE": r.training_load_au || 0,
        })), [sortedRecords]
    );

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
                <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as 'wellness' | 'load')} className="w-full">
                    <TabsList className="grid w-full max-w-[300px] grid-cols-2 rounded-xl bg-slate-100 p-1">
                        <TabsTrigger value="wellness" className="rounded-lg font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">身心 Wellness</TabsTrigger>
                        <TabsTrigger value="load" className="rounded-lg font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">負荷 sRPE</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="w-full h-[320px] bg-white rounded-2xl border border-slate-100 shadow-inner p-4 relative">
                {chartMode === 'wellness' ? (
                    <ResponsiveLine
                        data={wellnessData}
                        margin={{ top: 20, right: 30, left: 40, bottom: 50 }}
                        xScale={{ type: 'point' }}
                        yScale={{ type: 'linear', min: 0, max: 25, stacked: false, reverse: false }}
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
                            tickValues: [0, 5, 10, 15, 20, 25],
                            legend: '分數',
                            legendOffset: -35,
                            legendPosition: 'middle'
                        }}
                        enableGridX={false}
                        colors={["#0ea5e9"]}
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
                                        fill: '#64748b',
                                        fontWeight: 700
                                    }
                                },
                                legend: {
                                    text: {
                                        fontSize: 10,
                                        fill: '#94a3b8',
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
                    <ResponsiveBar
                        data={loadData}
                        keys={['訓練負荷 sRPE']}
                        indexBy="date"
                        margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={["#3b82f6"]}
                        borderRadius={4}
                        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
                            legend: '負荷 (AU)',
                            legendOffset: -40,
                            legendPosition: 'middle'
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                        theme={{
                            axis: {
                                ticks: {
                                    text: {
                                        fontSize: 10,
                                        fill: '#64748b',
                                        fontWeight: 700
                                    }
                                },
                                legend: {
                                    text: {
                                        fontSize: 10,
                                        fill: '#94a3b8',
                                        fontWeight: 900
                                    }
                                }
                            }
                        }}
                    />
                )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 font-bold text-center">
                    {chartMode === 'wellness'
                        ? '💡 Wellness 總分範圍 5-25，分數越高代表身體狀態越理想'
                        : '💡 訓練負荷 (Training Load) = 自覺強度 (sRPE) × 總訓練時間'}
                </p>
            </div>
        </div>
    );
}
