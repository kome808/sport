/**
 * Google Analytics Utilities
 * 封裝 gtag 呼叫以確保型別安全與統一管理
 */

// 宣告 gtag 到 window 物件上 (如果沒有安裝 @types/gtag.js)
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

/**
 * 發送自定義事件到 GA4
 * @param eventName 事件名稱 (建議使用 snake_case)
 * @param eventParams 事件參數 (可選)
 */
export const sendEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);

        // 開發模式下印出 Log 方便除錯
        if (import.meta.env.DEV) {
            console.log(`[GA Event] ${eventName}`, eventParams);
        }
    } else {
        console.warn('[GA] window.gtag is not defined');
    }
};

/**
 * 預定義事件 - 轉換漏斗
 */
export const analyticsEvents = {
    // 漏斗 1: 開始註冊流程 (點擊首頁註冊按鈕、登入頁註冊連結)
    CLICK_REGISTER_START: {
        name: 'click_register_start',
        params: (source: string) => ({ source }) // e.g., 'landing_hero', 'login_link'
    },

    // 漏斗 2: 完成註冊 (表單送出成功)
    COMPLETE_REGISTRATION: {
        name: 'complete_registration',
        params: (method: string) => ({ method })
    },

    // 漏斗 3: 完成球隊建立 (Team Setup 成功)
    COMPLETE_TEAM_CREATION: {
        name: 'complete_team_creation',
        params: (teamName: string) => ({ team_name: teamName })
    },

    // 功能: 登入成功
    LOGIN: {
        name: 'login',
        params: (method: string) => ({ method }) // e.g., 'email'
    },

    // 功能: 進入儀表板 (Page View 之外的明確活躍信號)
    VIEW_DASHBOARD: {
        name: 'view_dashboard',
        params: (userRole: string) => ({ user_role: userRole })
    },

    // 功能: 紀錄訓練資料
    RECORD_TRAINING: {
        name: 'record_training',
        params: (recordType: string) => ({ content_type: recordType })
    }
};
