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
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm border-collapse">
                <thead>
                    {/* 第一層表頭：分組 */}
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th rowSpan={2} className="text-left py-3 px-4 font-black text-slate-900 border-r border-slate-200">日期</th>
                        <th rowSpan={2} className="text-center py-3 px-2 font-black text-slate-900 border-r border-slate-200">RHR</th>
                        <th colSpan={6} className="text-center py-2 px-2 font-black text-slate-900 border-r border-slate-200 bg-info/5">身心狀態 Wellness</th>
                        <th colSpan={3} className="text-center py-2 px-2 font-black text-slate-900 border-r border-slate-200 bg-primary/5">訓練負荷 sRPE</th>
                        <th rowSpan={2} className="text-center py-3 px-2 font-black text-slate-900">風險 Risk</th>
                    </tr>
                    {/* 第二層表頭：具體指標 */}
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">睡眠 Sleep</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">疲勞 Fatigue</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">心情 Mood</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">壓力 Stress</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">痠痛 Soreness</th>
                        <th className="text-center py-2 px-2 font-black text-info border-r border-slate-200">總分 Total</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">強度 RPE</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-200">時間 Duration</th>
                        <th className="text-center py-2 px-2 font-black text-primary border-r border-slate-200">負荷 Load</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-100">{formatDate(record.record_date)}</td>
                            <td className="text-center py-2 px-2 font-bold text-slate-700 border-r border-slate-100">
                                {record.rhr_bpm || '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.sleep_quality || '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.fatigue_level || '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">{record.mood || '-'}</td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.stress_level || '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.muscle_soreness || '-'}
                            </td>
                            <td className="text-center py-2 px-2 font-black text-info border-r border-slate-100">
                                {record.wellness_total || '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.srpe_score ?? '-'}
                            </td>
                            <td className="text-center py-2 px-2 text-slate-600 border-r border-slate-100">
                                {record.training_minutes || '-'}
                            </td>
                            <td className="text-center py-2 px-2 font-black text-primary border-r border-slate-100">
                                {record.training_load_au || '-'}
                            </td>
                            <td className="text-center py-2 px-2">
                                {record.risk_level ? (
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${riskColors[record.risk_level as keyof typeof riskColors] ||
                                            'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {record.risk_level}
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black text-slate-300 bg-slate-50 border border-slate-100">NONE</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
