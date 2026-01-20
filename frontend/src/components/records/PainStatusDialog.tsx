import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type PainStatus = 'worse' | 'same' | 'better' | 'recovered';

interface PainStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: PainStatus) => void;
    bodyPartName: string;
}

export function PainStatusDialog({ isOpen, onClose, onConfirm, bodyPartName }: PainStatusDialogProps) {
    const [status, setStatus] = useState<PainStatus | ''>('');

    const handleConfirm = () => {
        if (status) {
            onConfirm(status as PainStatus);
            setStatus('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>有比較好嗎？</DialogTitle>
                    <DialogDescription>
                        請問您的 <span className="font-bold text-slate-900">{bodyPartName}</span> 目前狀況如何？
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RadioGroup value={status} onValueChange={(v) => setStatus(v as PainStatus)}>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => setStatus('worse')}>
                            <RadioGroupItem value="worse" id="worse" />
                            <Label htmlFor="worse" className="flex-1 cursor-pointer font-medium text-slate-900">更嚴重</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => setStatus('same')}>
                            <RadioGroupItem value="same" id="same" />
                            <Label htmlFor="same" className="flex-1 cursor-pointer font-medium text-slate-900">一樣</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => setStatus('better')}>
                            <RadioGroupItem value="better" id="better" />
                            <Label htmlFor="better" className="flex-1 cursor-pointer font-medium text-slate-900">有比較好</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => setStatus('recovered')}>
                            <RadioGroupItem value="recovered" id="recovered" />
                            <Label htmlFor="recovered" className="flex-1 cursor-pointer font-bold text-slate-900">已經好了</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>取消</Button>
                    <Button onClick={handleConfirm} disabled={!status}>確認</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
