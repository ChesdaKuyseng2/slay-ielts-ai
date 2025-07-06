
-- Create table for storing AI-generated test content
CREATE TABLE IF NOT EXISTS public.ai_generated_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking')),
  content JSONB NOT NULL,
  topic TEXT,
  difficulty_level TEXT DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create table for storing user test responses and feedback
CREATE TABLE IF NOT EXISTS public.ai_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  test_id UUID REFERENCES public.ai_generated_tests(id),
  skill_type TEXT NOT NULL,
  user_responses JSONB,
  ai_feedback JSONB,
  band_scores JSONB,
  overall_band_score DECIMAL(2,1),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.ai_generated_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_test_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_generated_tests
CREATE POLICY "Anyone can view active AI tests" 
  ON public.ai_generated_tests 
  FOR SELECT 
  USING (is_active = true);

-- RLS policies for ai_test_sessions
CREATE POLICY "Users can view their own AI test sessions" 
  ON public.ai_test_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI test sessions" 
  ON public.ai_test_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI test sessions" 
  ON public.ai_test_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_tests_skill_type ON public.ai_generated_tests(skill_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_user_id ON public.ai_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_skill_type ON public.ai_test_sessions(skill_type);
