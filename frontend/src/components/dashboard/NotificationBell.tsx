import { useState } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types';

export default function NotificationBell() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id;

    const { data: notifications = [] } = useNotifications(userId);
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllReadMutation = useMarkAllNotificationsAsRead();
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = () => {
        if (userId) {
            markAllReadMutation.mutate(userId);
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'danger':
                return <AlertCircle className="h-4 w-4 text-destructive" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-warning" />;
            case 'info':
            default:
                return <Info className="h-4 w-4 text-primary" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center animate-in zoom-in">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        警訊中心
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">通知</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                            disabled={markAllReadMutation.isPending}
                        >
                            <Check className="mr-1 h-3 w-3" />
                            全部已讀
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">目前沒有通知</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`
                                        flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors
                                        ${notification.is_read ? 'opacity-60' : 'bg-primary/5'}
                                    `}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="mt-0.5 flex-shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm ${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhTW })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="flex-shrink-0 self-center">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => navigate('/notifications')}>
                        查看全部
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
