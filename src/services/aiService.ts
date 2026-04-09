import { supabase } from '@/integrations/supabase/client';
import type { InterviewType, Difficulty, AIEvaluation } from '@/types/interview';

export async function generateQuestion(
  interviewType: InterviewType,
  difficulty: Difficulty,
  questionNumber: number,
  previousQuestions: string[] = []
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('interview-ai', {
    body: {
      action: 'generate_question',
      interviewType,
      difficulty,
      questionNumber,
      previousQuestions,
    },
  });
  if (error) throw error;
  return data.question;
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  interviewType: InterviewType,
  difficulty: Difficulty
): Promise<AIEvaluation> {
  const { data, error } = await supabase.functions.invoke('interview-ai', {
    body: {
      action: 'evaluate_answer',
      question,
      answer,
      interviewType,
      difficulty,
    },
  });
  if (error) throw error;
  return data;
}

export async function generateSummary(
  responses: Array<{ question: string; answer: string; score: number; feedback: string }>,
  interviewType: InterviewType
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('interview-ai', {
    body: {
      action: 'generate_summary',
      responses,
      interviewType,
    },
  });
  if (error) throw error;
  return data.summary;
}
