import { ResponsiveLine } from '@nivo/line'

interface ACWRTrendChartProps {
    historyData: Array<{
        date: string;
        acwr: number | null;
        chronicLoad: number;
        acuteLoad: number;
    }>;
}

export function ACWRTrendChart({ historyData }: ACWRTrendChartProps) {
    if (!historyData || historyData.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">無歷史數據</div>;
    }

    // 準備 Nivo 數據結構
    // Series 1: ACWR (Line)
    // Series 2: Acute Load (Line or Bar?) -> Chart Combo is harder in Nivo Line. 
    // Let's stick to simple Line chart first, maybe just ACWR, or ACWR + Acute Load normalized.
    // Ideally: Left Axis = Load (0-1000), Right Axis = ACWR (0-3.0)
    // Nivo Line supports dual axis? -> Yes using multiple layers or scales? No native dual Y axis easy support in Nivo Line common API.
    // Workaround: Use 2 charts overlaid or normalize data.
    // For simplicity V1: Only show ACWR Trend with Risk Zones background.

    // Sort by date
    const sortedData = [...historyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const acwrSeries = {
        id: 'ACWR',
        data: sortedData.map(d => ({
            x: d.date.substring(5), // mm-dd
            y: d.acwr || 0 // Handle null
        }))
    };

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveLine
                data={[acwrSeries]}
                margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{
                    type: 'linear',
                    min: 0,
                    max: 2.5, // Fixed max for consistency
                    stacked: false,
                    reverse: false
                }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: '日期',
                    legendOffset: 40,
                    legendPosition: 'middle',
                    truncateTickAt: 0
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'ACWR',
                    legendOffset: -40,
                    legendPosition: 'middle',
                    truncateTickAt: 0
                }}
                // Custom Markers for Risk Zones
                markers={[
                    {
                        axis: 'y',
                        value: 1.5,
                        lineStyle: { stroke: '#EF4F3B', strokeWidth: 2, strokeDasharray: '4 4' },
                        legend: 'H 高風險 (1.5)',
                        legendPosition: 'top-left',
                    },
                    {
                        axis: 'y',
                        value: 1.3,
                        lineStyle: { stroke: '#EFB954', strokeWidth: 1, strokeDasharray: '4 4' },
                        legend: 'W 預警 (1.3)',
                        legendPosition: 'top-left',
                    },
                    {
                        axis: 'y',
                        value: 0.8,
                        lineStyle: { stroke: '#53EF8B', strokeWidth: 1, strokeDasharray: '4 4' },
                        legend: 'S 安全 (0.8)',
                        legendPosition: 'bottom-left',
                    }
                ]}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableSlices="x"
                colors={['#0ea5e9']} // Sky Blue for ACWR line
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
                                fontSize: 11,
                                fill: '#000000',
                                fontWeight: 900
                            }
                        }
                    }
                }}
            />
        </div>
    )
}
