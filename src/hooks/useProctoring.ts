import { useState, useEffect, useCallback, useRef } from 'react';
import type { ViolationEvent } from '@/types/interview';

interface ProctoringState {
  cameraOn: boolean;
  micOn: boolean;
  faceDetected: boolean;
  multipleFaces: boolean;
  tabSwitchCount: number;
  violations: ViolationEvent[];
  isViolated: boolean;
  violationReason: string | null;
  stream: MediaStream | null;
}

const MAX_TAB_SWITCHES = 2;
const NO_FACE_TIMEOUT = 10000;

export function useProctoring() {
  const [state, setState] = useState<ProctoringState>({
    cameraOn: false,
    micOn: false,
    faceDetected: true,
    multipleFaces: false,
    tabSwitchCount: 0,
    violations: [],
    isViolated: false,
    violationReason: null,
    stream: null,
  });

  const noFaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addViolation = useCallback((type: ViolationEvent['type'], message: string) => {
    const violation: ViolationEvent = { type, timestamp: new Date(), message };
    setState(prev => {
      const violations = [...prev.violations, violation];
      return { ...prev, violations, isViolated: true, violationReason: message };
    });
  }, []);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setState(prev => ({ ...prev, stream, cameraOn: true, micOn: true }));

      stream.getVideoTracks().forEach(track => {
        track.onended = () => addViolation('camera_off', 'Camera was turned off');
      });
      stream.getAudioTracks().forEach(track => {
        track.onended = () => addViolation('mic_off', 'Microphone was disabled');
      });

      return stream;
    } catch {
      addViolation('camera_off', 'Camera/mic permission denied');
      return null;
    }
  }, [addViolation]);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setState(prev => ({ ...prev, stream: null, cameraOn: false, micOn: false }));
  }, []);

  // Tab visibility
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setState(prev => {
          const newCount = prev.tabSwitchCount + 1;
          if (newCount > MAX_TAB_SWITCHES) {
            return { ...prev, tabSwitchCount: newCount, isViolated: true, violationReason: 'Too many tab switches', violations: [...prev.violations, { type: 'tab_switch', timestamp: new Date(), message: `Tab switch #${newCount} - auto-submitting` }] };
          }
          return { ...prev, tabSwitchCount: newCount, violations: [...prev.violations, { type: 'tab_switch', timestamp: new Date(), message: `Warning: Tab switch #${newCount}/${MAX_TAB_SWITCHES}` }] };
        });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      stopMedia();
    };
  }, [stopMedia]);

  return { ...state, startMedia, stopMedia };
}
