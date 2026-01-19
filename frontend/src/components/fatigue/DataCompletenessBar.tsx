import type { DataCompleteness } from '@/types/fatigue';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataCompletenessBarProps {
    completeness: DataCompleteness;
    className?: string;
}

export function DataCompletenessBar({ completeness, className }: DataCompletenessBarProps) {
    const { filled, total, missing } = completeness;
    const isComplete = filled === total;
    const percentage = Math.round((filled / total) * 100);

    return (
        <div className={cn("p-3 rounded-lg border bg-card/50 text-card-foreground", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="font-semibold text-sm">
                        數據完整度
                    </span>
                </div>
                <span className={cn(
                    "text-sm font-mono font-bold",
                    isComplete ? "text-green-600" : "text-amber-600"
                )}>
                    {filled}/{total} 項
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                    className={cn(
                        "h-full transition-all duration-500 ease-out",
                        isComplete ? "bg-green-500" : "bg-amber-400"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Missing Fields Text */}
            {!isComplete && missing.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                    缺漏：
                    <span className="text-amber-600 font-medium">
                        {missing.join(', ')}
                    </span>
                </div>
            )}

            {isComplete && (
                <div className="text-xs text-green-600/80 mt-1">
                    ✅ 所有關鍵指標已建立
                </div>
            )}
        </div>
    );
}
