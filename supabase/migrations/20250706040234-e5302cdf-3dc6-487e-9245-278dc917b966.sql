
-- Add missing tables that are referenced in the code
CREATE TABLE IF NOT EXISTS public.test_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID,
  test_type TEXT NOT NULL,
  skill_type TEXT NOT NULL,
  test_content JSONB,
  user_responses JSONB,
  scores JSONB,
  feedback JSONB,
  time_spent INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own test history" 
  ON public.test_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test history" 
  ON public.test_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test history" 
  ON public.test_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_type TEXT NOT NULL,
  total_tests INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  best_score NUMERIC DEFAULT 0,
  average_score NUMERIC DEFAULT 0,
  last_test_date TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_type)
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_progress
CREATE POLICY "Users can view their own progress" 
  ON public.user_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON public.user_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON public.user_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add missing columns to ai_test_sessions
ALTER TABLE public.ai_test_sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;

-- Create the RPC functions that are being called in the code
CREATE OR REPLACE FUNCTION insert_test_history(
  p_user_id UUID,
  p_session_id UUID,
  p_test_type TEXT,
  p_skill_type TEXT,
  p_test_content JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.test_history (
    user_id,
    session_id,
    test_type,
    skill_type,
    test_content
  ) VALUES (
    p_user_id,
    p_session_id,
    p_test_type,
    p_skill_type,
    p_test_content
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_test_history(
  p_session_id UUID,
  p_user_responses JSONB,
  p_scores JSONB,
  p_feedback JSONB,
  p_time_spent INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.test_history SET
    user_responses = p_user_responses,
    scores = p_scores,
    feedback = p_feedback,
    time_spent = p_time_spent,
    completed = true,
    updated_at = now()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
