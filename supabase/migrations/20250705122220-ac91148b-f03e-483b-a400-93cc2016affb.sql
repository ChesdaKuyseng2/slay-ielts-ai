
-- Create user profiles table with subscription management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  subscription_type TEXT DEFAULT 'normal' CHECK (subscription_type IN ('normal', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice sessions table to track user activities
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking', 'mock_test')),
  session_data JSONB,
  score DECIMAL,
  ai_feedback TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content management table for admin
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('practice_set', 'audio_file', 'speaking_prompt', 'sample_answer')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  skill_type TEXT CHECK (skill_type IN ('listening', 'reading', 'writing', 'speaking')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for admin_users (only admins can access)
CREATE POLICY "Only admins can access admin_users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view their own sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for content_items
CREATE POLICY "Everyone can view active content" ON public.content_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage content" ON public.content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for system_settings
CREATE POLICY "Only admins can access system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample users and admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'dary@gmail.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Dary Premium"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sreymom@gmail.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Sreymom Premium"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'chesda@gmail.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Chesda Normal"}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'admin@gmail.com', crypt('123456', gen_salt('bf')), NOW(), NOW(), NOW(), '{"full_name": "Admin User"}');

-- Insert profiles for sample users
INSERT INTO public.profiles (id, email, full_name, subscription_type, subscription_expires_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'dary@gmail.com', 'Dary Premium', 'premium', NOW() + INTERVAL '1 year'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sreymom@gmail.com', 'Sreymom Premium', 'premium', NOW() + INTERVAL '1 year'),
  ('550e8400-e29b-41d4-a716-446655440003', 'chesda@gmail.com', 'Chesda Normal', 'normal', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'admin@gmail.com', 'Admin User', 'premium', NOW() + INTERVAL '10 years');

-- Insert admin user
INSERT INTO public.admin_users (user_id, username, is_active)
VALUES ('550e8400-e29b-41d4-a716-446655440004', 'admin', true);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('ai_feedback_enabled', 'true', 'Enable/disable AI feedback feature'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('max_free_attempts', '{"listening": 3, "reading": 3, "writing": 2, "speaking": 2}', 'Maximum attempts for free users per skill');
