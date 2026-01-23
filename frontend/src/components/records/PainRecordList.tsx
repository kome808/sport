/**
 * 疼痛紀錄列表
 * 顯示球員的疼痛與傷病紀錄
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { usePlayerPainReports, usePlayerRecords, useResolvePainReport } from '@/hooks/usePlayer';
import { BODY_PATHS } from '@/components/player/BodyMapPaths';
import { PainStatusDialog, type PainStatus } from '@/components/records/PainStatusDialog';

interface PainRecordListProps {
    playerId: string;
}

// Dynamically generate BODY_PART_MAP
const BODY_PART_MAP = BODY_PATHS.reduce((acc, part) => {
    acc[part.id] = part.name;
    return acc;
}, {} as Record<string, string>);
BODY_PART_MAP['other'] = '其他部位';

/* Combined Record Type for Display */
type CombinedRecord = {
    id: string;
    date: Date;
    type: 'pain' | 'illness';
    title: string;
    subTitle?: string;
    level?: number;
    description?: string;
    isResolved?: boolean;
    doctorNote?: string;
};

export default function PainRecordList({ playerId }: PainRecordListProps) {
    const { data: painReports, isLoading: isPainLoading } = usePlayerPainReports(playerId);
    // Fetch last 90 days of daily records for illness check
    const { data: dailyRecords, isLoading: isDailyLoading } = usePlayerRecords(playerId, { days: 90 });
    const resolvePain = useResolvePainReport();
    const navigate = useNavigate();
    const params = useParams();
    const [activeStatusDialog, setActiveStatusDialog] = useState<any>(null);

    const handleStatusConfirm = (status: PainStatus) => {
        if (!activeStatusDialog) return;
        const report = activeStatusDialog;

        if (status === 'recovered') {
            const realId = report.id.replace('pain-', '');
            resolvePain.mutate({ reportId: realId });
        } else {
            // Navigate to report page to update
            // Route format: /:teamSlug/player/:playerId/report OR /:teamSlug/p/:shortCode/report
            // We need to know if we are in coach view or player view
            // Heuristic: If params.shortCode exists, might be player view? Or check URL structure.
            // Simplified: Try to construct current path + /report if we are on profile page.

            // If we are getting here, we assume we are in a context where navigation is possible.
            // If we have teamSlug and playerId (or shortCode) from params:
            const teamSlug = params.teamSlug;
            const pId = params.playerId || params.shortCode;

            if (teamSlug && pId) {
                // Determine base route. If current URL contains '/player/', use that. If '/p/', use that.
                const isShortUrl = location.pathname.includes('/p/');
                const basePath = isShortUrl ? `/${teamSlug}/p/${pId}` : `/${teamSlug}/player/${pId}`;

                // We need to pass state to pre-fill? Or just let user fill.
                // React Router state can be used.
                navigate(`${basePath}/report`, {
                    state: {
                        bodyPart: report.title,
                        painLevel: report.level,
                        description: report.description
                    }
                });
            } else {
                alert("請前往每日回報頁面更新此傷痛狀況");
            }
        }
        setActiveStatusDialog(null);
    };

    const groupedRecords = useMemo(() => {
        const records: CombinedRecord[] = [];

        // 1. Process Pain Reports
        if (painReports) {
            // Filter to keep only the latest report per body_part
            const latestReportsMap = new Map<string, any>();
            painReports.forEach(r => {
                const existing = latestReportsMap.get(r.body_part);
                if (!existing || new Date(r.report_date) > new Date(existing.report_date)) {
                    latestReportsMap.set(r.body_part, r);
                }
            });

            // Push filtered reports
            Array.from(latestReportsMap.values()).forEach(r => {
                records.push({
                    id: `pain-${r.id}`,
                    date: new Date(r.report_date),
                    type: 'pain',
                    title: BODY_PART_MAP[r.body_part] || r.body_part,
                    subTitle: r.pain_type === 'fatigue' ? '' : (r.pain_type === 'acute' ? '急性' : r.pain_type === 'chronic' ? '慢性' : ''),
                    level: r.pain_level,
                    description: r.description,
                    isResolved: r.is_resolved
                });
            });
        }

        // 2. Process Illness from Daily Records
        if (dailyRecords) {
            dailyRecords.forEach(r => {
                if (r.feedback) {
                    const illMatch = r.feedback.match(/\[生病: (.*?)\] (.*?)(?=\n\n|$)/s);
                    const docMatch = r.feedback.match(/\[醫囑\] (.*?)(?=\n\n|$)/s);

                    if (illMatch) {
                        const illnessLabel = illMatch[1];
                        const illnessDesc = illMatch[2];
                        records.push({
                            id: `illness-${r.id}`,
                            date: new Date(r.record_date),
                            type: 'illness',
                            title: illnessLabel,
                            description: illnessDesc,
                            doctorNote: docMatch ? docMatch[1] : undefined
                        });
                    } else if (docMatch) {
                        // 如果只有醫囑沒有生病標籤，我們也顯示出來，或者視為其他
                        records.push({
                            id: `doc-${r.id}`,
                            date: new Date(r.record_date),
                            type: 'illness',
                            title: '醫生評估',
                            description: '',
                            doctorNote: docMatch[1]
                        });
                    }
                }
            });
        }

        // 3. Group by Date
        const groups: Record<string, CombinedRecord[]> = {};
        records.forEach(r => {
            const dateKey = format(r.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(r);
        });

        // 4. Transform to array and sort by date desc
        return Object.entries(groups)
            .map(([dateKey, items]) => ({
                dateKey,
                date: items[0].date, // Use the date from the first item
                items: items
            }))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [painReports, dailyRecords]);

    const isLoading = isPainLoading || isDailyLoading;

    if (isLoading) {
        return <div className="text-center py-4 text-muted-foreground">載入紀錄中...</div>;
    }

    if (groupedRecords.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
                    <p>目前沒有傷病或生病紀錄，保持健康！</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    傷病與生病紀錄
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {groupedRecords.map((group) => (
                        <div key={group.dateKey} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                            {/* Date Header */}
                            <div className="mb-3 flex items-center gap-2">
                                <div className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-sm">
                                    {format(group.date, 'MM/dd')}
                                </div>
                                <span className="text-xs text-slate-400 font-medium">{format(group.date, 'yyyy')}</span>
                            </div>

                            {/* Items for this date */}
                            <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                                {group.items.map((record) => (
                                    <div key={record.id} className="relative">
                                        {/* Item Content */}
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2 flex-wrap">
                                                    {record.type === 'illness' ? (
                                                        <Badge variant="outline" className="mr-2 px-2 py-0.5 text-xs font-bold bg-orange-50 text-orange-600 border-orange-200">
                                                            生病
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="mr-2 px-2 py-0.5 text-xs font-bold bg-red-50 text-red-600 border-red-200">
                                                            傷痛
                                                        </Badge>
                                                    )}
                                                    <span className="text-slate-900 font-bold">
                                                        {record.title}
                                                        {record.level !== undefined && record.level > 0 && (
                                                            <span className="ml-2 text-slate-500 font-normal whitespace-nowrap text-sm">疼痛指數 {record.level}</span>
                                                        )}
                                                    </span>
                                                    {record.subTitle && (
                                                        <span className="text-xs font-normal text-slate-400">
                                                            ({record.subTitle})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {record.isResolved ? (
                                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                                        已解決
                                                    </Badge>
                                                ) : (
                                                    record.type === 'pain' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setActiveStatusDialog(record);
                                                            }}
                                                        >
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            回報恢復
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Description & Notes */}
                                        <div className="space-y-2 mt-2">
                                            {record.description && (
                                                <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    {record.description}
                                                </div>
                                            )}
                                            {record.doctorNote && (
                                                <div className="text-sm text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex gap-2 items-start">
                                                    <span className="font-bold flex-shrink-0 text-blue-600 text-xs uppercase tracking-wider mt-0.5">醫囑</span>
                                                    <span>{record.doctorNote}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {activeStatusDialog && (
                <PainStatusDialog
                    isOpen={!!activeStatusDialog}
                    onClose={() => setActiveStatusDialog(null)}
                    onConfirm={handleStatusConfirm}
                    bodyPartName={activeStatusDialog.title}
                />
            )}
        </Card>
    );
}
