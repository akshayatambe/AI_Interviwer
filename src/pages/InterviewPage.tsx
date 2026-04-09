import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProctoring } from '@/hooks/useProctoring';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTimer } from '@/hooks/useTimer';
import { generateQuestion, evaluateAnswer, generateSummary } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';
import type { InterviewType, Difficulty, AIEvaluation } from '@/types/interview';
import CameraFeed from '@/components/interview/CameraFeed';
import TranscriptPanel from '@/components/interview/TranscriptPanel';
import QuestionPanel from '@/components/interview/QuestionPanel';
import { motion } from 'framer-motion';
import { Clock, Send, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TOTAL_QUESTIONS = 5;

interface ResponseData {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  confidence_score: number;
}

const InterviewPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interviewType = searchParams.get('type') as InterviewType;
  const difficulty = searchParams.get('difficulty') as Difficulty;

  const proctoring = useProctoring();
  const speech = useSpeechToText();
  const timer = useTimer();

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [ended, setEnded] = useState(false);

  // Initialize interview
  const initialize = useCallback(async () => {
    if (!user || initialized) return;
    setInitialized(true);

    const stream = await proctoring.startMedia();
    if (!stream) {
      toast.error('Camera and microphone access required');
      navigate('/dashboard');
      return;
    }

    // Create interview record
    const { data, error } = await supabase
      .from('interviews')
      .insert({ user_id: user.id, interview_type: interviewType, difficulty, status: 'in_progress' })
      .select('id')
      .single();

    if (error || !data) {
      toast.error('Failed to start interview');
      navigate('/dashboard');
      return;
    }

    setInterviewId(data.id);
    timer.start();

    // Load first question
    setIsLoadingQuestion(true);
    try {
      const q = await generateQuestion(interviewType, difficulty, 1);
      setCurrentQuestion(q);
      setPreviousQuestions([q]);
      speech.startListening();
    } catch {
      toast.error('Failed to generate question');
    }
    setIsLoadingQuestion(false);
  }, [user, initialized, interviewType, difficulty, navigate, proctoring, timer, speech]);

  useEffect(() => { initialize(); }, [initialize]);

  // Handle violations
  useEffect(() => {
    if (proctoring.isViolated && !ended) {
      handleAutoSubmit(proctoring.violationReason || 'Proctoring violation');
    }
  }, [proctoring.isViolated, ended]);

  const handleAutoSubmit = async (reason: string) => {
    setEnded(true);
    speech.stopListening();
    timer.stop();
    proctoring.stopMedia();

    if (interviewId) {
      await supabase.from('interviews').update({
        status: 'flagged',
        violation_reason: reason,
        tab_switch_count: proctoring.tabSwitchCount,
        completed_at: new Date().toISOString(),
      }).eq('id', interviewId);
    }

    toast.error(`Interview terminated: ${reason}`);
    setTimeout(() => navigate('/dashboard'), 3000);
  };

  const handleSubmitAnswer = async () => {
    if (isEvaluating || !interviewId || !user) return;

    const answerText = speech.transcript.trim();
    speech.stopListening();
    setIsEvaluating(true);

    try {
      const evaluation: AIEvaluation = await evaluateAnswer(currentQuestion, answerText, interviewType, difficulty);

      setLastFeedback(evaluation.feedback);
      setLastScore(evaluation.score);

      const responseData: ResponseData = {
        question: currentQuestion,
        answer: answerText,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        confidence_score: evaluation.confidence_score,
      };
      setResponses(prev => [...prev, responseData]);

      // Save to DB
      await supabase.from('responses').insert({
        interview_id: interviewId,
        user_id: user.id,
        question_number: questionNumber,
        question_text: currentQuestion,
        answer_text: answerText,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        follow_up_question: evaluation.follow_up_question || null,
        confidence_score: evaluation.confidence_score,
        speaking_speed: speech.speakingSpeed,
        filler_word_count: speech.fillerWordCount,
      });

      if (questionNumber >= TOTAL_QUESTIONS) {
        // Finish interview
        const allResponses = [...responses, responseData];
        const totalScore = allResponses.reduce((s, r) => s + r.score, 0);
        const avgScore = totalScore / allResponses.length;

        let summary = '';
        try {
          summary = await generateSummary(allResponses, interviewType);
        } catch { summary = 'Summary generation failed.'; }

        await supabase.from('interviews').update({
          status: 'completed',
          total_score: totalScore,
          average_score: Math.round(avgScore * 10) / 10,
          ai_summary: summary,
          tab_switch_count: proctoring.tabSwitchCount,
          completed_at: new Date().toISOString(),
        }).eq('id', interviewId);

        timer.stop();
        proctoring.stopMedia();
        navigate(`/results/${interviewId}`);
        return;
      }

      // Next question
      setQuestionNumber(prev => prev + 1);
      setIsLoadingQuestion(true);
      speech.resetTranscript();

      const q = await generateQuestion(interviewType, difficulty, questionNumber + 1, previousQuestions);
      setCurrentQuestion(q);
      setPreviousQuestions(prev => [...prev, q]);
      setLastFeedback(null);
      setLastScore(null);
      speech.startListening();
    } catch (e: any) {
      toast.error(e?.message || 'Evaluation failed');
    } finally {
      setIsLoadingQuestion(false);
      setIsEvaluating(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!interviewType || !difficulty) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground capitalize">{interviewType.replace('_', ' ')} Interview</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground capitalize">{difficulty}</span>
        </div>
        {proctoring.isViolated && (
          <div className="flex items-center gap-1.5 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            Violation detected
          </div>
        )}
      </header>

      {/* Main 3-column layout */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left - Question */}
        <div className="flex w-1/3 flex-col gap-4">
          <QuestionPanel
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={TOTAL_QUESTIONS}
            isLoading={isLoadingQuestion}
            feedback={lastFeedback}
            score={lastScore}
          />
        </div>

        {/* Center - Camera */}
        <div className="flex w-1/3 flex-col gap-4">
          <CameraFeed
            stream={proctoring.stream}
            cameraOn={proctoring.cameraOn}
            violations={proctoring.violations}
            tabSwitchCount={proctoring.tabSwitchCount}
          />

          {/* Submit button */}
          <Button
            onClick={handleSubmitAnswer}
            disabled={isEvaluating || isLoadingQuestion || !speech.transcript.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isEvaluating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Submit Answer</>
            )}
          </Button>
        </div>

        {/* Right - Transcript */}
        <div className="flex w-1/3 flex-col">
          <TranscriptPanel
            transcript={speech.transcript}
            interimTranscript={speech.interimTranscript}
            isListening={speech.isListening}
            fillerWordCount={speech.fillerWordCount}
            wordCount={speech.wordCount}
            speakingSpeed={speech.speakingSpeed}
          />
        </div>
      </main>

      {/* Timer Bar */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong border-t border-border px-6 py-3"
      >
        <div className="flex items-center justify-center gap-3">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-mono text-lg font-semibold text-foreground">{timer.formatted}</span>
          <span className="text-xs text-muted-foreground">elapsed</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default InterviewPage;
