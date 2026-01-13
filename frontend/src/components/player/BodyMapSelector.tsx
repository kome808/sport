import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BODY_PATHS } from './BodyMapPaths';

interface BodyMapSelectorProps {
    selectedPart: string;
    onSelect: (part: string) => void;
    className?: string;
}

export default function BodyMapSelector({ selectedPart, onSelect, className }: BodyMapSelectorProps) {

    const handleSelect = (partId: string) => {
        onSelect(partId);
    };

    const frontPaths = BODY_PATHS.filter(p => p.view === 'front');
    const backPaths = BODY_PATHS.filter(p => p.view === 'back');

    const renderPath = (part: typeof BODY_PATHS[0]) => {
        const effectiveId = (part as any).alias || part.id;
        const isSelected = selectedPart === effectiveId;

        return (
            <Tooltip key={part.id} delayDuration={0}>
                <TooltipTrigger asChild>
                    <path
                        d={part.d}
                        fill={isSelected ? "#ef4444" : "#e5e7eb"}
                        stroke={isSelected ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className={cn(
                            "transition-colors cursor-pointer outline-none",
                            isSelected ? "fill-red-500" : "hover:fill-red-200"
                        )}
                        onClick={() => handleSelect(effectiveId)}
                    />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    {part.name}
                </TooltipContent>
            </Tooltip>
        );
    };

    return (
        <TooltipProvider>
            <div className={cn("grid grid-cols-2 gap-4 select-none", className)}>
                {/* Front View */}
                <Card className="p-4 flex flex-col items-center cursor-pointer hover:bg-muted/10 transition-colors">
                    <h4 className="mb-2 font-medium text-sm text-foreground/70">正面</h4>
                    {/* ViewBox adjusted to fit new paths (Width ~150, Height ~300) */}
                    <svg viewBox="50 0 100 300" className="w-full h-auto max-h-[300px]">
                        {frontPaths.map(renderPath)}
                    </svg>
                </Card>

                {/* Back View */}
                <Card className="p-4 flex flex-col items-center cursor-pointer hover:bg-muted/10 transition-colors">
                    <h4 className="mb-2 font-medium text-sm text-foreground/70">背面</h4>
                    <svg viewBox="50 0 100 300" className="w-full h-auto max-h-[300px]">
                        {backPaths.map(renderPath)}
                    </svg>
                </Card>
            </div>
        </TooltipProvider>
    );
}
