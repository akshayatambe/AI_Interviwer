import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, Download, Trophy, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface InterviewData {
  id: string;
  interview_type: string;
  difficulty: string;
  status: string;
  total_score: number | null;
  average_score: number | null;
  ai_summary: string | null;
  violation_reason: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ResponseData {
  question_number: number;
  question_text: string;
  answer_text: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  confidence_score: number | null;
  speaking_speed: number | null;
  filler_word_count: number | null;
}

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const { data: iv } = await supabase.from('interviews').select('*').eq('id', id).single();
      const { data: resp } = await supabase.from('responses').select('*').eq('interview_id', id).order('question_number');
      setInterview(iv as InterviewData);
      setResponses((resp || []) as ResponseData[]);
      setLoading(false);
    };
    load();
  }, [user, id]);

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!interview) return <Navigate to="/dashboard" replace />;

  const isFlagged = interview.status === 'flagged';

  // Radar chart data
  const radarData = responses.map((r, i) => ({
    question: `Q${i + 1}`,
    score: r.score || 0,
    confidence: r.confidence_score || 0,
  }));

  const avgConfidence = responses.length > 0
    ? Math.round(responses.reduce((s, r) => s + (r.confidence_score || 0), 0) / responses.length * 10) / 10
    : 0;

  const avgSpeed = responses.length > 0
    ? Math.round(responses.reduce((s, r) => s + (r.speaking_speed || 0), 0) / responses.length)
    : 0;

  const totalFillers = responses.reduce((s, r) => s + (r.filler_word_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-border px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Interview Results</span>
        </div>
        <div />
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Status Banner */}
        {isFlagged && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Interview Flagged</p>
              <p className="text-sm text-destructive/70">{interview.violation_reason}</p>
            </div>
          </motion.div>
        )}

        {/* Score Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Score', value: isFlagged ? '—' : `${interview.total_score || 0}/50`, icon: Trophy, color: 'text-primary' },
            { label: 'Average', value: isFlagged ? '—' : `${interview.average_score || 0}/10`, icon: TrendingUp, color: 'text-primary' },
            { label: 'Confidence', value: isFlagged ? '—' : `${avgConfidence}/10`, icon: CheckCircle, color: 'text-success' },
            { label: 'Avg WPM', value: `${avgSpeed}`, icon: TrendingUp, color: 'text-accent' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-5 text-center">
              <Icon className={`mx-auto mb-2 h-6 w-6 ${color}`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Radar Chart */}
        {!isFlagged && radarData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass mb-8 rounded-2xl p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220 16% 18%)" />
                <PolarAngleAxis dataKey="question" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'hsl(215 16% 55%)', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(173 80% 50%)" fill="hsl(173 80% 50%)" fillOpacity={0.2} />
                <Radar name="Confidence" dataKey="confidence" stroke="hsl(260 70% 60%)" fill="hsl(260 70% 60%)" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* AI Summary */}
        {interview.ai_summary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass mb-8 rounded-2xl p-6">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">AI Summary</h3>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{interview.ai_summary}</p>
          </motion.div>
        )}

        {/* Individual Responses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Detailed Responses</h3>
          <div className="space-y-4">
            {responses.map((r, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-primary">Question {r.question_number}</span>
                    <p className="mt-1 text-sm font-medium text-foreground">{r.question_text}</p>
                  </div>
                  {r.score !== null && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.score >= 7 ? 'bg-success/20 text-success' : r.score >= 4 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                      {r.score}/10
                    </span>
                  )}
                </div>
                {r.answer_text && <p className="mb-3 text-sm text-muted-foreground">{r.answer_text}</p>}
                {r.feedback && <p className="mb-3 rounded-lg bg-secondary/50 p-3 text-xs text-foreground/80">{r.feedback}</p>}
                <div className="flex flex-wrap gap-2">
                  {r.strengths?.map((s, j) => (
                    <span key={j} className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">{s}</span>
                  ))}
                  {r.weaknesses?.map((w, j) => (
                    <span key={j} className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{w}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-border text-foreground hover:bg-secondary">
            Start Another Interview
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
