import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { usePlayer } from '@/hooks/usePlayer';
import BodyMapSelector from '@/components/player/BodyMapSelector';

export default function PlayerReportPage() {
    const { teamSlug, playerId } = useParams<{ teamSlug: string; playerId: string }>();
    const navigate = useNavigate();
    const { data: player, isLoading } = usePlayer(playerId);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // TODO: Implement submit logic
            console.log('Submitting report...', {
                date: selectedDate,
                rhr,
                wellness,
                trainingDuration: parseInt(trainingHours) * 60 + parseInt(trainingMinutes),
                trainingIntensity,
                selectedBodyPart,
                painScore,
                description,
                illnessType,
                illnessDescription,
                doctorNote,
                feedback
            });

            // Return after successful submission
            navigate(`/${teamSlug}/p/${playerId}/dashboard`);
        } catch (error) {
            console.error('Submit failed:', error);
            alert('提交失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        return `${month}月${day}日 (${weekday})`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F7]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F7] py-8 px-4">
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

                {/* Tabs for different sections */}
                <Tabs defaultValue="training" className="w-full">
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
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">❤️</span>
                                    <h3 className="font-bold text-xl">晨間心跳 RHR</h3>
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
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🧠</span>
                                    <h3 className="font-bold text-xl">身心狀態 Wellness</h3>
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
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🏃</span>
                                    <h3 className="font-bold text-xl">今日訓練負荷 sRPE</h3>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>訓練時間</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={trainingHours}
                                                        onChange={(e) => setTrainingHours(e.target.value)}
                                                        className="h-12 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-3 text-slate-400 text-sm">時</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="59"
                                                        value={trainingMinutes}
                                                        onChange={(e) => setTrainingMinutes(e.target.value)}
                                                        className="h-12 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-3 text-slate-400 text-sm">分</span>
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
                                    onSelect={setSelectedBodyPart}
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
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg shadow-primary/20 font-black h-14 text-lg rounded-2xl"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            提交中...
                        </>
                    ) : (
                        '提交回報'
                    )}
                </Button>
            </div>
        </div >
    );
}
