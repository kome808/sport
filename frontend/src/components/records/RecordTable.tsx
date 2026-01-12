/**
 * 紀錄表格元件
 * 顯示每日回報的歷史紀錄
 */

import type { DailyRecord } from '@/types';

interface RecordTableProps {
    records: DailyRecord[];
    compact?: boolean;
}

// 風險等級顏色
const riskColors = {
    green: 'bg-risk-green text-white',
    yellow: 'bg-risk-yellow text-white',
    red: 'bg-risk-red text-white',
    black: 'bg-risk-black text-white',
} as const;

// 格式化日期
function formatDate(dateStr: string, compact = false): string {
    const date = new Date(dateStr);
    if (compact) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    });
}

export default function RecordTable({ records, compact = false }: RecordTableProps) {
    if (records.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                尚無回報紀錄
            </div>
        );
    }

    if (compact) {
        // 精簡版：僅顯示日期、Wellness 總分、風險等級
        return (
            <div className="space-y-2">
                {records.map((record) => (
                    <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                        <span className="text-sm font-medium">
                            {formatDate(record.record_date, true)}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm">
                                Wellness: {record.wellness_total || '-'}/25
                            </span>
                            {record.risk_level && (
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[record.risk_level as keyof typeof riskColors] ||
                                        'bg-muted'
                                        }`}
                                >
                                    {record.risk_level}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 完整版：表格顯示
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">日期</th>
                        <th className="text-center py-2 px-2 font-medium">RHR</th>
                        <th className="text-center py-2 px-2 font-medium">睡眠</th>
                        <th className="text-center py-2 px-2 font-medium">疲勞</th>
                        <th className="text-center py-2 px-2 font-medium">心情</th>
                        <th className="text-center py-2 px-2 font-medium">壓力</th>
                        <th className="text-center py-2 px-2 font-medium">痠痛</th>
                        <th className="text-center py-2 px-2 font-medium">Wellness</th>
                        <th className="text-center py-2 px-2 font-medium">sRPE</th>
                        <th className="text-center py-2 px-2 font-medium">訓練(分)</th>
                        <th className="text-center py-2 px-2 font-medium">負荷</th>
                        <th className="text-center py-2 px-2 font-medium">風險</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                            <td className="py-2 px-3">{formatDate(record.record_date)}</td>
                            <td className="text-center py-2 px-2">
                                {record.rhr_bpm || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.sleep_quality || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.fatigue_level || '-'}
                            </td>
                            <td className="text-center py-2 px-2">{record.mood || '-'}</td>
                            <td className="text-center py-2 px-2">
                                {record.stress_level || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.muscle_soreness || '-'}
                            </td>
                            <td className="text-center py-2 px-2 font-medium">
                                {record.wellness_total || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.srpe_score ?? '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.training_minutes || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.training_load_au || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.risk_level ? (
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[record.risk_level as keyof typeof riskColors] ||
                                            'bg-muted'
                                            }`}
                                    >
                                        {record.risk_level}
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
