import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MetricCardProps {
    title: string;
    value: string | number;
    status: 'green' | 'yellow' | 'orange' | 'red' | 'black' | 'gray';
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
        green: 'text-status-low-dark bg-status-low/10 border-status-low/20',
        yellow: 'text-status-med-dark bg-status-med/10 border-status-med/20',
        orange: 'text-status-med-dark bg-status-med/10 border-status-med/20',
        red: 'text-status-high-dark bg-status-high/10 border-status-high/20',
        black: 'text-white bg-slate-900 border-slate-950',
        gray: 'text-slate-600 bg-slate-100 border-transparent',
    };

    const statusBorder = {
        green: 'border-l-4 border-l-status-low',
        yellow: 'border-l-4 border-l-status-med',
        orange: 'border-l-4 border-l-status-med',
        red: 'border-l-4 border-l-status-high',
        black: 'border-l-4 border-l-slate-950',
        gray: 'border-l-4 border-l-slate-300',
    };

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 cursor-pointer min-h-[180px] flex flex-col h-full",
                "hover:-translate-y-0.5 border-2",
                status === 'green' ? "bg-status-low/5 border-status-low/10" :
                    status === 'yellow' || status === 'orange' ? "bg-status-med/5 border-status-med/10" :
                        status === 'red' ? "bg-status-high/5 border-status-high/10" :
                            status === 'black' ? "bg-slate-900 border-slate-950" :
                                "bg-slate-50/50 border-slate-200",
                statusBorder[status],
                className
            )}
            onClick={onClick}
        >
            <CardContent className="px-5 py-4 flex flex-col h-full gap-2">
                {/* Header: Title and Info Button (Far Right) */}
                <div className="flex justify-between items-center mb-1 min-h-[32px]">
                    <div className="flex items-center gap-2">
                        {icon && <div className={cn("p-1.5 rounded-lg shadow-sm font-bold", statusColors[status])}>{icon}</div>}
                        <h3 className="font-black text-sm text-slate-800 tracking-tight uppercase">{title}</h3>
                    </div>
                    {onInfoClick && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-6 px-2 text-[10px] font-black rounded-lg transition-all",
                                status === 'black'
                                    ? "text-white border-white/20 hover:bg-white/10 hover:border-white/40"
                                    : "text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onInfoClick();
                            }}
                        >
                            指標說明
                        </Button>
                    )}
                </div>

                {(value !== "" || description) && (
                    <div className={cn(
                        "flex flex-col flex-1 relative gap-1",
                        centerValue ? "items-center justify-center" : "items-start pt-1"
                    )}>
                        <div className={cn("flex flex-col", centerValue ? "items-center" : "items-start")}>
                            {value !== "" && (
                                <span className={cn(
                                    "text-4xl font-black tracking-tighter leading-none",
                                    statusColors[status].split(' ')[0],
                                    centerValue && "text-5xl"
                                )}>
                                    {value}
                                </span>
                            )}
                            {description && (
                                <span className={cn(
                                    "text-xs text-slate-500 font-black uppercase tracking-wider mt-1.5",
                                    (status === 'black' || centerValue) ? "text-slate-400" : "text-slate-500",
                                    centerValue && "text-base text-slate-600"
                                )}>
                                    {description}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Additional Content (Gauges, Progress Bars) */}
                {children}
            </CardContent>
        </Card>
    );
}
