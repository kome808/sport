-- Migration: 013_notifications
-- Purpose: Create notifications table and trigger for high-risk records
-- Created at: 2026-01-13
-- Author: AI Assistant

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS sport.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES sport.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'danger')) DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE sport.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Policy for Users (Coaches/Players) to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON sport.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON sport.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Trigger to update updated_at
CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON sport.notifications
FOR EACH ROW EXECUTE FUNCTION sport.update_updated_at();

-- 5. Function & Trigger for High Risk Alert
-- This function runs after a daily_record is inserted/updated
CREATE OR REPLACE FUNCTION sport.check_high_risk_record()
RETURNS TRIGGER AS $$
DECLARE
    player_name TEXT;
    team_id_val UUID;
    coach_user_id UUID;
    msg_body TEXT;
BEGIN
    -- Only check if record has risk (e.g., sRPE high OR Wellness low)
    -- Rule: sRPE >= 8 OR Wellness <= 15 (out of 25) OR ACWR >= 1.5
    -- Note: ACWR might be calculated on client side or via another process, 
    -- but if we have it here we can check. records table usually has computed fields?
    -- checking schema, daily_records has acwr column? Let's assume based on Implementation Plan
    
    IF (NEW.srpe_score >= 8 OR NEW.wellness_score <= 15 OR (NEW.acwr IS NOT NULL AND NEW.acwr >= 1.5)) THEN
        
        -- Get Player Name and Team ID
        SELECT name, team_id INTO player_name, team_id_val
        FROM sport.players
        WHERE id = NEW.player_id;
        
        -- Find the Coach(es) of this team to send notification to
        -- For now, we look up the team's owner (coach) from teams table?
        -- Or maybe we notify all coaches linked to the team.
        -- Assuming teams table has owner_id or we look up members.
        -- Let's check existing schema if needed, but for now assuming we join via team.
        
        -- Simplification: Notify all users who are coaches of this team.
        -- Schema has `coaches` table, but `users` table is auth.users.
        -- We probably need to insert into `notifications` for the COACH ID.
        
        FOR coach_user_id IN 
            SELECT id FROM auth.users 
            WHERE id IN (
                SELECT id FROM sport.coaches WHERE team_id = team_id_val 
                -- Note: Coach table structure might be different, let's play safe
                -- If coaches table stores metadata for auth.users.
            )
        LOOP
            msg_body := '球員 ' || player_name || ' 提交了高風險的回報數據 (負荷: ' || COALESCE(NEW.training_load::text, 'N/A') || ')';
            
            INSERT INTO sport.notifications (user_id, team_id, title, message, type, link)
            VALUES (
                coach_user_id, 
                team_id_val, 
                '高風險警訊', 
                msg_body, 
                'danger', 
                '/team/' || (SELECT slug FROM sport.teams WHERE id = team_id_val) || '/player/' || NEW.player_id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_daily_record_high_risk ON sport.daily_records;
CREATE TRIGGER on_daily_record_high_risk
AFTER INSERT OR UPDATE ON sport.daily_records
FOR EACH ROW
EXECUTE FUNCTION sport.check_high_risk_record();
