# Voice Assistant Integration Examples

Quick reference for adding voice capabilities to any page in the application.

## Basic Integration

### 1. Import the Component

```typescript
import { VoiceAssistant } from '../components/VoiceAssistant';
import type { PageContext } from '../lib/voice/context-messages';
```

### 2. Add to Your Page

```tsx
function MyPage() {
  return (
    <div>
      {/* Your page content */}

      {/* Voice Assistant - Fixed position */}
      <VoiceAssistant pageContext="dashboard" />
    </div>
  );
}
```

## Page-Specific Context

The `pageContext` prop helps the assistant provide context-aware responses:

```tsx
// Dashboard
<VoiceAssistant pageContext="dashboard" />

// Medical Forms
<VoiceAssistant pageContext="medical-forms" />

// Health Records
<VoiceAssistant pageContext="health-records" />

// Insurance
<VoiceAssistant pageContext="insurance" />

// Medical Profile
<VoiceAssistant pageContext="medical-profile" />

// Care Team
<VoiceAssistant pageContext="care" />

// Network
<VoiceAssistant pageContext="network" />

// Vitals
<VoiceAssistant pageContext="vitals" />
```

## Handling Transcripts

Listen for voice commands and take action:

```tsx
function MedicalProfilePage() {
  const handleVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();

    if (lower.includes('add condition')) {
      openAddConditionDialog();
    } else if (lower.includes('add medication')) {
      openAddMedicationDialog();
    }
  };

  return (
    <div>
      <VoiceAssistant
        pageContext="medical-profile"
        onTranscriptReceived={handleVoiceCommand}
      />
    </div>
  );
}
```

## Programmatic Response

Generate custom responses based on page state:

```tsx
function InsurancePage() {
  const [coverages, setCoverages] = useState([]);

  const handleVoiceInteraction = (transcript: string) => {
    // Custom logic based on transcript
    return `You have ${coverages.length} active insurance policies.`;
  };

  return (
    <div>
      <VoiceAssistant
        pageContext="insurance"
        onTranscriptReceived={(transcript) => {
          const response = handleVoiceInteraction(transcript);
          // Response will be spoken automatically
        }}
      />
    </div>
  );
}
```

## Advanced: Navigation Control

Voice-activated navigation:

```tsx
function App() {
  const navigate = useNavigate();

  const handleVoiceNavigation = (transcript: string) => {
    const lower = transcript.toLowerCase();

    if (lower.includes('go to dashboard')) {
      navigate('/dashboard');
    } else if (lower.includes('show medical forms')) {
      navigate('/medical-forms');
    } else if (lower.includes('open insurance')) {
      navigate('/insurance');
    }
  };

  return (
    <VoiceAssistant
      onTranscriptReceived={handleVoiceNavigation}
    />
  );
}
```

## Advanced: Form Filling

Use voice to fill forms:

```tsx
function AddConditionForm() {
  const [conditionName, setConditionName] = useState('');
  const [isListening, setIsListening] = useState(false);

  return (
    <div>
      <input
        value={conditionName}
        onChange={(e) => setConditionName(e.target.value)}
      />

      <button onClick={() => setIsListening(true)}>
        Speak condition name
      </button>

      {isListening && (
        <VoiceAssistant
          pageContext="medical-profile"
          onTranscriptReceived={(text) => {
            setConditionName(text);
            setIsListening(false);
          }}
        />
      )}
    </div>
  );
}
```

## Advanced: Multi-Turn Conversation

Maintain conversation context:

```tsx
function HealthRecordsPage() {
  const [conversationHistory, setConversationHistory] = useState([]);

  const handleConversation = async (transcript: string) => {
    // Add user message to history
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: transcript }
    ];

    // Generate context-aware response using GPT
    const response = await generateResponse(newHistory);

    // Add assistant response to history
    setConversationHistory([
      ...newHistory,
      { role: 'assistant', content: response }
    ]);
  };

  return (
    <div>
      <VoiceAssistant
        pageContext="health-records"
        onTranscriptReceived={handleConversation}
        onResponseGenerated={(response) => {
          console.log('Assistant said:', response);
        }}
      />
    </div>
  );
}
```

## Conditional Display

Show voice assistant only when needed:

```tsx
function ConditionalVoice() {
  const [showVoice, setShowVoice] = useState(false);

  return (
    <div>
      <button onClick={() => setShowVoice(!showVoice)}>
        Toggle Voice Assistant
      </button>

      {showVoice && (
        <VoiceAssistant pageContext="dashboard" />
      )}
    </div>
  );
}
```

## Styling Customization

The VoiceAssistant uses fixed positioning and can be styled:

```tsx
// Default: bottom-right
<VoiceAssistant pageContext="dashboard" />

// To customize, wrap in a positioned container:
<div className="fixed bottom-6 left-6 z-50">
  <VoiceAssistant pageContext="dashboard" />
</div>
```

## Error Handling

Handle errors gracefully:

```tsx
function RobustVoice() {
  const [error, setError] = useState(null);

  return (
    <div>
      {error && (
        <div className="error-banner">
          Voice error: {error}
        </div>
      )}

      <VoiceAssistant
        pageContext="dashboard"
        onTranscriptReceived={(transcript) => {
          try {
            processCommand(transcript);
            setError(null);
          } catch (err) {
            setError(err.message);
          }
        }}
      />
    </div>
  );
}
```

## Testing

Test voice interactions in development:

```tsx
function TestVoice() {
  return (
    <VoiceAssistant
      pageContext="dashboard"
      onTranscriptReceived={(text) => {
        console.log('📝 Transcript:', text);

        // Test intent detection
        if (text.includes('test')) {
          console.log('✅ Test command detected');
        }
      }}
      onResponseGenerated={(response) => {
        console.log('🔊 Response:', response);
      }}
    />
  );
}
```

## Best Practices

1. **Always provide pageContext** - Helps generate contextual responses
2. **Handle cleanup** - Component handles this automatically
3. **User feedback** - Component provides visual states
4. **Error handling** - Component shows error states
5. **HTTPS required** - Microphone access requires secure context
6. **User gesture** - First interaction requires user click

## Common Voice Commands

Train users with these example commands:

- "Show my recent lab results"
- "Add a new condition"
- "What medications am I taking?"
- "Schedule an appointment"
- "Upload a medical record"
- "Show my insurance coverage"
- "Find a specialist near me"
- "What's my next appointment?"

## Performance Tips

1. **Lazy load** - Only show when needed
2. **Debounce rapid commands** - Prevent multiple simultaneous requests
3. **Cache responses** - Store common responses
4. **Limit context** - Keep conversation history reasonable
5. **Monitor costs** - Track API usage

## Accessibility

The VoiceAssistant is accessible:
- Keyboard navigable (Tab, Enter, Space)
- Screen reader announcements for state changes
- Clear visual indicators for all states
- Error messages are announced
- ARIA labels on interactive elements
