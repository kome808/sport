/**
 * Wellness 滑桿元件
 * 用於評估 1-5 分的主觀感受指標
 */

import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface WellnessSliderProps {
    label: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    emoji?: string[];
}

const defaultEmojis = ['😫', '😔', '😐', '🙂', '😄'];

export default function WellnessSlider({
    label,
    description,
    value,
    onChange,
    leftLabel,
    rightLabel,
    emoji = defaultEmojis,
}: WellnessSliderProps) {
    const currentEmoji = emoji[value - 1] || emoji[2];

    return (
        <div className="space-y-3">
            {/* 標題與 Emoji */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium">{label}</label>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <span className="text-2xl" role="img" aria-label={`評分 ${value}`}>
                    {currentEmoji}
                </span>
            </div>

            {/* 滑桿 */}
            <Slider
                value={[value]}
                onValueChange={(values) => onChange(values[0])}
                min={1}
                max={5}
                step={1}
                className={cn(
                    'w-full',
                    value <= 2 && '[&_[role=slider]]:bg-risk-red',
                    value === 3 && '[&_[role=slider]]:bg-risk-yellow',
                    value >= 4 && '[&_[role=slider]]:bg-risk-green'
                )}
            />

            {/* 左右標籤 */}
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{leftLabel}</span>
                <span className="font-medium text-foreground">{value}/5</span>
                <span>{rightLabel}</span>
            </div>
        </div>
    );
}
