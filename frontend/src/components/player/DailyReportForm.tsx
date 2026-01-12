/**
 * 每日訓練回報表單
 * 包含 RHR、Wellness 五項、sRPE 等欄位
 */

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import WellnessSlider from './WellnessSlider';
import { useSubmitDailyRecord, usePlayerTodayRecord } from '@/hooks/usePlayer';

interface DailyReportFormProps {
    playerId: string;
    onSuccess?: () => void;
}

// sRPE 等級描述
const srpeLabels = [
    '0 - 完全休息',
    '1 - 非常輕鬆',
    '2 - 輕鬆',
    '3 - 普通',
    '4 - 有點累',
    '5 - 困難',
    '6 - 較困難',
    '7 - 非常困難',
    '8 - 極困難',
    '9 - 接近極限',
    '10 - 最大極限',
];

export default function DailyReportForm({ playerId, onSuccess }: DailyReportFormProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const { data: existingRecord, isLoading: recordLoading } = usePlayerTodayRecord(playerId);
    const submitMutation = useSubmitDailyRecord();

    // 表單狀態
    const [rhrBpm, setRhrBpm] = useState<string>('');
    const [sleepQuality, setSleepQuality] = useState(3);
    const [fatigueLevel, setFatigueLevel] = useState(3);
    const [mood, setMood] = useState(3);
    const [stressLevel, setStressLevel] = useState(3);
    const [muscleSoreness, setMuscleSoreness] = useState(3);
    const [srpeScore, setSrpeScore] = useState<number | null>(null);
    const [trainingMinutes, setTrainingMinutes] = useState<string>('');

    // 載入既有紀錄
    useEffect(() => {
        if (existingRecord) {
            if (existingRecord.rhr_bpm) setRhrBpm(String(existingRecord.rhr_bpm));
            if (existingRecord.sleep_quality) setSleepQuality(existingRecord.sleep_quality);
            if (existingRecord.fatigue_level) setFatigueLevel(existingRecord.fatigue_level);
            if (existingRecord.mood) setMood(existingRecord.mood);
            if (existingRecord.stress_level) setStressLevel(existingRecord.stress_level);
            if (existingRecord.muscle_soreness) setMuscleSoreness(existingRecord.muscle_soreness);
            if (existingRecord.srpe_score !== undefined) setSrpeScore(existingRecord.srpe_score ?? null);
            if (existingRecord.training_minutes) setTrainingMinutes(String(existingRecord.training_minutes));
        }
    }, [existingRecord]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const today = new Date().toISOString().split('T')[0];
        const data = {
            player_id: playerId,
            record_date: today,
            rhr_bpm: rhrBpm ? parseInt(rhrBpm, 10) : undefined,
            sleep_quality: sleepQuality,
            fatigue_level: fatigueLevel,
            mood: mood,
            stress_level: stressLevel,
            muscle_soreness: muscleSoreness,
            srpe_score: srpeScore ?? undefined,
            training_minutes: trainingMinutes ? parseInt(trainingMinutes, 10) : undefined,
        };

        try {
            await submitMutation.mutateAsync(data);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            onSuccess?.();
        } catch (error) {
            console.error('提交失敗:', error);
        }
    };

    if (recordLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📝 今日回報
                    {existingRecord && (
                        <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-0.5 rounded">
                            已填寫
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 晨間心率 */}
                    <div className="space-y-2">
                        <Label htmlFor="rhr">晨間靜止心率 (bpm)</Label>
                        <Input
                            id="rhr"
                            type="number"
                            placeholder="例如: 60"
                            min={40}
                            max={120}
                            value={rhrBpm}
                            onChange={(e) => setRhrBpm(e.target.value)}
                            className="max-w-[150px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            選填，建議醒來後躺著測量
                        </p>
                    </div>

                    {/* Wellness 五項 */}
                    <div className="space-y-5 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            主觀感受評估 (必填)
                        </h4>

                        <WellnessSlider
                            label="睡眠品質"
                            value={sleepQuality}
                            onChange={setSleepQuality}
                            leftLabel="很差"
                            rightLabel="很好"
                            emoji={['😴', '😪', '😐', '😊', '🌟']}
                        />

                        <WellnessSlider
                            label="疲勞程度"
                            value={fatigueLevel}
                            onChange={setFatigueLevel}
                            leftLabel="極度疲勞"
                            rightLabel="精力充沛"
                            emoji={['😵', '😩', '😐', '💪', '⚡']}
                        />

                        <WellnessSlider
                            label="心情狀態"
                            value={mood}
                            onChange={setMood}
                            leftLabel="很差"
                            rightLabel="很好"
                            emoji={['😢', '😔', '😐', '🙂', '😄']}
                        />

                        <WellnessSlider
                            label="壓力水準"
                            value={stressLevel}
                            onChange={setStressLevel}
                            leftLabel="壓力很大"
                            rightLabel="無壓力"
                            emoji={['🤯', '😰', '😐', '😌', '🧘']}
                        />

                        <WellnessSlider
                            label="肌肉痠痛"
                            value={muscleSoreness}
                            onChange={setMuscleSoreness}
                            leftLabel="非常痠痛"
                            rightLabel="完全不痛"
                            emoji={['🔥', '😖', '😐', '👍', '✨']}
                        />
                    </div>

                    {/* sRPE 與訓練時長 */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            訓練負荷 (選填)
                        </h4>

                        <div className="space-y-2">
                            <Label>sRPE 訓練強度感受</Label>
                            <div className="space-y-2">
                                <Slider
                                    value={srpeScore !== null ? [srpeScore] : [0]}
                                    onValueChange={(values) => setSrpeScore(values[0])}
                                    min={0}
                                    max={10}
                                    step={1}
                                />
                                <div className="text-center">
                                    <span className="text-sm font-medium">
                                        {srpeScore !== null ? srpeLabels[srpeScore] : '滑動選擇'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="training_minutes">訓練時長 (分鐘)</Label>
                            <Input
                                id="training_minutes"
                                type="number"
                                placeholder="例如: 90"
                                min={0}
                                max={300}
                                value={trainingMinutes}
                                onChange={(e) => setTrainingMinutes(e.target.value)}
                                className="max-w-[150px]"
                            />
                        </div>
                    </div>

                    {/* 提交按鈕 */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={submitMutation.isPending}
                        >
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    提交中...
                                </>
                            ) : showSuccess ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    提交成功！
                                </>
                            ) : existingRecord ? (
                                '更新今日回報'
                            ) : (
                                '提交今日回報'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
