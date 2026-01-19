import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Lock } from "lucide-react";

export type ProfileDialogMode = 'profile' | 'email' | 'password';

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: ProfileDialogMode;
    onSuccess?: () => void;
}

export function UserProfileDialog({ open, onOpenChange, mode = 'profile', onSuccess }: UserProfileDialogProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 載入當前使用者資料
    useEffect(() => {
        if (open) {
            const fetchUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setEmail(user.email || "");
                    setFullName(user.user_metadata?.full_name || "");
                }
            };
            if (mode !== 'password') {
                fetchUser();
            }
            setPassword(""); // 重置密碼欄位
            setMessage(null);
        }
    }, [open, mode]);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);

        try {
            let updates: any = {};

            if (mode === 'profile') {
                updates = { data: { full_name: fullName } };
            } else if (mode === 'email') {
                updates = { email: email };
            } else if (mode === 'password') {
                updates = { password: password };
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            let successMsg = '資料更新成功！';
            if (mode === 'email') successMsg = '確認信已寄出，請至新信箱驗證以完成更換。';
            if (mode === 'password') successMsg = '密碼修改成功，下次登入請使用新密碼。';

            setMessage({ type: 'success', text: successMsg });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Update profile error:", error);
            setMessage({ type: 'error', text: error.message || '更新失敗' });
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'profile': return '修改基本資料';
            case 'email': return '更換 Email';
            case 'password': return '修改密碼';
            default: return '編輯個人資料';
        }
    };

    const getDescription = () => {
        switch (mode) {
            case 'profile': return '更新您的顯示名稱。';
            case 'email': return '更新登入用的 Email 地址。';
            case 'password': return '設定一組新的登入密碼。';
            default: return '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>
                        {getDescription()}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {mode === 'profile' && (
                        <div className="space-y-2">
                            <Label htmlFor="name">姓名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-9"
                                    placeholder="請輸入姓名"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'email' && (
                        <div className="space-y-2">
                            <Label htmlFor="email">新 Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'password' && (
                        <div className="space-y-2">
                            <Label htmlFor="password">新密碼</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="請輸入新密碼"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`text-sm font-medium mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        確認變更
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
