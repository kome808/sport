export type RiskLevel = 0 | 1 | 2 | 3; // 0:Missing, 1:Green, 2:Yellow, 3:Red

export interface MetricDetail {
    value: number | null;
    level: RiskLevel;
}

export interface FatigueMetrics {
    acwr: MetricDetail;
    rhr: MetricDetail;
    wellness: MetricDetail;
    srpe: MetricDetail;
}

export interface DataCompleteness {
    filled: number;
    total: number;
    missing: string[];
}

export interface PlayerFatigueStatus {
    overall_level: RiskLevel;
    cause: string | null;
    is_rest_day: boolean;
    completeness: DataCompleteness;
    metrics: FatigueMetrics;
    date: string;
}

// 為了方便前端對應顯示名稱與單位
export const INDICATOR_CONFIG = {
    acwr: { label: 'ACWR', unit: '', fullLabel: '急慢性訓練負荷比' },
    rhr: { label: 'RHR', unit: 'bpm', fullLabel: '晨間心跳' },
    wellness: { label: 'Wellness', unit: '分', fullLabel: '身心狀態' },
    srpe: { label: 'sRPE', unit: 'AU', fullLabel: '今日訓練負荷' }
};
