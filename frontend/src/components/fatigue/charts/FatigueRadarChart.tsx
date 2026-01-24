import { ResponsiveRadar } from '@nivo/radar'

interface FatigueRadarChartProps {
    data: {
        sleep: number;
        fatigue: number;
        mood: number;
        stress: number;
        soreness: number;
    };
    variant?: 'compact' | 'full';
}

export function FatigueRadarChart({ data }: FatigueRadarChartProps) {
    // 轉換數據格式適配 Nivo Radar
    // 原始數據: 1-5
    // Sleep: 5=Best, 1=Worst
    // Fatigue: 5=Very Fresh (Low Fatigue), 1=Very Tired (High Fatigue) 
    // Mood: 5=Very Good
    // Stress: 5=Very Relaxed (Low Stress), 1=Very Stressed
    // Soreness: 5=No Soreness, 1=Very Sore

    const chartData = [
        { metric: '睡眠', value: data.sleep || 0 },
        { metric: '疲勞感', value: data.fatigue || 0 },
        { metric: '心情', value: data.mood || 0 },
        { metric: '壓力', value: data.stress || 0 },
        { metric: '肌肉痠痛', value: data.soreness || 0 },
    ];

    const hasData = Object.values(data).some(v => v !== null && v !== 0);

    if (!hasData) {
        return (
            <div
                className="flex items-center justify-center text-slate-400 font-medium h-full w-full py-4 text-xs"
            >
                <div>暫無狀態數據 (No Data)</div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <ResponsiveRadar
                data={chartData}
                keys={['value']}
                indexBy="metric"
                maxValue={5}
                valueFormat=">-.2f"
                margin={{ top: 25, right: 35, bottom: 25, left: 35 }}
                borderColor={{ from: 'color' }}
                gridLabelOffset={16} // 標籤距離
                dotSize={10}
                dotColor={{ theme: 'background' }}
                dotBorderWidth={2}
                colors={{ scheme: 'nivo' }} // 或自訂顏色
                blendMode="multiply"
                motionConfig="wobbly"
                theme={{
                    axis: {
                        ticks: {
                            text: {
                                fontSize: 11,
                                fill: '#000000', // 標籤顏色改為黑色
                                fontWeight: 900  // 增加字重
                            }
                        }
                    },
                    grid: {
                        line: {
                            stroke: '#dddddd',
                            strokeWidth: 1
                        }
                    }
                }}
            />
        </div>
    )
}
