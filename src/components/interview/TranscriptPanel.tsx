import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface TranscriptPanelProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  fillerWordCount: number;
  wordCount: number;
  speakingSpeed: number;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  interimTranscript,
  isListening,
  fillerWordCount,
  wordCount,
  speakingSpeed,
}) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass flex h-full flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">Live Transcript</h3>
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${isListening ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
          {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
          {isListening ? 'Listening' : 'Paused'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {transcript || interimTranscript ? (
          <p className="text-sm leading-relaxed text-foreground">
            {transcript}
            {interimTranscript && <span className="text-muted-foreground italic">{interimTranscript}</span>}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Start speaking to see your transcript here...</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
        <div className="bg-card px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Words</p>
          <p className="text-sm font-semibold text-foreground">{wordCount}</p>
        </div>
        <div className="bg-card px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">WPM</p>
          <p className="text-sm font-semibold text-foreground">{speakingSpeed}</p>
        </div>
        <div className="bg-card px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Fillers</p>
          <p className={`text-sm font-semibold ${fillerWordCount > 5 ? 'text-warning' : 'text-foreground'}`}>{fillerWordCount}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TranscriptPanel;
