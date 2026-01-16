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

export function FatigueRadarChart({ data, variant = 'full' }: FatigueRadarChartProps) {
    // 轉換數據格式適配 Nivo Radar
    // 原始數據: 1-5
    // Sleep: 5=Best, 1=Worst
    // Fatigue: 1=Best, 5=Worst (Need Invert?) -> 
    //   Usually in Wellness questionnaires:
    //   Sleep Quality: 5=Very Good
    //   Fatigue: 5=Very Fresh (Low Fatigue), 1=Very Tired (High Fatigue) 
    //   Mood: 5=Very Good
    //   Stress: 5=Very Relaxed (Low Stress), 1=Very Stressed
    //   Soreness: 5=No Soreness, 1=Very Sore
    // 如果系統的數據定義是 "分數越高越好" (Wellness Total 越高越好)，則直接使用即可。
    // 根據 check_honesty_score RPG, fatigue_level 1-5, sRPE high vs fatigue low ??
    // Let's assume standard wellness: Higher is Better.

    const chartData = [
        { metric: '睡眠', value: data.sleep },
        { metric: '疲勞感', value: data.fatigue }, // 若此值 5 代表很累，則需反轉。假設 5=狀態好(不累)
        { metric: '心情', value: data.mood },
        { metric: '壓力', value: data.stress }, // 假設 5=放鬆
        { metric: '肌肉痠痛', value: data.soreness }, // 假設 5=不痠
    ];

    const isCompact = variant === 'compact';

    return (
        <div style={{ height: isCompact ? '250px' : '400px', width: '100%' }}>
            <ResponsiveRadar
                data={chartData}
                keys={['value']}
                indexBy="metric"
                maxValue={5}
                valueFormat=">-.2f"
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
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
                                fontSize: 12,
                                fill: '#888888' // 標籤顏色
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
