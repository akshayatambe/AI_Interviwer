import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechToTextState {
  transcript: string;
  isListening: boolean;
  interimTranscript: string;
  fillerWordCount: number;
  wordCount: number;
  speakingDuration: number;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'honestly', 'right', 'so', 'well', 'i mean'];

export function useSpeechToText() {
  const [state, setState] = useState<SpeechToTextState>({
    transcript: '',
    isListening: false,
    interimTranscript: '',
    fillerWordCount: 0,
    wordCount: 0,
    speakingDuration: 0,
  });

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const countFillerWords = (text: string): number => {
    const lower = text.toLowerCase();
    return FILLER_WORDS.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + (lower.match(regex)?.length || 0);
    }, 0);
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim = t;
      }

      setState(prev => {
        const newTranscript = prev.transcript + final;
        const words = newTranscript.trim().split(/\s+/).filter(Boolean);
        return {
          ...prev,
          transcript: newTranscript,
          interimTranscript: interim,
          fillerWordCount: countFillerWords(newTranscript),
          wordCount: words.length,
        };
      });
    };

    recognition.onerror = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    recognition.start();
    setState(prev => ({ ...prev, isListening: true, transcript: '', interimTranscript: '', fillerWordCount: 0, wordCount: 0 }));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      ref.stop();
      const duration = (Date.now() - startTimeRef.current) / 1000;
      setState(prev => ({ ...prev, isListening: false, speakingDuration: duration }));
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '', fillerWordCount: 0, wordCount: 0 }));
  }, []);

  useEffect(() => {
    return () => { if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; } };
  }, []);

  return { ...state, startListening, stopListening, resetTranscript, speakingSpeed: state.speakingDuration > 0 ? Math.round((state.wordCount / state.speakingDuration) * 60) : 0 };
}
