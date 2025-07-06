
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

export interface AIGeneratedTest {
  id: string;
  skill_type: 'listening' | 'reading' | 'writing' | 'speaking';
  content: any;
  topic?: string;
  difficulty_level?: string;
  created_at: string;
  is_active: boolean;
}

export interface AITestSession {
  id: string;
  user_id: string;
  test_id?: string;
  skill_type: string;
  user_responses?: any;
  ai_feedback?: any;
  band_scores?: any;
  overall_band_score?: number;
  completed_at?: string;
  created_at: string;
  started_at?: string;
  time_spent?: number;
}

export interface TestHistory {
  id: string;
  user_id: string;
  session_id?: string;
  test_type: 'quick' | 'ai';
  skill_type: string;
  test_content?: any;
  user_responses?: any;
  scores?: any;
  feedback?: any;
  time_spent?: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  skill_type: string;
  total_tests: number;
  total_time_spent: number;
  best_score: number;
  average_score: number;
  last_test_date?: string;
  streak_days: number;
  created_at: string;
  updated_at: string;
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

export interface AIFeedback {
  overall_score: number;
  category_scores: {
    [key: string]: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  band_descriptors: {
    [key: string]: string;
  };
}

// RPC Function Parameters
export interface InsertTestHistoryParams {
  p_user_id: string;
  p_session_id: string;
  p_test_type: string;
  p_skill_type: string;
  p_test_content: any;
}

export interface UpdateTestHistoryParams {
  p_session_id: string;
  p_user_responses: any;
  p_scores: any;
  p_feedback: any;
  p_time_spent: number;
}
