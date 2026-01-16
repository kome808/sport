import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Zone {
    max: number;
    color: string;
    label: string;
}

interface MetricGaugeProps {
    value: number;
    min: number;
    max: number;
    zones: Zone[];
    label?: string;
    icon?: React.ReactNode;
    unit?: string;
    helpText?: string;
    className?: string;
    showValue?: boolean;
}

export default function MetricGauge({
    value,
    min,
    max,
    zones,
    label,
    icon,
    unit = '',
    helpText,
    className,
    showValue = true,
}: MetricGaugeProps) {
    // 計算百分比位置
    const getPercentage = (val: number) => {
        const percentage = ((val - min) / (max - min)) * 100;
        return Math.min(Math.max(percentage, 0), 100);
    };

    const currentPercentage = getPercentage(value);

    // 取得當前區間顏色 (find color where value <= max)
    const currentColor = zones.find((z) => value <= z.max)?.color || zones[zones.length - 1].color;

    return (
        <div className={cn("w-full space-y-2", className)}>
            {(label || icon) && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        {icon && <span className="text-primary">{icon}</span>}
                        {label}
                        {helpText && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-3.5 w-3.5 text-slate-400 hover:text-primary transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{helpText}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    {showValue && (
                        <div className="text-base font-extrabold flex items-baseline gap-1" style={{ color: currentColor }}>
                            {value} <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{unit}</span>
                        </div>
                    )}
                </div>
            )}

            {/* 進度條容器 */}
            <div className="relative h-4 w-full rounded-full bg-slate-200/80 shadow-inner overflow-hidden flex border border-slate-300/30">
                {/* 
                  多段顏色背景: 
                  如果要顯示固定底色區間，可以用多個 div。
                  但這裡我們採用單純的進度條，但顏色隨數值變化。
                  或者顯示區間刻度？
                  目前採用：單一進度條，顏色隨數值變，且底圖顯示區間。
                */}

                {/* 區間底色 (Optional: 如果想要顯示分段，可以疊加一層，但簡單點就只顯示當前的 bar) */}
                {/* 這裡示範：顯示一個完整的 Bar 代表當前值 */}
                <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                        width: `${currentPercentage}%`,
                        backgroundColor: currentColor
                    }}
                />
            </div>

            {/* 刻度標示 (Optional) */}
            <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1">
                <span>{min}</span>
                {zones.slice(0, -1).map(z => (
                    <span key={z.max} style={{ left: `${getPercentage(z.max)}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
                        {z.max}
                    </span>
                ))}
                <span>{max}</span>
            </div>
        </div>
    );
}
