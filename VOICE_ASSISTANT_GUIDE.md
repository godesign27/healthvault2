# Voice Assistant Implementation Guide

## Overview

The health assistant application now supports bidirectional voice communication, allowing users to speak to the assistant and receive spoken responses. This guide explains the implementation, architecture, and usage.

## Architecture Components

### 1. Speech-to-Text (Whisper API)
**Location:** `supabase/functions/transcribe-audio/index.ts`

Converts user's spoken words into text using OpenAI's Whisper model.

**Features:**
- Industry-leading accuracy for medical terminology
- Supports multiple languages (configured for English)
- Returns verbose JSON with word-level timestamps
- Automatic audio format detection

**API Endpoint:**
```
POST {SUPABASE_URL}/functions/v1/transcribe-audio
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: multipart/form-data

Body: FormData with 'audio' file (WebM, WAV, MP3, etc.)
```

**Response:**
```json
{
  "text": "What are my recent lab results?",
  "words": [...],
  "duration": 2.5,
  "language": "en"
}
```

### 2. Audio Capture
**Location:** `src/lib/audio/capture.ts`

Handles browser microphone access, recording, and audio processing.

**Key Features:**
- Automatic microphone permission handling
- Real-time volume level monitoring
- Optimized audio settings (16kHz, mono, noise suppression)
- Support for multiple audio formats (WebM, OGG, MP4)
- Pause/resume functionality

**Usage:**
```typescript
import { AudioCapture } from '../lib/audio/capture';

const capture = new AudioCapture();

// Request mic permission
const permitted = await capture.requestPermission();

// Start recording
capture.startRecording();

// Monitor volume
const volume = capture.getVolumeLevel(); // 0-100

// Stop and get audio
const audioBlob = await capture.stopRecording();

// Cleanup
capture.cleanup();
```

### 3. Audio Processing
**Location:** `src/lib/audio/processing.ts`

Utilities for audio format conversion and analysis.

**Functions:**
- `convertToWav(blob)` - Converts audio to WAV format
- `getDuration(blob)` - Gets audio duration
- `formatDuration(seconds)` - Formats duration as MM:SS

### 4. Voice Assistant Component
**Location:** `src/components/VoiceAssistant.tsx`

Main UI component that orchestrates the voice interaction flow.

**States:**
- `idle` - Ready to start listening
- `listening` - Recording user audio
- `processing` - Transcribing audio
- `responding` - Playing response
- `error` - Error occurred

**Props:**
```typescript
interface VoiceAssistantProps {
  pageContext?: PageContext;
  onTranscriptReceived?: (transcript: string) => void;
  onResponseGenerated?: (response: string) => void;
}
```

**Integration Example:**
```tsx
<VoiceAssistant
  pageContext="dashboard"
  onTranscriptReceived={(text) => console.log('User said:', text)}
  onResponseGenerated={(response) => console.log('AI responded:', response)}
/>
```

## User Flow

1. **User clicks microphone button** → Component requests mic permission
2. **Recording starts** → Visual feedback shows listening state with volume meter
3. **User speaks** → Audio is captured with real-time volume visualization
4. **User clicks to stop** → Recording stops and sends audio to Whisper API
5. **Transcription** → Whisper converts speech to text
6. **Response generation** → AI generates appropriate response
7. **Text-to-Speech** → Response is converted to audio via ElevenLabs
8. **Playback** → User hears the response with visual progress

## Visual States

### Idle State
- Blue microphone button
- "Click to start speaking" tooltip
- No animations

### Listening State
- Red microphone button
- Pulsing ripple animation scaled by volume
- Volume meter below button
- "Listening..." status card

### Processing State
- Gray button with spinning loader
- "Transcribing..." status card
- Button disabled

### Responding State
- VoiceInteraction component appears
- Audio playback with progress ring
- Message text displayed
- Action buttons (Close, Replay, Chat)

### Error State
- Red button
- Error message card below
- Click to retry

## Privacy & Security

### Data Handling
- **Audio files are NEVER stored** - Only kept in memory during processing
- **Automatic cleanup** - Audio deleted immediately after transcription
- **HTTPS only** - All API calls are encrypted in transit
- **No persistent storage** - Transcripts not saved unless explicitly chosen

### HIPAA Compliance Considerations
1. **BAA Required** with:
   - OpenAI (Whisper API)
   - ElevenLabs (TTS)
   - Supabase (hosting)

2. **Audit Logging** - All interactions logged (without PHI)
3. **User Consent** - Required before first use
4. **Encrypted Transit** - TLS for all communications

### Browser Permissions
- Microphone access required
- HTTPS connection required
- User gesture required to start recording

## Performance Metrics

### Target Latency Breakdown
- Audio capture: ~0.5s (user speaks)
- Upload: ~0.3s
- Transcription: ~1.0s (Whisper API)
- Response generation: ~1.0s (GPT-4)
- TTS generation: ~0.8s (ElevenLabs)
- Playback start: ~0.2s
- **Total: ~3.8 seconds**

### Optimization Opportunities
1. Use streaming transcription for real-time feedback
2. Start TTS while GPT is still generating
3. Cache common responses
4. Use GPT-4o-mini for faster/cheaper responses

## Cost Analysis

### Per Interaction Cost
- Whisper API: $0.006/minute (~$0.003 per 30s interaction)
- GPT-4o: ~$0.0015 per response
- ElevenLabs: ~$0.02 per response
- **Total: ~$0.025 per interaction**

### Monthly Estimates
- 100 interactions/user/month: $2.50/user
- 1,000 users: $2,500/month
- 10,000 users: $25,000/month

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge | Mobile Safari | Mobile Chrome |
|---------|--------|--------|---------|------|---------------|---------------|
| MediaRecorder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ | ⚠️ HTTPS only | ⚠️ HTTPS only |
| Web Audio API | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audio Playback | ✅ | ✅ | ✅ | ✅ | ⚠️ User gesture | ⚠️ User gesture |

⚠️ = Works with limitations

## Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Required in Supabase Edge Functions (auto-configured):
```bash
OPENAI_API_KEY=your_openai_api_key
```

## Troubleshooting

### Common Issues

**1. "Microphone access denied"**
- User needs to grant browser microphone permissions
- Ensure HTTPS connection
- Check browser settings for microphone access

**2. "Recording too short"**
- User must speak for at least 1 second
- Check that audio is actually being captured
- Verify microphone is working in system settings

**3. "Transcription failed"**
- Check OPENAI_API_KEY is configured in Supabase
- Verify API quota/billing
- Check network connectivity

**4. "No audio playback"**
- Ensure speakers/headphones are working
- Check browser audio permissions
- Verify ElevenLabs TTS is working

### Debug Mode

Enable console logging to debug:
```typescript
// In VoiceAssistant.tsx
console.log('State:', state);
console.log('Transcript:', transcript);
console.log('Audio blob size:', audioBlob.size);
```

## Future Enhancements

### Phase 2 (Planned)
- [ ] Wake word detection ("Hey Health Assistant")
- [ ] Streaming transcription for real-time feedback
- [ ] Multi-language support
- [ ] Voice biometrics for authentication

### Phase 3 (Future)
- [ ] Ambient listening mode
- [ ] Conversation memory/context
- [ ] Voice-activated navigation
- [ ] Custom voice selection

## Testing Checklist

- [ ] Microphone permission flow works
- [ ] Recording captures audio properly
- [ ] Volume meter shows accurate levels
- [ ] Transcription returns accurate text
- [ ] Response generation works
- [ ] TTS playback works
- [ ] Error states display correctly
- [ ] Works on mobile devices
- [ ] Works in different browsers
- [ ] HTTPS requirement enforced

## Resources

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [ElevenLabs TTS API](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Support

For questions or issues:
1. Check console logs for errors
2. Verify environment variables
3. Test microphone in browser settings
4. Check network connectivity
5. Review Supabase function logs
