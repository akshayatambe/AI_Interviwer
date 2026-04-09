import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';

interface CameraFeedProps {
  stream: MediaStream | null;
  cameraOn: boolean;
  violations: Array<{ type: string; message: string }>;
  tabSwitchCount: number;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ stream, cameraOn, violations, tabSwitchCount }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass relative overflow-hidden rounded-2xl">
      <div className="aspect-[4/3] relative">
        {cameraOn && stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover rounded-2xl" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary rounded-2xl">
            <CameraOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cameraOn ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${cameraOn ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            {cameraOn ? 'LIVE' : 'OFF'}
          </div>
        </div>

        {/* Tab switch warnings */}
        {tabSwitchCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-1 text-xs font-medium text-warning">
            <AlertTriangle className="h-3 w-3" />
            {tabSwitchCount}/2
          </div>
        )}
      </div>

      {/* Recent violation alert */}
      {violations.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {violations[violations.length - 1].message}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CameraFeed;
