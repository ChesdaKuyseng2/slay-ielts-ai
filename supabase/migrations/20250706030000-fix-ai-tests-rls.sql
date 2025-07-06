
-- Add missing INSERT policy for ai_generated_tests table
-- This allows the application to store AI-generated tests
CREATE POLICY "Allow AI test creation" 
  ON public.ai_generated_tests 
  FOR INSERT 
  WITH CHECK (true);

-- Also allow authenticated users to create AI tests
CREATE POLICY "Authenticated users can create AI tests" 
  ON public.ai_generated_tests 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
