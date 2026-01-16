-- ================================================
-- 球員疲勞監測模組 1.2 - Team Batch RPC
-- 日期: 2026-01-16
-- ================================================

-- 確保 sport schema 存在
CREATE SCHEMA IF NOT EXISTS sport;

-- ================================================
-- 6. 批量取得全隊球員疲勞指標
-- ================================================

CREATE OR REPLACE FUNCTION sport.get_team_fatigue_overview(
  p_team_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_player RECORD;
  v_metrics JSONB;
BEGIN
  -- 遍歷球隊中所有活躍球員
  FOR v_player IN 
    SELECT id, name, jersey_number, avatar_url, position
    FROM sport.players
    WHERE team_id = p_team_id AND is_active = true
    ORDER BY jersey_number ASC
  LOOP
    -- 呼叫現有的單人指標計算函數
    v_metrics := sport.get_player_fatigue_metrics(v_player.id, p_date);
    
    -- 將球員基本資料與指標合併
    v_result := v_result || jsonb_build_object(
      'player', jsonb_build_object(
        'id', v_player.id,
        'name', v_player.name,
        'jersey_number', v_player.jersey_number,
        'avatar_url', v_player.avatar_url,
        'position', v_player.position
      ),
      'metrics', v_metrics
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 權限設定
GRANT EXECUTE ON FUNCTION sport.get_team_fatigue_overview TO authenticated, service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Team Fatigue Batch RPC 部署完成';
END $$;
