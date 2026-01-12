/**
 * 疼痛紀錄列表
 * 顯示球員的疼痛與傷病紀錄
 */

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerPainReports } from '@/hooks/usePlayer';

interface PainRecordListProps {
    playerId: string;
}

const PainLevelBadge = ({ level }: { level: number }) => {
    let colorClass = "bg-green-500 hover:bg-green-600";
    if (level >= 7) colorClass = "bg-red-500 hover:bg-red-600";
    else if (level >= 4) colorClass = "bg-yellow-500 hover:bg-yellow-600";

    return (
        <Badge className={`${colorClass} text-white border-0`}>
            Level {level}
        </Badge>
    );
};

// 身體部位對照表
const BODY_PART_MAP: Record<string, string> = {
    'shoulder_r': '右肩膀', 'shoulder_l': '左肩膀',
    'elbow_r': '右手肘', 'elbow_l': '左手肘',
    'wrist_r': '右手腕', 'wrist_l': '左手腕',
    'back_low': '下背/腰', 'back_up': '上背',
    'hip_r': '右髖部', 'hip_l': '左髖部',
    'knee_r': '右膝蓋', 'knee_l': '左膝蓋',
    'ankle_r': '右腳踝', 'ankle_l': '左腳踝',
    'thigh_r': '右大腿', 'thigh_l': '左大腿',
    'calf_r': '右小腿', 'calf_l': '左小腿',
    'other': '其他部位'
};

export default function PainRecordList({ playerId }: PainRecordListProps) {
    const { data: reports, isLoading } = usePlayerPainReports(playerId);

    if (isLoading) {
        return <div className="text-center py-4 text-muted-foreground">載入紀錄中...</div>;
    }

    if (!reports || reports.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
                    <p>目前沒有疼痛紀錄，保持健康！</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    傷病紀錄 ({reports.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                        {reports.map((report) => (
                            <div key={report.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-1">
                                        <div className="font-medium flex items-center gap-2">
                                            {BODY_PART_MAP[report.body_part] || report.body_part}
                                            {report.pain_type && (
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    ({report.pain_type === 'acute' ? '急性' :
                                                        report.pain_type === 'chronic' ? '慢性' : '疲勞'})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {format(new Date(report.report_date), 'PPP', { locale: zhTW })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <PainLevelBadge level={report.pain_level} />
                                        {report.is_resolved && (
                                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                                已解決
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {report.description && (
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {report.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
