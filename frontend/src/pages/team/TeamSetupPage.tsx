/**
 * 球隊初始化設定頁面
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, SCHEMA_NAME } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// 運動項目選項
const sportTypes = [
    { value: 'baseball', label: '⚾ 棒球' },
    { value: 'basketball', label: '🏀 籃球' },
    { value: 'volleyball', label: '🏐 排球' },
    { value: 'soccer', label: '⚽ 足球' },
    { value: 'softball', label: '🥎 壘球' },
    { value: 'other', label: '🏃 其他' },
];

// 表單驗證 Schema
const teamSetupSchema = z.object({
    name: z.string().min(2, '球隊名稱至少需要 2 個字元'),
    slug: z
        .string()
        .min(3, 'URL 代碼至少需要 3 個字元')
        .max(30, 'URL 代碼最多 30 個字元')
        .regex(/^[a-z0-9-]+$/, '只能使用小寫英文、數字和連字號'),
    sportType: z.string().min(1, '請選擇運動項目'),
});

type TeamSetupFormData = z.infer<typeof teamSetupSchema>;

export default function TeamSetupPage() {
    const navigate = useNavigate();
    const { coach } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TeamSetupFormData>({
        resolver: zodResolver(teamSetupSchema),
        defaultValues: {
            sportType: 'baseball',
        },
    });

    const slug = watch('slug', '');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: TeamSetupFormData) => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            // 1. 建立球隊
            const { data: teamData, error: teamError } = await supabase
                .schema(SCHEMA_NAME)
                .from('teams')
                .insert({
                    coach_id: coach?.id,
                    name: data.name,
                    slug: data.slug,
                    sport_type: data.sportType,
                })
                .select()
                .limit(1);

            if (teamError) {
                if (teamError.message.includes('duplicate key') || teamError.message.includes('unique')) {
                    setErrorMessage('此 URL 代碼已被使用，請換一個');
                } else {
                    setErrorMessage(teamError.message);
                }
                setIsLoading(false);
                return;
            }

            const newTeam = teamData?.[0];
            if (!newTeam) {
                setErrorMessage('建立球隊失敗');
                setIsLoading(false);
                return;
            }

            // 2. 將教練設為球隊擁有者
            const { error: memberError } = await supabase
                .schema(SCHEMA_NAME)
                .from('team_members')
                .insert({
                    team_id: newTeam.id,
                    coach_id: coach?.id,
                    role: 'owner',
                });

            if (memberError) {
                console.error('建立球隊成員失敗:', memberError);
            }

            // 導向儀表板
            navigate(`/${data.slug}`);
        } catch (error) {
            console.error('建立球隊錯誤:', error);
            setErrorMessage('連線錯誤，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
            <div className="w-full" style={{ maxWidth: '32rem' }}>
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">建立您的球隊</CardTitle>
                        <CardDescription>
                            設定球隊資訊，開始使用訓練管理系統
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6 py-4">
                            {/* 錯誤訊息 */}
                            {errorMessage && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {errorMessage}
                                </div>
                            )}

                            {/* 隊徽上傳 */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="隊徽預覽" className="h-full w-full object-cover" />
                                        ) : (
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">點擊上傳隊徽 (選填)</p>
                            </div>

                            {/* 球隊名稱 */}
                            <div className="space-y-2">
                                <Label htmlFor="name">球隊名稱</Label>
                                <Input
                                    id="name"
                                    placeholder="例：台北棒球隊"
                                    {...register('name')}
                                    disabled={isLoading}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* URL 代碼 */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">球隊 URL 代碼</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        domain.com/
                                    </span>
                                    <Input
                                        id="slug"
                                        placeholder="taipei-baseball"
                                        {...register('slug')}
                                        disabled={isLoading}
                                        className="flex-1"
                                    />
                                </div>
                                {slug && !errors.slug && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Check className="h-3 w-3 text-green-600" />
                                        球隊網址將會是: domain.com/{slug}
                                    </p>
                                )}
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                                )}
                            </div>

                            {/* 運動項目 */}
                            <div className="space-y-2">
                                <Label>運動項目</Label>
                                <Select
                                    defaultValue="baseball"
                                    onValueChange={(value) => setValue('sportType', value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="選擇運動項目" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sportTypes.map((sport) => (
                                            <SelectItem key={sport.value} value={sport.value}>
                                                {sport.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.sportType && (
                                    <p className="text-sm text-destructive">{errors.sportType.message}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="pb-6 pt-0">
                            <Button type="submit" className="w-full bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                建立球隊
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
