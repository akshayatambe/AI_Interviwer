import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, LogOut, Code, Server, Database, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InterviewType, Difficulty } from '@/types/interview';

const interviewTypes: { type: InterviewType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'frontend', label: 'Frontend', icon: Code, desc: 'React, CSS, JavaScript, DOM' },
  { type: 'backend', label: 'Backend', icon: Server, desc: 'APIs, Databases, System Design' },
  { type: 'data_science', label: 'Data Science', icon: Database, desc: 'ML, Statistics, Python' },
  { type: 'hr', label: 'HR / Behavioral', icon: Users, desc: 'Soft skills, Culture fit' },
];

const difficulties: { level: Difficulty; label: string; color: string }[] = [
  { level: 'easy', label: 'Easy', color: 'text-success' },
  { level: 'medium', label: 'Medium', color: 'text-warning' },
  { level: 'hard', label: 'Hard', color: 'text-destructive' },
];

const Dashboard: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = React.useState<InterviewType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty | null>(null);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const startInterview = () => {
    if (!selectedType || !selectedDifficulty) return;
    navigate(`/interview?type=${selectedType}&difficulty=${selectedDifficulty}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">AI Interviewer</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Start an Interview</h1>
          <p className="mt-2 text-muted-foreground">Choose your domain and difficulty, then begin your AI-powered mock interview.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Interview Type</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {interviewTypes.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`glass flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:border-primary/30 ${selectedType === type ? 'border-primary/50 glow-primary' : ''}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selectedType === type ? 'bg-primary/20' : 'bg-secondary'}`}>
                  <Icon className={`h-5 w-5 ${selectedType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Difficulty</h2>
          <div className="flex gap-3">
            {difficulties.map(({ level, label, color }) => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(level)}
                className={`glass flex-1 rounded-xl px-4 py-3 text-center transition-all hover:border-primary/30 ${selectedDifficulty === level ? 'border-primary/50 glow-primary' : ''}`}
              >
                <span className={`font-medium ${selectedDifficulty === level ? 'text-primary' : color}`}>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10">
          <Button
            onClick={startInterview}
            disabled={!selectedType || !selectedDifficulty}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
          >
            Begin Interview <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Camera & microphone will be required. Tab switching is monitored.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
