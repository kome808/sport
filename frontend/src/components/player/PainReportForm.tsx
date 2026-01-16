/**
 * 疼痛回報表單
 * 允許球員回報身體部位、疼痛程度與類型
 */

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { BODY_PATHS } from './BodyMapPaths';
import BodyMapSelector from './BodyMapSelector';

import { useSubmitPainReport } from '@/hooks/usePlayer';

interface PainReportFormProps {
    playerId: string;
    onSuccess?: () => void;
}



export default function PainReportForm({ playerId, onSuccess }: PainReportFormProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const submitMutation = useSubmitPainReport();

    // 表單狀態
    const [bodyPart, setBodyPart] = useState<string>('');
    const [painLevel, setPainLevel] = useState<number>(3);
    const [description, setDescription] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bodyPart) return;

        try {
            await submitMutation.mutateAsync({
                player_id: playerId,
                report_date: format(new Date(), 'yyyy-MM-dd'),
                body_part: bodyPart,
                pain_level: painLevel,
                pain_type: undefined, // 暫時移除疼痛類型，設為 undefined
                description: description,
                is_resolved: false,
            });

            setIsSuccess(true);
            setBodyPart('');
            setPainLevel(3);
            setDescription('');

            setTimeout(() => setIsSuccess(false), 3000);
            onSuccess?.();
        } catch (error) {
            console.error(error);
        }
    };

    // 根據疼痛分數改變顏色
    const getPainColor = (level: number) => {
        if (level <= 3) return 'text-green-500';
        if (level <= 6) return 'text-yellow-500';
        return 'text-red-500';
    };

    const selectedPartLabel = bodyPart ? (BODY_PATHS.find(p => p.id === bodyPart)?.name || bodyPart) : '請點擊下方圖示選擇';

    return (
        <Card className="border-red-100 dark:border-red-900/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    疼痛/傷病回報
                </CardTitle>
                <CardDescription>
                    如果有任何身體不適，請點擊下方人體圖示回報，讓教練知道你的狀況。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 身體部位 (Body Map) */}
                    <div className="space-y-3">
                        <Label>身體部位 (必選)</Label>
                        <div className="text-sm font-medium text-primary mb-2">
                            已選擇: <span className="text-foreground">{selectedPartLabel}</span>
                        </div>
                        <BodyMapSelector
                            selectedPart={bodyPart}
                            onSelect={setBodyPart}
                            className="bg-muted/30 rounded-lg p-2"
                        />
                    </div>

                    {/* 疼痛程度 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>疼痛程度 (1-10)</Label>
                            <span className={`text-lg font-bold ${getPainColor(painLevel)}`}>
                                {painLevel}
                            </span>
                        </div>
                        <Slider
                            value={[painLevel]}
                            onValueChange={(val) => setPainLevel(val[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="py-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>微痛</span>
                            <span>劇痛</span>
                        </div>
                    </div>

                    {/* 描述 */}
                    <div className="space-y-2">
                        <Label>狀況描述 (選填)</Label>
                        <Textarea
                            placeholder="請描述疼痛的感覺，例如：滑壘撞到、投球時會痛..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* 提交按鈕 */}
                    <Button
                        type="submit"
                        variant="destructive"
                        className="w-full"
                        disabled={!bodyPart || submitMutation.isPending}
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                提交中...
                            </>
                        ) : isSuccess ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                已回報
                            </>
                        ) : (
                            '提交回報'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
