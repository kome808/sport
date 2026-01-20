import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    Trash2,
    Save,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTeam, useBatchAddPlayers } from '@/hooks/useTeam';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlayerRow {
    name: string;
    jersey_number: string;
    birth_date: string;
    height_cm: string;
    weight_kg: string;
    position: string;
}

const DEFAULT_ROWS_COUNT = 10;

export default function BatchAddPlayersPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const navigate = useNavigate();
    const { data: team } = useTeam(teamSlug || '');
    const batchAddPlayers = useBatchAddPlayers();

    const [rows, setRows] = useState<PlayerRow[]>(
        Array(DEFAULT_ROWS_COUNT).fill(null).map(() => ({
            name: '',
            jersey_number: '',
            birth_date: '',
            height_cm: '',
            weight_kg: '',
            position: '',
        }))
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (index: number, field: keyof PlayerRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const addRow = () => {
        setRows([...rows, {
            name: '',
            jersey_number: '',
            birth_date: '',
            height_cm: '',
            weight_kg: '',
            position: '',
        }]);
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!team?.id) return;

        // 過濾掉全空的列（必須有姓名才算一筆）
        const validPlayers = rows
            .filter(r => r.name.trim() !== '')
            .map(r => ({
                name: r.name.trim(),
                jersey_number: r.jersey_number.trim() || undefined,
                position: r.position.trim() || undefined,
                birth_date: r.birth_date || undefined,
                height_cm: r.height_cm ? parseFloat(r.height_cm) : undefined,
                weight_kg: r.weight_kg ? parseFloat(r.weight_kg) : undefined,
            }));

        if (validPlayers.length === 0) {
            setError('請至少填寫一位球員的姓名');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await batchAddPlayers.mutateAsync({
                team_id: team.id,
                players: validPlayers
            });
            navigate(`/${teamSlug}/players`);
        } catch (err: any) {
            console.error('Batch add failed:', err);
            setError(err.message || '儲存失敗，請檢查資料格式是否正確');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 rounded-xl text-black font-bold border-gray-300">
                    <ChevronLeft className="h-4 w-4" />
                    返回列表
                </Button>
                <h1 className="text-3xl font-black text-black">批次新增球員</h1>
                <div className="w-24" /> {/* Spacer */}
            </div>

            {error && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-bold">錯誤</AlertTitle>
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
            )}

            <Card className="rounded-3xl border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl font-bold text-black">球員資料表</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="rounded-2xl border border-muted overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[50px] text-black font-bold">#</TableHead>
                                    <TableHead className="min-w-[150px] text-black font-bold">姓名 (必填)</TableHead>
                                    <TableHead className="w-[100px] text-black font-bold">背號</TableHead>
                                    <TableHead className="w-[150px] text-black font-bold">出生日期</TableHead>
                                    <TableHead className="w-[100px] text-black font-bold">身高 (cm)</TableHead>
                                    <TableHead className="w-[100px] text-black font-bold">體重 (kg)</TableHead>
                                    <TableHead className="min-w-[120px] text-black font-bold">位置</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                        <TableCell className="font-black text-black">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.name}
                                                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                                placeholder="例: 王小明"
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.jersey_number}
                                                onChange={(e) => handleInputChange(index, 'jersey_number', e.target.value)}
                                                placeholder="例: 1"
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="date"
                                                value={row.birth_date}
                                                onChange={(e) => handleInputChange(index, 'birth_date', e.target.value)}
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={row.height_cm}
                                                onChange={(e) => handleInputChange(index, 'height_cm', e.target.value)}
                                                placeholder="180"
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={row.weight_kg}
                                                onChange={(e) => handleInputChange(index, 'weight_kg', e.target.value)}
                                                placeholder="75"
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={row.position}
                                                onChange={(e) => handleInputChange(index, 'position', e.target.value)}
                                                placeholder="例: 投手"
                                                className="border-gray-300 focus:border-primary rounded-xl font-bold text-black bg-white"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRow(index)}
                                                className="text-destructive hover:text-white hover:bg-destructive rounded-full transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                        <Button variant="outline" onClick={addRow} className="gap-2 rounded-xl h-12 px-6 font-black border-gray-400 text-black hover:bg-gray-100">
                            <Plus className="h-5 w-5" />
                            新增一行
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 rounded-xl h-12 px-10 font-black shadow-xl shadow-primary/20">
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            儲存所有球員
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
