
-- Create helper functions for test history operations

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
