export type InterviewType = 'frontend' | 'backend' | 'data_science' | 'hr';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type InterviewStatus = 'in_progress' | 'completed' | 'flagged';

export interface Interview {
  id: string;
  user_id: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  total_score: number | null;
  average_score: number | null;
  ai_summary: string | null;
  violation_reason: string | null;
  tab_switch_count: number;
  started_at: string;
  completed_at: string | null;
}

export interface InterviewResponse {
  id: string;
  interview_id: string;
  user_id: string;
  question_number: number;
  question_text: string;
  answer_text: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  follow_up_question: string | null;
  confidence_score: number | null;
  speaking_speed: number | null;
  filler_word_count: number | null;
}

export interface AIEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  follow_up_question?: string;
  confidence_score: number;
}

export interface ViolationEvent {
  type: 'camera_off' | 'no_face' | 'multiple_faces' | 'tab_switch' | 'mic_off' | 'page_refresh';
  timestamp: Date;
  message: string;
}
