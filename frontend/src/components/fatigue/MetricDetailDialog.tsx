import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface MetricDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    metricType: 'acwr' | 'psi' | 'rhr' | 'wellness' | 'srpe' | 'honesty' | null;
    data: any;
}

export default function MetricDetailDialog({
    open,
    onOpenChange,
    metricType,
    data
}: MetricDetailDialogProps) {
    if (!metricType) return null;

    const content = {
        acwr: {
            title: "急慢性訓練負荷比 ACWR",
            subtitle: "傷害風險的最大預測因子",
            meaning: "判斷訓練量是否突然增加（短期 vs 長期負荷比）",
            how: "短期負荷(7天) ÷ 長期負荷(28天) (需累積 7 天數據)",
            ranges: [
                { range: "0.80 - 1.30", status: "green", label: "安全 (Sweet Spot)", advice: "正常訓練" },
                { range: "1.31 - 1.49", status: "yellow", label: "注意", advice: "監測 3 天，避免劇烈增量" },
                { range: "1.50 - 1.99", status: "red", label: "高風險 (Danger Zone)", advice: "立即降量 30%，受傷風險增加 4.8 倍" },
                { range: "≥ 2.0", status: "purple", label: "極高風險", advice: "受傷風險是平時的 5-7 倍，需嚴格監控" },
                { range: "< 0.80", status: "yellow", label: "低負荷風險", advice: "負荷不足可能反而降低體能，增加未來受傷機率" },
                { range: "N/A", status: "gray", label: "尚無基準數據", advice: "需累積至少 7 天訓練數據才能計算" }
            ],
            science: "Williams et al. (2017): ACWR > 1.5 時，受傷風險顯著增加。"
        },
        psi: {
            title: "整體狀態指數 PSI",
            subtitle: "綜合今日恢復狀態",
            meaning: "綜合身心狀態與今日負荷，決定今日訓練強度的依據",
            how: "(Wellness分數 × 0.6) + (sRPE狀態分 × 0.4)",
            ranges: [
                { range: "80 - 100", status: "green", label: "優秀", advice: "身體狀態極佳，可進行高強度訓練" },
                { range: "60 - 79", status: "yellow", label: "中等", advice: "狀態尚可，維持正常訓練" },
                { range: "< 60", status: "red", label: "疲勞/不佳", advice: "建議降量或安排主動恢復" }
            ],
            science: "Tibana et al. (2019): 綜合監測能準確反映運動員的機能狀態 (r=0.88)。"
        },
        rhr: {
            title: "晨間心跳 RHR",
            subtitle: "生理疲勞指標",
            meaning: "反映自主神經系統的恢復狀態",
            how: "今日 RHR - 過去 7 天平均基準",
            ranges: [
                { range: "± 4 bpm", status: "green", label: "正常", advice: "恢復充足" },
                { range: "+ 5 bpm", status: "yellow", label: "高風險", advice: "訓練量降低 20%，可能是過度訓練前兆" },
                { range: "≥ + 10 bpm", status: "red", label: "嚴重風險", advice: "強制休息，與過度訓練症候群或生病高度相關" },
                { range: "N/A", status: "gray", label: "尚無基準數據", advice: "需累積至少 3 天數據建立基準線" }
            ],
            science: "Teo et al. (2016): RHR 的異常升高與過度訓練症候群 (OTS) 高度相關。"
        },
        wellness: {
            title: "身心狀態 Wellness",
            subtitle: "主觀恢復指標",
            meaning: "包含睡眠、疲勞、心情、壓力、痠痛的綜合評估 (Z-score)",
            how: "5 項指標總分 (滿分 50 分) 與個人基準比較",
            ranges: [
                { range: "Z-score > -1", status: "green", label: "良好", advice: "身心狀態穩定" },
                { range: "-1 > Z > -2", status: "yellow", label: "注意", advice: "需關注壓力源或睡眠品質" },
                { range: "Z-score < -2", status: "red", label: "高風險", advice: "可能需要教練面談或調整訓練" },
                { range: "下降 > 20%", status: "red", label: "顯著下滑", advice: "若資料不足 28 天，改採下降幅度警示" }
            ],
            science: "Saw et al. (2016): 主觀 Wellness 問卷比客觀血液指標更能預測訓練反應。"
        },
        srpe: {
            title: "今日訓練負荷 sRPE",
            subtitle: "內部訓練負荷",
            meaning: "量化訓練總體壓力與週變化",
            how: "RPE × 訓練時間 (計算週負荷變化率) (需上週累積 3 天數據)",
            ranges: [
                { range: "< 10%", status: "green", label: "穩定", advice: "負荷增加在安全範圍內" },
                { range: "10% - 15%", status: "yellow", label: "偏高", advice: "增量稍快，需留意疲勞累積" },
                { range: "> 15% 或 >1000AU", status: "red", label: "危險增量", advice: "負荷暴增，非接觸性受傷風險顯著提高" },
                { range: "N/A", status: "gray", label: "尚無基準數據", advice: "上週需累積至少 3 天數據才能計算變化率" }
            ],
            science: "Gabbett (2016): 週負荷增加超過 15% 會顯著增加受傷風險。"
        },
        honesty: {
            title: "數據誠實度警示 Honesty",
            subtitle: "回報真實性檢測",
            meaning: "偵測球員是否存在隱瞞疲勞、隨意作答或與過往趨勢不符的情況",
            how: "綜合指標極值比對 (例如 Wellness 極佳但 sRPE 極高)",
            ranges: [
                { range: "80 - 100", status: "green", label: "誠實度高", advice: "數據可信，直接參考分析結果" },
                { range: "60 - 79", status: "yellow", label: "輕微衝突", advice: "可能存在疲勞隱瞞，建議隨口確認" },
                { range: "< 60", status: "red", label: "嚴重預警", advice: "數據高度不符，應與球員進行個別面談" }
            ],
            science: "Taylor et al. (2022): 運動員隱瞞傷病的行為與主觀回報的異常分布有高度相關。"
        }
    };

    const info = content[metricType];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-green-100 text-green-800 border-green-200';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'red': return 'bg-red-100 text-red-800 border-red-200';
            case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {info.title}
                        {data && metricType === 'acwr' && (
                            <Badge className={data.acwr.risk_level === 'purple' ? 'bg-purple-500 hover:bg-purple-600' : ''} variant={data.acwr.risk_level === 'red' ? 'destructive' : 'outline'}>
                                當前: {data.acwr.acwr ?? 'N/A'}
                            </Badge>
                        )}
                        {data && metricType === 'psi' && (
                            <Badge variant={data.psi.status === 'red' ? 'destructive' : 'outline'}>
                                當前: {data.psi.psi_score}
                            </Badge>
                        )}
                        {data && metricType === 'honesty' && (
                            <Badge variant={data.honesty.conflict_type === 'severe' ? 'destructive' : 'outline'}>
                                當前: {data.honesty.honesty_score ?? 'N/A'}/100
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-foreground">
                        {info.subtitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 定義與計算 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <h4 className="font-bold mb-2 text-sm text-slate-800">指標意義</h4>
                            <p className="text-sm text-black font-medium">{info.meaning}</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-lg">
                            <h4 className="font-bold mb-2 text-sm text-slate-800">測量方式</h4>
                            <p className="text-sm text-black font-medium">{info.how}</p>
                        </div>
                    </div>

                    {/* 區間對照表 */}
                    <div>
                        <h4 className="font-semibold mb-3">數值區間與建議</h4>
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-2 font-bold text-slate-900 border-b">範圍</th>
                                        <th className="px-4 py-2 font-bold text-slate-900 border-b">狀態</th>
                                        <th className="px-4 py-2 font-bold text-slate-900 border-b">教練建議</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {info.ranges.map((row, idx) => (
                                        <tr key={idx} className={`border-t ${data && checkCurrentRange(metricType, data, row.range) ? "bg-muted/50" : ""}`}>
                                            <td className="px-4 py-2 font-mono text-xs">{row.range}</td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${getStatusColor(row.status)}`}>
                                                    {row.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-slate-900 font-medium">
                                                {row.advice}
                                                {data && checkCurrentRange(metricType, data, row.range) && (
                                                    <span className="ml-2 text-primary text-xs font-black whitespace-nowrap">👈 你的位置</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 科學依據 */}
                    <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm border border-blue-100">
                        <span className="font-bold mr-2">🔬 科學依據:</span>
                        {info.science}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function checkCurrentRange(type: string, data: any, rangeStr: string): boolean {
    if (!data) return false;

    // ACWR 檢查
    if (type === 'acwr') {
        const risk = data.acwr.risk_level;
        // Purple >= 2.0
        if (risk === 'purple' && rangeStr.includes('≥ 2.0')) return true;
        // Red 1.5 - 1.99
        if (risk === 'red' && rangeStr.includes('1.50')) return true;
        // Yellow (High) 1.3 - 1.49
        if (risk === 'yellow' && data.acwr.acwr >= 1.3 && rangeStr.includes('1.31')) return true;
        // Yellow (Low) < 0.8
        if (risk === 'yellow' && data.acwr.acwr < 0.8 && rangeStr.includes('< 0.80')) return true;
        // Green
        if (risk === 'green' && rangeStr.includes('0.80 - 1.30')) return true;
    }

    // Wellness 檢查
    else if (type === 'wellness') {
        const status = data.wellness?.status;
        const z = data.wellness?.z_score;

        // Z-score logic
        if (z !== null && z !== undefined) {
            if (z > -1 && rangeStr.includes('Z-score > -1')) return true;
            if (z <= -1 && z > -2 && rangeStr.includes('-1 > Z > -2')) return true;
            if (z <= -2 && rangeStr.includes('Z-score < -2')) return true;
        } else {
            // Fallback logic (20% drop)
            if (status === 'red' && rangeStr.includes('20%')) return true;
        }
    }

    // sRPE 檢查 (以 status 為主，因為有週變化和絕對值兩種條件)
    else if (type === 'srpe') {
        const status = data.srpe?.status;
        if (status === 'red' && rangeStr.includes('> 15%')) return true;
        if (status === 'yellow' && rangeStr.includes('10%')) return true;
        if (status === 'green' && rangeStr.includes('< 10%')) return true;
    }

    // RHR 檢查
    else if (type === 'rhr') {
        const diff = data.rhr?.difference ?? 0;
        if (diff >= 10 && rangeStr.includes('≥ + 10')) return true;
        if (diff >= 5 && diff < 10 && rangeStr.includes('+ 5')) return true;
        if (diff < 5 && rangeStr.includes('± 4')) return true;
    }

    // Honesty 檢查
    else if (type === 'honesty') {
        return checkHonestyRange(data, rangeStr);
    }
    return false;
}

function checkHonestyRange(data: any, rangeStr: string): boolean {
    const score = data.honesty?.honesty_score ?? 0;
    if (score >= 80 && rangeStr.includes('80')) return true;
    if (score >= 60 && score < 80 && rangeStr.includes('60')) return true;
    if (score < 60 && score > 0 && rangeStr.includes('<')) return true;
    return false;
}
