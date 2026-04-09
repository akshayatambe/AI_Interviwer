import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';

interface QuestionPanelProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  isLoading: boolean;
  feedback?: string | null;
  score?: number | null;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  questionNumber,
  totalQuestions,
  isLoading,
  feedback,
  score,
}) => {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass flex flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">AI Question</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      <div className="flex-1 p-5">
        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Generating question...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-base leading-relaxed text-foreground">{question}</p>
            </div>

            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl bg-secondary/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Feedback</span>
                  {score !== null && score !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${score >= 7 ? 'bg-success/20 text-success' : score >= 4 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                      {score}/10
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{feedback}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionPanel;
