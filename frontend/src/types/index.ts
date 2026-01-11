/**
 * 共用型別定義
 */

// 風險等級
export type RiskLevel = 'green' | 'yellow' | 'red' | 'black';

// 教練角色
export type CoachRole = 'owner' | 'admin' | 'member';

// 球員資料
export interface Player {
    id: string;
    team_id: string;
    name: string;
    jersey_number?: string;
    position?: string;
    birth_date?: string;
    height_cm?: number;
    weight_kg?: number;
    avatar_url?: string;
    password_hash?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// 球隊資料
export interface Team {
    id: string;
    coach_id: string;
    name: string;
    slug: string;
    logo_url?: string;
    sport_type: string;
    settings?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// 教練資料
export interface Coach {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

// 每日紀錄
export interface DailyRecord {
    id: string;
    player_id: string;
    record_date: string;
    rhr_bpm?: number;
    sleep_quality?: number;
    fatigue_level?: number;
    mood?: number;
    stress_level?: number;
    muscle_soreness?: number;
    wellness_total?: number;
    srpe_score?: number;
    training_minutes?: number;
    training_load_au?: number;
    acwr?: number;
    risk_level?: RiskLevel;
    created_at: string;
    updated_at: string;
}

// 疼痛回報
export interface PainReport {
    id: string;
    player_id: string;
    report_date: string;
    body_part: string;
    body_position?: { x: number; y: number };
    pain_level: number;
    pain_type?: 'acute' | 'chronic' | 'fatigue';
    description?: string;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
}

// 醫療紀錄
export interface MedicalRecord {
    id: string;
    player_id: string;
    reported_by: string;
    reported_by_type: 'coach' | 'player';
    record_date: string;
    diagnosis?: string;
    doctor_advice?: string;
    image_urls?: string[];
    follow_up_date?: string;
    created_at: string;
    updated_at: string;
}

// 通知
export interface Notification {
    id: string;
    team_id: string;
    player_id?: string;
    type: 'risk_alert' | 'pain_report' | 'medical_update';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// 認證狀態
export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    coach?: Coach;
    currentTeam?: Team;
}
