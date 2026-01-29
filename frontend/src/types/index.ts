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
    short_code: string;  // 3 碼短代碼，用於簡化 URL
    status: 'active' | 'graduated';
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
    avatar_url?: string; // 新增
    logo_url?: string;
    sport_type: string;
    settings?: Record<string, unknown>;
    invitation_code?: string;
    is_invitation_enabled?: boolean;
    coach_invitation_code?: string;
    is_coach_invitation_enabled?: boolean;
    is_demo?: boolean;
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
    feedback?: string;
    created_at: string;
    updated_at: string;
}

export type DailyRecordInput = Partial<Omit<DailyRecord, 'created_at' | 'updated_at'>>;

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

export type PainReportInput = Partial<Omit<PainReport, 'id' | 'created_at' | 'updated_at'>> & { is_resolved?: boolean };

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
    user_id: string;
    team_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger';
    link?: string;
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

// 疲勞監測相關型別
// 疲勞監測相關型別 (Updated 2026-01-28 for new Schema)
export interface FatigueMetrics {
    acwr: {
        chronic_load: number;
        acute_load: number;
        acwr: number | null;
        risk_level: 'green' | 'yellow' | 'red' | 'purple' | 'black' | 'gray';
    };
    psi?: { // 暫時保留，雖然規格書未強調 PSI
        psi_score: number;
        wellness_component: number;
        load_component: number;
        status: 'green' | 'yellow' | 'red' | 'black' | 'gray';
    };
    rhr: {
        current_rhr: number | null;
        baseline_rhr: number | null;
        difference: number | null;
        status: 'green' | 'yellow' | 'red' | 'black' | 'gray';
    };
    wellness: {
        total: number;
        z_score: number | null; // 新增 Z-score
        avg_score: number | null;
        status: 'green' | 'yellow' | 'red' | 'black' | 'gray';
        items: {
            sleep: number;
            stress: number;
            fatigue: number;
            soreness: number;
            mood: number;
        };
    } | null;
    srpe: {
        // 保留原有的 score 與 minutes 為了向後相容或前端已使用
        score?: number;
        minutes?: number;

        load_au: number;          // 今日負荷
        weekly_load?: number;     // 這週負荷
        pct_change?: number;      // 變化率 %
        abs_change?: number;      // 變化值
        status: 'green' | 'yellow' | 'red' | 'black' | 'gray';
    } | null;
    honesty: { // 暫時保留
        honesty_score: number | null;
        conflict_type: 'none' | 'moderate' | 'severe' | 'unknown';
        message: string;
    };
    date: string;
}
