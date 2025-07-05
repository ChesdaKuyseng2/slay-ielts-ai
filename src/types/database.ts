
export interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  subscription_type: 'normal' | 'premium';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  skill_type: 'listening' | 'reading' | 'writing' | 'speaking' | 'mock_test';
  session_data?: any;
  score?: number;
  ai_feedback?: string;
  completed_at?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

export interface ContentItem {
  id: string;
  type: 'practice_set' | 'audio_file' | 'speaking_prompt' | 'sample_answer';
  title: string;
  content: any;
  skill_type?: 'listening' | 'reading' | 'writing' | 'speaking';
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
}
