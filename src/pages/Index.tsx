import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Zap, Mic, Camera, Brain, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Brain, title: 'AI-Powered Questions', desc: 'Dynamic questions tailored to your domain and difficulty level' },
  { icon: Mic, title: 'Voice Recognition', desc: 'Real-time speech-to-text with filler word detection' },
  { icon: Camera, title: 'Live Proctoring', desc: 'Camera monitoring with face detection and tab tracking' },
  { icon: Shield, title: 'Fair Assessment', desc: 'AI evaluation with detailed feedback and scoring' },
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-200px] h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">InterviewAI</span>
        </div>
        <Button
          onClick={() => navigate(user ? '/dashboard' : '/auth')}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {user ? 'Dashboard' : 'Get Started'}
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-16 text-center lg:pt-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI-Powered Mock Interviews
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-6xl lg:text-7xl">
            Ace Your Next
            <br />
            <span className="gradient-text">Technical Interview</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Practice with an AI interviewer that asks real questions, evaluates your answers in real-time,
            and gives you detailed feedback — all with full proctoring.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 glow-primary"
            >
              Start Interview <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <Icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
