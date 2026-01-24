import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePlayer, useSubmitDailyRecord, useSubmitPainReport, usePlayerRecordByDate, usePlayerPainReports, useResolvePainReport, usePlayerSession } from '@/hooks/usePlayer';
import BodyMapSelector from '@/components/player/BodyMapSelector';
import MetricDetailDialog from '@/components/fatigue/MetricDetailDialog';
import { type PainStatus } from '@/components/records/PainStatusDialog';
import { BODY_PATHS } from '@/components/player/BodyMapPaths';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ILLNESS_MAP: Record<string, string> = {
    'none': '無',
    'cold': '感冒',
    'fever': '發燒',
    'stomach': '腸胃不適',
    'headache': '頭痛',
    'other': '其他'
};

// Dynamically generate BODY_PART_MAP from BODY_PATHS
const BODY_PART_MAP = BODY_PATHS.reduce((acc, part) => {
    acc[part.id] = part.name;
    return acc;
}, {} as Record<string, string>);
// Add fallback for 'other'
BODY_PART_MAP['other'] = '其他部位';

export default function PlayerReportPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const navigate = useNavigate();
    const { data: player, isLoading } = usePlayer(playerId);
    const { session, isLoading: sessionLoading } = usePlayerSession();

    // 驗證登入
    useEffect(() => {
        if (!sessionLoading) {
            if (!session) {
                navigate(`/${teamSlug}/p/${playerId}/login`);
            } else if (player && session.playerId !== player.id) {
                // 如果已登入但不是這個球員（或 short_code 轉換還沒對上），也踢回去
                navigate(`/${teamSlug}/p/${playerId}/login`);
            }
        }
    }, [session, sessionLoading, player, teamSlug, playerId, navigate]);

    // Hooks for submission
    const submitDaily = useSubmitDailyRecord();
    const submitPain = useSubmitPainReport();
    const resolvePain = useResolvePainReport();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // Confirmation State
    const [tabValue, setTabValue] = useState('training');

    const handleQuickStatusUpdate = (status: PainStatus, report: any) => {
        if (status === 'recovered') {
            resolvePain.mutate({ reportId: report.id });
        } else {
            // Redirect to update form
            setSelectedBodyPart(report.body_part);
            setPainScore(report.pain_level);
            setDescription(report.description || '');

            // Switch to injury tab
            setTabValue('injury');

            // Scroll to injury section
            setTimeout(() => {
                // Try to find the "Selected Body Part" card (green background)
                const injuryCard = document.querySelector('.bg-green-50.border-green-200');

                if (injuryCard) {
                    injuryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Fallback: Scroll to Body Map Selector
                    // We look for the container with grid-cols-2 which BodyMapSelector uses
                    const bodyMap = document.querySelector('.grid.grid-cols-2.gap-4');
                    if (bodyMap) {
                        bodyMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 300); // Increased timeout to ensure render
        }
    };

    // Data Fetching Hooks (Moved after selectedDate declaration)
    const { data: dailyRecord } = usePlayerRecordByDate(player?.id, selectedDate);
    const { data: painReports } = usePlayerPainReports(player?.id);

    const activePainReports = painReports?.filter(r => !r.is_resolved) || [];

    // Form states
    const [rhr, setRhr] = useState('');
    const [wellness, setWellness] = useState({
        sleep: 5,
        stress: 5,
        fatigue: 5,
        soreness: 5,
        mood: 5
    });
    const [trainingHours, setTrainingHours] = useState('0');
    const [trainingMinutes, setTrainingMinutes] = useState('0');
    const [trainingIntensity, setTrainingIntensity] = useState('');
    const [selectedBodyPart, setSelectedBodyPart] = useState('');
    const [painScore, setPainScore] = useState(5);
    const [description, setDescription] = useState('');
    const [illnessType, setIllnessType] = useState('none');
    const [illnessDescription, setIllnessDescription] = useState('');
    const [doctorNote, setDoctorNote] = useState('');
    const [feedback, setFeedback] = useState('');

    // 指標說明彈窗狀態
    const [infoMetric, setInfoMetric] = useState<'rhr' | 'wellness' | 'srpe' | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const openInfo = (metric: 'rhr' | 'wellness' | 'srpe') => {
        setInfoMetric(metric);
        setIsInfoOpen(true);
    };

    useEffect(() => {
        // Reset form
        setRhr('');
        setWellness({ sleep: 5, stress: 5, fatigue: 5, soreness: 5, mood: 5 });
        setTrainingHours('0');
        setTrainingMinutes('0');
        setTrainingIntensity('');
        setFeedback('');
        setDoctorNote('');
        setIllnessType('none');
        setIllnessDescription('');
        setSelectedBodyPart('');
        setPainScore(5);
        setDescription('');

        if (dailyRecord) {
            setRhr(dailyRecord.rhr_bpm?.toString() || '');
            setWellness({
                sleep: dailyRecord.sleep_quality || 5,
                stress: dailyRecord.stress_level || 5,
                fatigue: dailyRecord.fatigue_level || 5,
                soreness: dailyRecord.muscle_soreness || 5,
                mood: dailyRecord.mood || 5
            });

            if (dailyRecord.training_minutes !== undefined) {
                const h = Math.floor(dailyRecord.training_minutes / 60);
                const m = dailyRecord.training_minutes % 60;
                setTrainingHours(h.toString());
                setTrainingMinutes(m >= 15 ? '30' : '0');
            }

            if (dailyRecord.srpe_score && dailyRecord.training_minutes) {
                const intensity = Math.round(dailyRecord.srpe_score / dailyRecord.training_minutes);
                setTrainingIntensity(intensity.toString());
            }

            if (dailyRecord.feedback) {
                let remaining = dailyRecord.feedback;
                const illMatch = remaining.match(/\[生病: (.*?)\] (.*?)(?=\n\n|$)/s);
                if (illMatch) {
                    const typeLabel = illMatch[1];
                    const key = Object.keys(ILLNESS_MAP).find(k => ILLNESS_MAP[k] === typeLabel) || 'other';
                    setIllnessType(key);
                    setIllnessDescription(illMatch[2]);
                    remaining = remaining.replace(illMatch[0], '').trim();
                }

                const docMatch = remaining.match(/\[醫囑\] (.*?)(?=\n\n|$)/s);
                if (docMatch) {
                    setDoctorNote(docMatch[1]);
                    remaining = remaining.replace(docMatch[0], '').trim();
                }

                setFeedback(remaining);
            }
        }

        if (painReports) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const report = painReports.find(r => r.report_date === dateStr);
            if (report) {
                setSelectedBodyPart(report.body_part);
                setPainScore(report.pain_level);
                setDescription(report.description || '');
            }
        }
    }, [dailyRecord, painReports, selectedDate]);

    const handleInitialSubmit = () => {
        // 驗證 sRPE：如果有填時間但沒選強度
        const hasTime = (parseInt(trainingHours) > 0 || parseInt(trainingMinutes) > 0);
        if (hasTime && !trainingIntensity) {
            alert('請選擇「今日訓練強度」，以免訓練負荷計算為 0');
            // 捲動到訓練負荷區域
            const srpeSection = document.getElementById('srpe-section');
            if (srpeSection) {
                srpeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsConfirming(true);
        window.scrollTo(0, 0);
    };

    const handleFinalSubmit = async () => {
        if (!player?.id) return;

        setIsSubmitting(true);
        try {
            // 1. Prepare Feedback String
            const feedbackParts = [];
            if (illnessType !== 'none') {
                feedbackParts.push(`[生病: ${ILLNESS_MAP[illnessType] || illnessType}] ${illnessDescription}`);
            }
            if (doctorNote) {
                feedbackParts.push(`[醫囑] ${doctorNote}`);
            }
            if (feedback) {
                feedbackParts.push(feedback);
            }
            const finalFeedback = feedbackParts.join('\n\n');

            // 2. Submit Daily Record
            await submitDaily.mutateAsync({
                player_id: player.id,
                record_date: format(selectedDate, 'yyyy-MM-dd'),
                rhr_bpm: rhr ? parseInt(rhr) : undefined,
                sleep_quality: wellness.sleep,
                fatigue_level: wellness.fatigue,
                stress_level: wellness.stress,
                mood: wellness.mood,
                muscle_soreness: wellness.soreness,
                srpe_score: trainingIntensity ? parseInt(trainingIntensity) : undefined,
                training_minutes: (parseInt(trainingHours) || 0) * 60 + (parseInt(trainingMinutes) || 0),
                feedback: finalFeedback
            });

            // 3. Submit Pain Report (if any)
            if (selectedBodyPart) {
                // Resolve superseded reports
                const existingReport = activePainReports.find(r => r.body_part === selectedBodyPart && !r.is_resolved);
                if (existingReport) {
                    await resolvePain.mutateAsync({ reportId: existingReport.id });
                }

                await submitPain.mutateAsync({
                    player_id: player.id,
                    report_date: format(selectedDate, 'yyyy-MM-dd'),
                    body_part: selectedBodyPart,
                    pain_level: painScore,
                    pain_type: 'fatigue', // Default to fatigue
                    description: description,
                    is_resolved: false
                });
            }

            // Success -> Navigate
            navigate(`/${teamSlug}/p/${playerId}/dashboard`);
        } catch (error: any) {
            console.error('Submit failed:', error);
            alert(`提交失敗: ${error.message || '請確認網路連線或稍後再試'} (Code: ${error.code || 'Unknown'})`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        return format(date, 'MM月dd日 (eee)', { locale: zhTW });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F7]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Confirmation View
    const renderConfirmation = () => (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setIsConfirming(false)}
                    className="rounded-2xl"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    返回修改
                </Button>
                <h1 className="text-2xl font-black text-slate-900">確認回報內容</h1>
                <div className="w-20" />
            </div>

            <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-700">基本資訊</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-slate-500 text-xs">回報日期</Label>
                            <p className="text-lg font-bold">{formatDate(selectedDate)}</p>
                        </div>
                        <div>
                            <Label className="text-slate-500 text-xs">RHR</Label>
                            <p className="text-lg font-bold">{rhr ? `${rhr} bpm` : '-'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-700">身心狀態 Wellness</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: '睡眠', val: wellness.sleep },
                            { label: '壓力', val: wellness.stress },
                            { label: '疲勞', val: wellness.fatigue },
                            { label: '痠痛', val: wellness.soreness },
                            { label: '心情', val: wellness.mood },
                        ].map((item) => (
                            <div key={item.label} className="bg-slate-50 p-3 rounded-xl text-center">
                                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                <p className={`text-xl font-black ${item.val <= 2 ? 'text-red-500' : 'text-slate-700'}`}>{item.val}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-700">訓練負荷</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-slate-500 text-xs">訓練時間</Label>
                            <p className="text-lg font-bold">{trainingHours} 時 {trainingMinutes} 分</p>
                        </div>
                        <div>
                            <Label className="text-slate-500 text-xs">訓練強度</Label>
                            <p className="text-lg font-bold">{trainingIntensity ? `Level ${trainingIntensity}` : '-'}</p>
                        </div>
                    </div>
                    {(parseInt(trainingHours) > 0 || parseInt(trainingMinutes) > 0) && trainingIntensity && (
                        <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                            <p className="text-xs text-slate-500">預估負荷 (sRPE)</p>
                            <p className="text-2xl font-black text-primary">
                                {(parseInt(trainingHours) * 60 + parseInt(trainingMinutes)) * parseInt(trainingIntensity)} AU
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedBodyPart && (
                <Card className="rounded-[2rem] border-2 border-red-100 shadow-lg overflow-hidden">
                    <CardHeader className="bg-red-50/50 border-b border-red-100">
                        <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            傷病回報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-500 text-xs">部位</Label>
                                <p className="text-lg font-bold">{BODY_PART_MAP[selectedBodyPart] || selectedBodyPart}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500 text-xs">疼痛指數</Label>
                                <div>
                                    <Badge className={cn(
                                        "mt-1 border-0",
                                        painScore >= 7 ? "bg-red-500" : painScore >= 4 ? "bg-amber-500" : "bg-green-500"
                                    )}>Level {painScore}</Badge>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-slate-500 text-xs">說明</Label>
                            <p className="text-base text-slate-700 mt-1">{description || '無'}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(illnessType !== 'none' || doctorNote || feedback) && (
                <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-700">其他回饋與備註</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {illnessType !== 'none' && (
                            <div>
                                <Label className="text-slate-500 text-xs">生病症狀</Label>
                                <p className="font-bold text-slate-900">{ILLNESS_MAP[illnessType] || illnessType}</p>
                                <p className="text-sm text-slate-600">{illnessDescription}</p>
                            </div>
                        )}
                        {doctorNote && (
                            <div>
                                <Label className="text-slate-500 text-xs">醫生評估</Label>
                                <p className="text-slate-700 whitespace-pre-wrap">{doctorNote}</p>
                            </div>
                        )}
                        {feedback && (
                            <div>
                                <Label className="text-slate-500 text-xs">其他回饋</Label>
                                <p className="text-slate-700 whitespace-pre-wrap">{feedback}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Demo Mode Button */}
            {teamSlug === 'doraemon-baseball' ? (
                <Button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 font-bold h-14 text-lg rounded-2xl border-2 border-slate-200"
                >
                    <Lock className="mr-2 h-5 w-5" />
                    展示模式 (無法送出)
                </Button>
            ) : (
                <Button
                    onClick={handleFinalSubmit}
                    className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg shadow-primary/20 font-black h-14 text-lg rounded-2xl"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            處理中...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            確認無誤，送出儲存
                        </>
                    )}
                </Button>
            )}
            <div className="h-8" />
        </div>
    );

    // Form View (Original)
    const renderForm = () => (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="rounded-2xl"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    返回
                </Button>
                <h1 className="text-2xl font-black text-slate-900">填寫每日回報</h1>
                <div className="w-20" /> {/* Spacer */}
            </div>

            {/* Date Selection */}
            <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant={selectedDate.toDateString() === yesterday.toDateString() ? "default" : "outline"}
                            onClick={() => setSelectedDate(yesterday)}
                            className="flex-1 h-16 rounded-xl font-bold text-base"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs opacity-70">昨天</span>
                                <span>{formatDate(yesterday)}</span>
                            </div>
                        </Button>
                        <Button
                            variant={selectedDate.toDateString() === today.toDateString() ? "default" : "outline"}
                            onClick={() => setSelectedDate(today)}
                            className="flex-1 h-16 rounded-xl font-bold text-base"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs opacity-70">今天</span>
                                <span>{formatDate(today)}</span>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>



            {/* Active Pain Reminder Card */}
            {activePainReports.length > 0 && (
                <Card className="rounded-[2rem] border-2 border-amber-200 bg-amber-50 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                            您有未解決的傷痛回報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                            {activePainReports.map(report => (
                                <div key={report.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700">{BODY_PART_MAP[report.body_part] || report.body_part}</span>
                                            <Badge variant="outline" className={cn(
                                                "border-0 text-white",
                                                report.pain_level >= 7 ? "bg-red-500" : report.pain_level >= 4 ? "bg-amber-500" : "bg-green-500"
                                            )}>
                                                疼痛指數 {report.pain_level}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-slate-700">有比較好嗎？</p>
                                        <RadioGroup
                                            onValueChange={(val) => handleQuickStatusUpdate(val as PainStatus, report)}
                                            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                                        >
                                            <div className="flex items-center space-x-2 border rounded-lg p-2 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value="worse" id={`worse-${report.id}`} />
                                                <Label htmlFor={`worse-${report.id}`} className="cursor-pointer">更嚴重</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-lg p-2 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value="same" id={`same-${report.id}`} />
                                                <Label htmlFor={`same-${report.id}`} className="cursor-pointer">一樣</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-lg p-2 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value="better" id={`better-${report.id}`} />
                                                <Label htmlFor={`better-${report.id}`} className="cursor-pointer">有比較好</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-lg p-2 hover:bg-slate-50 cursor-pointer">
                                                <RadioGroupItem value="recovered" id={`recovered-${report.id}`} />
                                                <Label htmlFor={`recovered-${report.id}`} className="cursor-pointer text-slate-900 font-bold">已經好了</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}



            {/* Tabs for different sections */}
            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1.5 bg-white/50 backdrop-blur-md rounded-[2rem] border border-slate-200/50 shadow-sm h-auto gap-2">
                    <TabsTrigger value="training" className="rounded-[1.5rem] py-3 data-[state=active]:!bg-[#7367F0] data-[state=active]:!text-white shadow-none transition-all font-black">
                        訓練負荷
                    </TabsTrigger>
                    <TabsTrigger value="injury" className="rounded-[1.5rem] py-3 data-[state=active]:!bg-[#7367F0] data-[state=active]:!text-white shadow-none transition-all font-black">
                        傷病回報
                    </TabsTrigger>
                </TabsList>

                {/* Training Load Tab */}
                <TabsContent value="training" className="space-y-6 mt-6">
                    {/* RHR Section */}
                    <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">❤️</span>
                                    <h3 className="font-bold text-xl">晨間心跳 RHR</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg"
                                    onClick={() => openInfo('rhr')}
                                    type="button"
                                >
                                    指標說明
                                </Button>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>心跳數值（次/分鐘）</Label>
                                <Input
                                    type="number"
                                    placeholder="例如：60"
                                    value={rhr}
                                    onChange={(e) => setRhr(e.target.value)}
                                    className="text-lg h-12"
                                />
                                <div className="bg-blue-50/50 rounded-xl p-4 mt-4 space-y-2 text-sm text-slate-600">
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">說明</span>
                                        請於每日早上起床後「坐起」或「平躺」時測量
                                    </p>
                                    <ul className="list-disc list-inside pl-1 space-y-1 text-xs opacity-80">
                                        <li>保持靜止狀態，測量一分鐘內的心跳次數</li>
                                        <li>若有穿戴手錶，可直接讀取「靜止心率」數據</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Wellness Section */}
                    <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🧠</span>
                                    <h3 className="font-bold text-xl">身心狀態 Wellness</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg"
                                    onClick={() => openInfo('wellness')}
                                    type="button"
                                >
                                    指標說明
                                </Button>
                            </div>
                            <Separator />
                            <div className="space-y-6">
                                {[
                                    { key: 'sleep', label: '睡眠品質', emoji: '😴' },
                                    { key: 'stress', label: '壓力程度', emoji: '😰' },
                                    { key: 'fatigue', label: '疲勞程度', emoji: '😫' },
                                    { key: 'soreness', label: '肌肉痠痛', emoji: '💪' },
                                    { key: 'mood', label: '心情狀態', emoji: '😊' }
                                ].map(({ key, label, emoji }) => (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="flex items-center gap-2 text-base">
                                                <span>{emoji}</span>
                                                {label}
                                            </Label>
                                            <span className="font-bold text-primary text-lg">{wellness[key as keyof typeof wellness]}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={wellness[key as keyof typeof wellness]}
                                            onChange={(e) => setWellness({ ...wellness, [key]: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>很差</span>
                                            <span>很好</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-blue-50/50 rounded-xl p-4 mt-6 space-y-2 text-sm text-slate-600">
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">說明</span>
                                        請根據您「目前當下」的真實感受進行評分
                                    </p>
                                    <ul className="list-disc list-inside pl-1 space-y-1 text-xs opacity-80">
                                        <li><span className="font-bold">1分 (很差)</span>：例如失眠、極度疲勞、壓力極大</li>
                                        <li><span className="font-bold">5分 (很好)</span>：例如睡眠充足、精神飽滿、心情愉悅</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Training Load Section */}
                    <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg">
                        <CardContent className="p-6 space-y-4" id="srpe-section">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🏃</span>
                                    <h3 className="font-bold text-xl">今日訓練負荷 sRPE</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg"
                                    onClick={() => openInfo('srpe')}
                                    type="button"
                                >
                                    指標說明
                                </Button>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>訓練時間</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Select value={trainingHours} onValueChange={setTrainingHours}>
                                                    <SelectTrigger className="h-12 w-full">
                                                        <SelectValue placeholder="0" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white max-h-[300px]">
                                                        {Array.from({ length: 13 }, (_, i) => i.toString()).map((val) => (
                                                            <SelectItem key={val} value={val}>{val}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <span className="absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">時</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Select value={trainingMinutes} onValueChange={setTrainingMinutes}>
                                                    <SelectTrigger className="h-12 w-full">
                                                        <SelectValue placeholder="0" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white">
                                                        <SelectItem value="0">0</SelectItem>
                                                        <SelectItem value="30">30</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <span className="absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">分</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>訓練強度 (RPE)</Label>
                                    <div className="h-12 w-full">
                                        <Select value={trainingIntensity} onValueChange={setTrainingIntensity}>
                                            <SelectTrigger className="h-full w-full">
                                                <SelectValue placeholder="選擇強度" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white max-h-[300px]">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                                    <SelectItem key={level} value={level.toString()}>
                                                        <span className="font-bold mr-2">{level}</span>
                                                        <span className="text-slate-500 text-xs">
                                                            {level === 1 && "非常輕鬆 (Very Light)"}
                                                            {level === 2 && "輕鬆 (Light)"}
                                                            {level === 3 && "中等 (Moderate)"}
                                                            {level === 4 && "有點累 (Somewhat Hard)"}
                                                            {level === 5 && "累 (Hard)"}
                                                            {level === 6 && "很累 (Hard+)"}
                                                            {level === 7 && "非常累 (Very Hard)"}
                                                            {level === 8 && "極度累 (Very Hard+)"}
                                                            {level === 9 && "接近極限 (Near Max)"}
                                                            {level === 10 && "竭盡全力 (Max)"}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            {(parseInt(trainingHours) > 0 || parseInt(trainingMinutes) > 0) && trainingIntensity && (
                                <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                                    <p className="text-sm text-slate-600 mb-1">訓練負荷</p>
                                    <p className="text-3xl font-black text-primary">
                                        {(parseInt(trainingHours) * 60 + parseInt(trainingMinutes)) * parseInt(trainingIntensity)} AU
                                    </p>
                                </div>
                            )}

                            <div className="bg-blue-50/50 rounded-xl p-4 mt-4 space-y-2 text-sm text-slate-600">
                                <p className="font-bold flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">說明</span>
                                    記錄「所有訓練」的總時間與平均強度
                                </p>
                                <ul className="list-disc list-inside pl-1 space-y-1 text-xs opacity-80">
                                    <li><span className="font-bold">訓練強度 (1-10)</span>：1 為非常輕鬆，10 為竭盡全力</li>
                                    <li><span className="font-bold">訓練負荷</span>：系統會自動計算 (時間 × 強度)</li>
                                </ul>
                            </div>

                            <div className="mt-8 flex items-center gap-3">
                                <span className="text-3xl">💬</span>
                                <h3 className="font-bold text-xl">其他回饋 (選填)</h3>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>有什麼想跟教練說的嗎？</Label>
                                <Textarea
                                    placeholder="例如：今天狀況不錯、想要調整訓練課表..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Injury Report Tab */}
                <TabsContent value="injury" className="space-y-6 mt-6">
                    <Card className="rounded-[2rem] border-2 border-slate-100 shadow-lg">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🏥</span>
                                <h3 className="font-bold text-xl">受傷回報</h3>
                            </div>
                            <Separator />
                            <p className="text-sm text-slate-500">點擊人體圖上的部位來標記受傷位置</p>
                            <BodyMapSelector
                                selectedPart={selectedBodyPart}
                                onSelect={(part) => setSelectedBodyPart(prev => prev === part ? '' : part)}
                            />
                            {selectedBodyPart && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 space-y-4">
                                    <p className="text-sm text-green-800">
                                        已選擇部位：<span className="font-bold">{selectedBodyPart}</span>
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>疼痛分數 (1-10)</Label>
                                            <span className="font-bold text-primary text-lg">{painScore}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={painScore}
                                            onChange={(e) => setPainScore(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>輕微</span>
                                            <span>劇烈</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>說明</Label>
                                        <Textarea
                                            placeholder="請描述疼痛的具體情況..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[80px] bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex items-center gap-3">
                                <span className="text-3xl">🤒</span>
                                <h3 className="font-bold text-xl">生病回報</h3>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>生病症狀</Label>
                                    <Select value={illnessType} onValueChange={setIllnessType}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="選擇症狀類型" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="none">無症狀</SelectItem>
                                            <SelectItem value="cold">感冒</SelectItem>
                                            <SelectItem value="fever">發燒</SelectItem>
                                            <SelectItem value="stomach">腸胃不適</SelectItem>
                                            <SelectItem value="headache">頭痛</SelectItem>
                                            <SelectItem value="other">其他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {illnessType !== 'none' && (
                                    <div className="space-y-2">
                                        <Label>症狀描述</Label>
                                        <Textarea
                                            placeholder="請描述具體症狀，例如：喉嚨痛、流鼻水..."
                                            value={illnessDescription}
                                            onChange={(e) => setIllnessDescription(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center gap-3">
                                <span className="text-3xl">👨‍⚕️</span>
                                <h3 className="font-bold text-xl">醫生評估 (選填)</h3>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>醫生建議與診斷</Label>
                                <Textarea
                                    placeholder="如果有看醫生，請記錄醫生的診斷和建議休養時間..."
                                    value={doctorNote}
                                    onChange={(e) => setDoctorNote(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <Button
                onClick={handleInitialSubmit}
                className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg shadow-primary/20 font-black h-14 text-lg rounded-2xl"
            >
                提交回報
            </Button>
            <div className="h-4" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F4F7] py-8 px-4">
            {isConfirming ? renderConfirmation() : renderForm()}
            <MetricDetailDialog
                open={isInfoOpen}
                onOpenChange={setIsInfoOpen}
                metricType={infoMetric}
                data={null}
            />
        </div >
    );
}
