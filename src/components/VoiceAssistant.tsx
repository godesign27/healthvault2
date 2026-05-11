import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AudioCapture } from '../lib/audio/capture';
import { VoiceInteraction } from './VoiceInteraction';
import type { PageContext } from '../lib/voice/context-messages';

interface VoiceAssistantProps {
  pageContext?: PageContext;
  onTranscriptReceived?: (transcript: string) => void;
  onResponseGenerated?: (response: string) => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'responding' | 'error';

export function VoiceAssistant({
  pageContext = 'dashboard',
  onTranscriptReceived,
  onResponseGenerated
}: VoiceAssistantProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const volumeAnimationRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    return () => {
      stopListening();
      if (volumeAnimationRef.current) {
        cancelAnimationFrame(volumeAnimationRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    if (isListeningRef.current) return;

    try {
      setError(null);
      setState('listening');

      const capture = new AudioCapture();
      const permitted = await capture.requestPermission();

      if (!permitted) {
        setError('Microphone access denied. Please enable microphone permissions.');
        setState('error');
        return;
      }

      audioCaptureRef.current = capture;
      capture.startRecording();
      isListeningRef.current = true;

      updateVolumeLevel();
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start recording. Please try again.');
      setState('error');
    }
  };

  const stopListening = async () => {
    if (!audioCaptureRef.current || !isListeningRef.current) return;

    isListeningRef.current = false;
    setState('processing');

    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }

    try {
      const audioBlob = await audioCaptureRef.current.stopRecording();
      audioCaptureRef.current.cleanup();
      audioCaptureRef.current = null;

      if (audioBlob.size < 1000) {
        setError('Recording too short. Please speak for at least 1 second.');
        setState('error');
        return;
      }

      await transcribeAudio(audioBlob);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to process recording. Please try again.');
      setState('error');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Sending audio to transcription service...');
      const response = await fetch(
        `${supabaseUrl}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text.trim();

      console.log('Transcription received:', transcribedText);
      setTranscript(transcribedText);
      onTranscriptReceived?.(transcribedText);

      await generateResponse(transcribedText);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
      setState('error');
    }
  };

  const generateResponse = async (userMessage: string) => {
    setState('responding');

    const responseText = `I heard you say: "${userMessage}". I'm processing your request for the ${pageContext} page.`;

    setResponse(responseText);
    onResponseGenerated?.(responseText);
  };

  const updateVolumeLevel = () => {
    if (!audioCaptureRef.current || !isListeningRef.current) return;

    const level = audioCaptureRef.current.getVolumeLevel();
    setVolumeLevel(level);

    volumeAnimationRef.current = requestAnimationFrame(updateVolumeLevel);
  };

  const handleMicPress = () => {
    if (state === 'idle' || state === 'error') {
      startListening();
    } else if (state === 'listening') {
      stopListening();
    }
  };

  const handleResponseClose = () => {
    setResponse(null);
    setTranscript('');
    setState('idle');
  };

  const handleOpenChat = () => {
    console.log('Opening chat with transcript:', transcript);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {state === 'listening' && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping"
                style={{
                  transform: `scale(${1 + volumeLevel / 100})`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
              <div
                className="absolute inset-0 rounded-full bg-blue-300 opacity-20"
                style={{
                  transform: `scale(${1.5 + volumeLevel / 50})`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
            </>
          )}

          <button
            onClick={handleMicPress}
            disabled={state === 'processing' || state === 'responding'}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
              state === 'listening'
                ? 'bg-red-500 scale-110'
                : state === 'processing' || state === 'responding'
                ? 'bg-action-primary-disabled'
                : state === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={
              state === 'listening'
                ? 'Click to stop recording'
                : state === 'processing'
                ? 'Processing...'
                : state === 'responding'
                ? 'Generating response...'
                : 'Click to start speaking'
            }
          >
            {state === 'processing' || state === 'responding' ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : state === 'listening' ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {error && state === 'error' && (
          <div className="mt-3 max-w-xs p-3 bg-red-500 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 fade-in">
            <p className="text-xs text-white font-medium">{error}</p>
          </div>
        )}

        {state === 'listening' && (
          <div className="mt-3 max-w-xs p-3 bg-white rounded-lg shadow-lg animate-in slide-in-from-bottom-2 fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-xs font-bold text-content-primary">Listening...</p>
            </div>
            <div className="h-1 rounded-full bg-surface-overlay overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100"
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="mt-3 max-w-xs p-3 bg-white rounded-lg shadow-lg animate-in slide-in-from-bottom-2 fade-in">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-content-primary">Transcribing...</p>
            </div>
          </div>
        )}
      </div>

      {response && (
        <VoiceInteraction
          message={response}
          onClose={handleResponseClose}
          onOpenChat={handleOpenChat}
        />
      )}
    </>
  );
}
