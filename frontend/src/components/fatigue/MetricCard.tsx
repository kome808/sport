import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    status: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
    description?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    onInfoClick?: () => void;
    className?: string;
    children?: React.ReactNode;
    centerValue?: boolean;
}

export default function MetricCard({
    title,
    value,
    status,
    description,
    icon,
    onClick,
    onInfoClick,
    className,
    children,
    centerValue
}: MetricCardProps) {
    const statusColors = {
        green: 'text-green-500 bg-green-500/10 border-green-200',
        yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-200',
        orange: 'text-orange-600 bg-orange-500/10 border-orange-200',
        red: 'text-red-600 bg-red-500/10 border-red-200',
        gray: 'text-slate-600 bg-slate-100 border-transparent',
    };

    const statusBorder = {
        green: 'border-l-4 border-l-green-500',
        yellow: 'border-l-4 border-l-yellow-500',
        orange: 'border-l-4 border-l-orange-500',
        red: 'border-l-4 border-l-red-500',
        gray: 'border-l-4 border-l-gray-300',
    };

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
                "hover:-translate-y-1 bg-card border border-border",
                statusBorder[status],
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {icon && <div className={cn("p-2 rounded-lg shadow-sm font-bold", statusColors[status])}>{icon}</div>}
                        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
                        {onInfoClick && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] font-black text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg ml-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInfoClick();
                                }}
                            >
                                指標說明
                            </Button>
                        )}
                    </div>
                    {status !== 'gray' && (
                        <div className={cn("h-3 w-3 rounded-full shadow-sm ring-2 ring-white", statusColors[status].split(' ')[0].replace('text-', 'bg-'))} />
                    )}
                </div>

                <div className={cn(
                    "flex items-baseline gap-2 mt-1",
                    centerValue && "justify-center flex-col items-center mt-3"
                )}>
                    <span className={cn(
                        "text-3xl font-black tracking-tight",
                        statusColors[status].split(' ')[0],
                        centerValue && "text-4xl"
                    )}>
                        {value}
                    </span>
                    {description && (
                        <span className={cn(
                            "text-xs text-slate-500 font-bold line-clamp-1",
                            centerValue && "mt-1"
                        )}>
                            {description}
                        </span>
                    )}
                </div>

                {children}

                {onClick && (
                    <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
