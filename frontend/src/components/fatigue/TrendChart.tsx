import { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { line, curveMonotoneX } from 'd3-shape'; // Nivo 使用 d3-shape
import { scaleLinear } from 'd3-scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerRecords } from '@/hooks/usePlayer';
import { format } from 'date-fns';

interface TrendChartProps {
    playerId: string;
    days?: number;
}

export function TrendChart({ playerId, days = 14 }: TrendChartProps) {
    // 取得歷史紀錄
    const { data: records, isLoading } = usePlayerRecords(playerId, { days });

    const data = useMemo(() => {
        if (!records) return [];
        return [...records]
            .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())
            .map(r => ({
                date: format(new Date(r.record_date), 'MM/dd'),
                sRPE: (r.srpe_score || 0) * (r.training_minutes || 0),
                ACWR: r.acwr || 0,
                // 用於 tooltip 顯示完整資訊
                rawDate: r.record_date,
            }));
    }, [records]);

    if (isLoading) {
        return <div className="h-72 w-full bg-slate-100 animate-pulse rounded-lg" />;
    }

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 border rounded-lg">
                尚無歷史趨勢數據
            </div>
        );
    }

    // 自定義 Layer 來繪製 ACWR 折線
    const LineLayer = ({ bars, xScale, innerHeight, innerWidth }: any) => {
        // 建立 ACWR 的 Y 軸比例尺 (0 ~ 2.0)
        const yScale = scaleLinear()
            .domain([0, 2.0])
            .range([innerHeight, 0]);

        // 產生路徑生成器
        const lineGenerator = line<any>()
            .x(d => xScale(d.data.date) + xScale.bandwidth() / 2) // 對齊長條中心
            .y(d => yScale(d.data.ACWR))
            .curve(curveMonotoneX);

        return (
            <>
                {/* 折線 */}
                <path
                    d={lineGenerator(bars) || ''}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    style={{ pointerEvents: 'none' }}
                />

                {/* 資料點 */}
                {bars.map((bar: any) => (
                    <circle
                        key={bar.key}
                        cx={xScale(bar.data.date) + xScale.bandwidth() / 2}
                        cy={yScale(bar.data.ACWR)}
                        r={4}
                        fill="#FFFFFF"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        style={{ pointerEvents: 'none' }}
                    />
                ))}

                {/* 右側 Y 軸 (ACWR Axis) */}
                <g transform={`translate(${innerWidth}, 0)`}>
                    <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="#cbd5e1" />
                    {[0, 0.5, 1.0, 1.5, 2.0].map(tick => (
                        <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                            <line x1={0} x2={6} stroke="#cbd5e1" />
                            <text
                                x={10}
                                y={0}
                                dy={4}
                                textAnchor="start"
                                fill="#94a3b8"
                                fontSize={11}
                            >
                                {tick}
                            </text>
                        </g>
                    ))}
                    {/* ACWR Label */}
                    <text
                        x={30}
                        y={innerHeight / 2}
                        transform={`rotate(90, 30, ${innerHeight / 2})`}
                        textAnchor="middle"
                        fill="#F59E0B"
                        fontSize={12}
                        fontWeight="bold"
                    >
                        ACWR
                    </text>
                </g>
            </>
        );
    };

    // 高風險閾值線 Layer
    const ThresholdLineLayer = ({ innerWidth, yScale }: any) => {
        const y = yScale(600); // sRPE 600 分界線
        if (!y) return null;

        return (
            <g transform={`translate(0, ${y})`}>
                <line
                    x1={0}
                    x2={innerWidth}
                    stroke="#EF4444"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.8}
                />
                <text x={0} y={-4} fill="#EF4444" fontSize={10} fontWeight="bold">
                    High Risk (600)
                </text>
            </g>
        );
    };

    // 自訂 Tooltip
    const CustomTooltip = ({ id, value, color, data }: any) => (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-100 text-xs">
            <div className="font-bold mb-1 text-slate-700">{data.date}</div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-500">sRPE:</span>
                <span className="font-mono font-bold text-slate-700">{value}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-500">ACWR:</span>
                <span className="font-mono font-bold text-amber-600">{data.ACWR}</span>
            </div>
        </div>
    );

    return (
        <Card className="shadow-none border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span>近 {days} 天負荷趨勢</span>
                    <div className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            sRPE
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-1 bg-amber-500 rounded-full"></div>
                            ACWR
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-72 w-full">
                    <ResponsiveBar
                        data={data}
                        keys={['sRPE']}
                        indexBy="date"
                        margin={{ top: 20, right: 50, bottom: 40, left: 40 }} // 右側留空間給 ACWR 軸
                        padding={0.4}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={({ data }) => data.sRPE >= 600 ? '#EF4444' : '#3B82F6'}
                        borderRadius={4}
                        axisTop={null}
                        axisRight={null} // 我們利用 Layer 自己畫
                        axisBottom={{
                            tickSize: 0,
                            tickPadding: 12,
                            tickRotation: 0,
                            legend: '',
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={{
                            tickSize: 0,
                            tickPadding: 10,
                            tickRotation: 0,
                            legend: 'Load (AU)',
                            legendPosition: 'middle',
                            legendOffset: -35
                        }}
                        enableGridY={true}
                        gridYValues={5}
                        theme={{
                            axis: {
                                ticks: { text: { fill: '#64748B', fontSize: 11 } },
                                legend: { text: { fill: '#64748B', fontSize: 11 } }
                            },
                            grid: { line: { stroke: '#F1F5F9' } }
                        }}
                        layers={[
                            'grid',
                            'axes',
                            'bars',
                            ThresholdLineLayer,
                            LineLayer, // 疊加折線層
                        ]}
                        tooltip={CustomTooltip}
                        animate={true}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
