import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// 部位代碼映射
export type BodyPartId =
    | 'shoulder_l' | 'shoulder_r'
    | 'arm_l' | 'arm_r'
    | 'elbow_l' | 'elbow_r'
    | 'wrist_l' | 'wrist_r'
    | 'hip_l' | 'hip_r'
    | 'thigh_l' | 'thigh_r'
    | 'knee_l' | 'knee_r'
    | 'ankle_l' | 'ankle_r'
    | 'core_front' | 'back_upper' | 'back_lower'
    | 'head' | 'neck';

interface BodyMapSelectorProps {
    selectedPart: string;
    onSelect: (part: string) => void;
    className?: string;
}

const BODY_PARTS_FRONT = [
    { id: 'head', name: '頭部', d: 'M100,50 A20,20 0 1,1 100,10 Z' },
    { id: 'neck', name: '頸部', d: 'M90,50 L90,60 L110,60 L110,50 Z' },
    // Shoulder (L: Right side of image, R: Left side of image) - This is confusing. 
    // Standard medical anatomical view: Patient's Right is Viewer's Left.
    // We will assume "L" means Patient's Left (Viewer's Right).
    { id: 'shoulder_r', name: '右肩', d: 'M90,60 L70,60 L65,80 L90,80 Z' },
    { id: 'shoulder_l', name: '左肩', d: 'M110,60 L130,60 L135,80 L110,80 Z' },

    { id: 'arm_r', name: '右上臂', d: 'M65,80 L60,110 L85,110 L90,80 Z' },
    { id: 'arm_l', name: '左上臂', d: 'M135,80 L140,110 L115,110 L110,80 Z' },

    { id: 'elbow_r', name: '右肘', d: 'M60,110 L60,125 L85,125 L85,110 Z' },
    { id: 'elbow_l', name: '左肘', d: 'M140,110 L140,125 L115,125 L115,110 Z' },

    { id: 'wrist_r', name: '右手腕', d: 'M60,125 L55,150 L80,150 L85,125 Z' },
    { id: 'wrist_l', name: '左手腕', d: 'M140,125 L145,150 L120,150 L115,125 Z' },

    { id: 'core_front', name: '腹部/核心', d: 'M90,60 L110,60 L110,130 L90,130 Z' },

    { id: 'hip_r', name: '右髖', d: 'M90,130 L75,130 L75,155 L100,155 L100,130 Z' },
    { id: 'hip_l', name: '左髖', d: 'M110,130 L125,130 L125,155 L100,155 L100,130 Z' },

    { id: 'thigh_r', name: '右大腿', d: 'M75,155 L75,200 L100,200 L100,155 Z' },
    { id: 'thigh_l', name: '左大腿', d: 'M125,155 L125,200 L100,200 L100,155 Z' },

    { id: 'knee_r', name: '右膝', d: 'M75,200 L75,220 L100,220 L100,200 Z' },
    { id: 'knee_l', name: '左膝', d: 'M125,200 L125,220 L100,220 L100,200 Z' },

    { id: 'ankle_r', name: '右腳踝', d: 'M75,260 L75,280 L100,280 L100,260 Z' },
    { id: 'ankle_l', name: '左腳踝', d: 'M125,260 L125,280 L100,280 L100,260 Z' },
];

const BODY_PARTS_BACK = [
    { id: 'back_upper', name: '上背', d: 'M90,60 L110,60 L110,100 L90,100 Z' },
    { id: 'back_lower', name: '下背', d: 'M90,100 L110,100 L110,130 L90,130 Z' },
    // Legs back view (usually same as front but conceptually different)
    { id: 'thigh_r_back', alias: 'thigh_r', name: '右後腿', d: 'M75,155 L75,200 L100,200 L100,155 Z' },
    { id: 'thigh_l_back', alias: 'thigh_l', name: '左後腿', d: 'M125,155 L125,200 L100,200 L100,155 Z' },
];

// Combine simplified leg paths for the back view or reuse logic later
// For simplicity, we'll draw a similar stick figure approach.

export default function BodyMapSelector({ selectedPart, onSelect, className }: BodyMapSelectorProps) {

    const handleSelect = (partId: string) => {
        onSelect(partId);
    };

    return (
        <div className={cn("grid grid-cols-2 gap-4 select-none", className)}>
            {/* Front View */}
            <Card className="p-4 flex flex-col items-center cursor-pointer hover:bg-muted/10 transition-colors">
                <h4 className="mb-2 font-medium text-sm text-foreground/70">正面</h4>
                <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[300px]">
                    {BODY_PARTS_FRONT.map((part) => (
                        <path
                            key={part.id}
                            d={part.d}
                            fill={selectedPart === part.id ? "#ef4444" : "#e5e7eb"}
                            stroke={selectedPart === part.id ? "#b91c1c" : "#9ca3af"}
                            strokeWidth="2"
                            className="hover:fill-red-200 transition-colors cursor-pointer"
                            onClick={() => handleSelect(part.id)}
                        />
                    ))}
                    {/* Shin/Calf Front (Manual add for gap filling) */}
                    <path
                        d="M75,220 L75,260 L100,260 L100,220 Z"
                        fill={selectedPart === 'calf_r' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'calf_r' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('calf_r')}
                    />
                    <path
                        d="M125,220 L125,260 L100,260 L100,220 Z"
                        fill={selectedPart === 'calf_l' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'calf_l' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('calf_l')}
                    />
                </svg>
            </Card>

            {/* Back View */}
            <Card className="p-4 flex flex-col items-center cursor-pointer hover:bg-muted/10 transition-colors">
                <h4 className="mb-2 font-medium text-sm text-foreground/70">背面</h4>
                <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[300px]">
                    {/* Head Back */}
                    <circle cx="100" cy="30" r="20" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />

                    {BODY_PARTS_BACK.map((part) => (
                        <path
                            key={part.id}
                            d={part.d}
                            fill={selectedPart === (part.alias || part.id) ? "#ef4444" : "#e5e7eb"}
                            stroke={selectedPart === (part.alias || part.id) ? "#b91c1c" : "#9ca3af"}
                            strokeWidth="2"
                            className="hover:fill-red-200 transition-colors cursor-pointer"
                            onClick={() => handleSelect(part.alias || part.id)}
                        />
                    ))}

                    {/* Shoulders Back */}
                    <path
                        d="M90,60 L70,60 L65,80 L90,80 Z"
                        fill={selectedPart === 'shoulder_r' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'shoulder_r' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        onClick={() => handleSelect('shoulder_r')}
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                    />
                    <path
                        d="M110,60 L130,60 L135,80 L110,80 Z"
                        fill={selectedPart === 'shoulder_l' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'shoulder_l' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        onClick={() => handleSelect('shoulder_l')}
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                    />

                    {/* Glutes / Hips Back */}
                    <path
                        d="M90,130 L75,130 L75,155 L100,155 L100,130 Z"
                        fill={selectedPart === 'hip_r' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'hip_r' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('hip_r')}
                    />
                    <path
                        d="M110,130 L125,130 L125,155 L100,155 L100,130 Z"
                        fill={selectedPart === 'hip_l' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'hip_l' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('hip_l')}
                    />

                    {/* Arms Back */}
                    <path d="M65,80 L60,110 L85,110 L90,80 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
                    <path d="M135,80 L140,110 L115,110 L110,80 Z" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />

                    {/* Calves Back */}
                    <path
                        d="M75,220 L75,260 L100,260 L100,220 Z"
                        fill={selectedPart === 'calf_r' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'calf_r' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('calf_r')}
                    />
                    <path
                        d="M125,220 L125,260 L100,260 L100,220 Z"
                        fill={selectedPart === 'calf_l' ? "#ef4444" : "#e5e7eb"}
                        stroke={selectedPart === 'calf_l' ? "#b91c1c" : "#9ca3af"}
                        strokeWidth="2"
                        className="hover:fill-red-200 transition-colors cursor-pointer"
                        onClick={() => handleSelect('calf_l')}
                    />
                </svg>
            </Card>
        </div>
    );
}
