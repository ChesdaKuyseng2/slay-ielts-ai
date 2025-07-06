
-- Fix the infinite recursion in admin_users policy
DROP POLICY IF EXISTS "Admin users can view admin list" ON public.admin_users;

CREATE POLICY "Admin users can view admin list" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = true AND au.id != admin_users.id
    )
  );

-- Fix ai_generated_tests policies - add INSERT policy
DROP POLICY IF EXISTS "Allow AI test creation" ON public.ai_generated_tests;
DROP POLICY IF EXISTS "Authenticated users can create AI tests" ON public.ai_generated_tests;

-- Allow service role to create tests (for edge functions)
CREATE POLICY "Service role can manage AI tests" 
  ON public.ai_generated_tests 
  FOR ALL 
  TO service_role;

-- Allow authenticated users to create tests
CREATE POLICY "Authenticated users can create AI tests" 
  ON public.ai_generated_tests 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow reading active tests
CREATE POLICY "Anyone can view active AI tests" 
  ON public.ai_generated_tests 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Create comprehensive test history table
CREATE TABLE IF NOT EXISTS public.test_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.ai_test_sessions(id),
  test_type TEXT NOT NULL, -- 'quick' or 'ai'
  skill_type TEXT NOT NULL,
  test_content JSONB,
  user_responses JSONB,
  scores JSONB,
  feedback JSONB,
  time_spent INTEGER, -- in seconds
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test_history
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_history
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

-- Create user progress tracking table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_type TEXT NOT NULL,
  total_tests INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
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

-- Function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user progress
  INSERT INTO public.user_progress (
    user_id, 
    skill_type, 
    total_tests, 
    total_time_spent,
    best_score,
    average_score,
    last_test_date,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.skill_type,
    1,
    COALESCE(NEW.time_spent, 0),
    COALESCE(NEW.overall_band_score, 0),
    COALESCE(NEW.overall_band_score, 0),
    NEW.completed_at,
    now()
  )
  ON CONFLICT (user_id, skill_type) 
  DO UPDATE SET
    total_tests = user_progress.total_tests + 1,
    total_time_spent = user_progress.total_time_spent + COALESCE(NEW.time_spent, 0),
    best_score = GREATEST(user_progress.best_score, COALESCE(NEW.overall_band_score, 0)),
    average_score = (
      (user_progress.average_score * user_progress.total_tests + COALESCE(NEW.overall_band_score, 0)) / 
      (user_progress.total_tests + 1)
    ),
    last_test_date = NEW.completed_at,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when AI test session is completed
CREATE TRIGGER update_progress_on_ai_test_completion
  AFTER UPDATE OF completed_at ON public.ai_test_sessions
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
  EXECUTE FUNCTION update_user_progress();

-- Add time tracking to ai_test_sessions
ALTER TABLE public.ai_test_sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;
