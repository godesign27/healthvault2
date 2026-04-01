import { useState, useRef, useEffect } from 'react';
import { Volume2, X, RotateCcw, MessageCircle, Loader2 } from 'lucide-react';

interface VoiceInteractionProps {
  message: string;
  onClose: () => void;
  onOpenChat: () => void;
  darkMode?: boolean;
}

type VoiceState = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';

let globalAudioInstance: HTMLAudioElement | null = null;
let globalAbortController: AbortController | null = null;

const stopGlobalAudio = () => {
  if (globalAbortController) {
    globalAbortController.abort();
    globalAbortController = null;
  }
  if (globalAudioInstance) {
    globalAudioInstance.pause();
    globalAudioInstance.currentTime = 0;
    globalAudioInstance.src = '';
    globalAudioInstance.load();
    globalAudioInstance = null;
  }
};

export function VoiceInteraction({
  message,
  onClose,
  onOpenChat,
  darkMode = false
}: VoiceInteractionProps) {
  const [state, setState] = useState<VoiceState>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSynthesizingRef = useRef<boolean>(false);

  useEffect(() => {
    cleanupAudio();
    synthesizeSpeech();
    return () => {
      cleanupAudio();
    };
  }, [message]);

  const cleanupAudio = () => {
    stopGlobalAudio();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    isSynthesizingRef.current = false;
  };

  const synthesizeSpeech = async () => {
    if (isSynthesizingRef.current) {
      console.log('Synthesis already in progress, skipping...');
      return;
    }

    stopGlobalAudio();

    isSynthesizingRef.current = true;
    setState('loading');
    setError(null);

    abortControllerRef.current = new AbortController();
    globalAbortController = abortControllerRef.current;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Calling TTS API...');
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          voiceId: '21m00Tcm4TlvDq8ikWAM'
        }),
        signal: abortControllerRef.current.signal
      });

      console.log('TTS API response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to synthesize speech';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('TTS API error details:', errorData);
        } else {
          const errorText = await response.text();
          console.error('TTS API error text:', errorText);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();
      console.log('Audio blob size:', audioBlob.size);

      if (audioBlob.size === 0) {
        throw new Error('Received empty audio file');
      }

      if (abortControllerRef.current?.signal.aborted) {
        console.log('Request was aborted, not creating audio');
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      globalAudioInstance = audio;

      const handleLoadedMetadata = () => {
        if (!abortControllerRef.current?.signal.aborted) {
          console.log('Audio loaded, duration:', audio.duration);
          setState('playing');
          audio.play().catch(err => {
            console.error('Play error:', err);
            setState('error');
            setError('Failed to play audio. Please check your browser audio permissions.');
          });
          startProgressTracking();
        }
      };

      const handleEnded = () => {
        setState('completed');
        setProgress(100);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        isSynthesizingRef.current = false;
      };

      const handleError = (e: Event) => {
        console.error('Audio playback error:', e);
        setState('error');
        setError('Failed to play audio. Please check your browser audio permissions.');
        isSynthesizingRef.current = false;
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('TTS request was aborted');
        return;
      }
      console.error('TTS Error:', err);
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to generate speech. Please try again.');
      isSynthesizingRef.current = false;
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(currentProgress);
      }
    }, 100);
  };

  const handleReplay = () => {
    cleanupAudio();
    setProgress(0);
    setState('loading');
    synthesizeSpeech();
  };

  const handleTogglePlayPause = () => {
    if (!audioRef.current) return;

    if (state === 'playing') {
      audioRef.current.pause();
      setState('paused');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else if (state === 'paused') {
      audioRef.current.play();
      setState('playing');
      startProgressTracking();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="w-[420px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-stone-200">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Health Assistant
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !audioRef.current.muted;
                }
              }}
              className="p-1.5 rounded-lg transition-colors hover:bg-stone-100"
            >
              <Volume2 className="w-4 h-4 text-stone-500" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-stone-100"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          {/* Avatar and Message Row */}
          <div className="flex gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                state === 'loading' ? 'animate-pulse' : ''
              } ${
                state === 'error' ? 'bg-gradient-to-br from-red-100 to-red-200' : 'bg-gradient-to-br from-stone-200 to-stone-300'
              }`}>
                {state === 'loading' && (
                  <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
                )}
                {(state === 'playing' || state === 'paused') && (
                  <button
                    onClick={handleTogglePlayPause}
                    className="w-full h-full rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500"></div>
                  </button>
                )}
                {state === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-green-500"></div>
                )}
                {state === 'error' && (
                  <div className="w-8 h-8 rounded-full bg-red-500"></div>
                )}
              </div>

              {/* Progress Ring Overlay */}
              {(state === 'playing' || state === 'paused' || state === 'completed') && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] pointer-events-none">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="34"
                      cy="34"
                      r="32"
                      stroke="#e7e5e4"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle
                      cx="34"
                      cy="34"
                      r="32"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-100"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed text-stone-900">{message}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {(state === 'playing' || state === 'paused' || state === 'completed') && (
            <div className="mb-4">
              <div className="h-1 rounded-full overflow-hidden bg-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {state === 'error' && error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {state === 'error' && (
              <button
                onClick={synthesizeSpeech}
                className="flex-1 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-stone-800 transition-all"
              >
                Retry
              </button>
            )}

            {(state === 'completed' || state === 'playing' || state === 'paused') && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-wide hover:bg-red-600 transition-all flex items-center gap-1.5"
                >
                  <X className="w-3 h-3 stroke-[3]" />
                  Close
                </button>

                <button
                  onClick={() => {
                    cleanupAudio();
                    setState('completed');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all bg-stone-200 text-stone-700 hover:bg-stone-300"
                >
                  Complete
                </button>

                <button
                  onClick={handleReplay}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all bg-stone-200 text-stone-700 hover:bg-stone-300"
                >
                  Replay
                </button>

                <button
                  onClick={onOpenChat}
                  className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3 h-3" />
                  Chat
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
