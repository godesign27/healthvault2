# Context-Aware Voice & Chat System

## Overview
The Health Vault application now features a fully context-aware AI assistant that adapts its messages and responses based on the current page the user is viewing. This provides personalized, relevant assistance throughout the application.

## Architecture

### 1. Page Detection
The system automatically detects the current page using the `currentPage` state in `DashboardPage`:
- **Pages Supported**: dashboard, medical-forms, health-records, insurance, medical-profile, care, network, vitals
- **Detection Method**: Page state is passed down through component props
- **Type Safety**: Uses TypeScript `PageContext` type for compile-time validation

### 2. Context Mapping System
Located in: `/src/lib/voice/context-messages.ts`

#### Structure
```typescript
interface VoiceMessage {
  greeting: string;           // Initial greeting
  context: string;            // Page-specific context
  capabilities: string[];     // What the AI can help with on this page
  callToAction: string;       // Suggested next action
}
```

#### Example: Medical Forms Page
```typescript
'medical-forms': {
  greeting: "Hi! I'm here to help with your medical forms.",
  context: "You're on the Medical Forms page...",
  capabilities: [
    "Complete medical intake forms and questionnaires",
    "Understand medical terminology and required fields",
    ...
  ],
  callToAction: "Which form would you like help with?"
}
```

### 3. Voice Message Delivery

#### Components Flow
```
DashboardPage
    ↓ (passes currentPage)
FloatingChatActions
    ↓ (converts to voice message)
VoiceInteraction
    ↓ (sends to TTS)
ElevenLabs API
```

#### Text Chat Flow
```
DashboardPage
    ↓ (passes currentPage)
AIAssistantPanel
    ↓ (sends context to API)
ai-health-assistant Edge Function
    ↓ (uses contextual system prompt)
OpenAI API
```

## Implementation Details

### Voice Messages (Talk Button)

**File**: `src/components/FloatingChatActions.tsx`

```typescript
// Gets context-specific message
const voiceMessage = getVoiceMessageForContext(context);

// Passes to VoiceInteraction
<VoiceInteraction
  message={voiceMessage}
  ...
/>
```

**Features**:
- Automatic page detection
- Dynamic message generation
- Seamless TTS integration
- Consistent voice across pages

### Text Chat Messages

**File**: `src/components/AIAssistantPanel.tsx`

```typescript
// Initial greeting adapts to page
const getInitialMessage = () => {
  return getVoiceMessageForContext(currentPage as PageContext);
};

// Context sent to AI
body: JSON.stringify({
  message: userMessage,
  conversationHistory,
  context: currentPage  // Page context
})
```

**Features**:
- Dynamic initial greeting
- Context-aware responses
- Conversation continuity
- Page-specific suggestions

### Backend AI Processing

**File**: `supabase/functions/ai-health-assistant/index.ts`

```typescript
const getContextualSystemPrompt = (context?: string) => {
  // Base prompt for all pages
  const basePrompt = `You are the Health Vault AI...`;

  // Page-specific guidance
  const contextualGuidance = {
    'medical-forms': `Focus on helping users complete forms...`,
    'insurance': `Help understand coverage and benefits...`,
    ...
  };

  return basePrompt + contextualGuidance[context];
};
```

**Features**:
- Context-aware system prompts
- Page-specific AI behavior
- Consistent tone across contexts
- Intelligent tool usage

## Page-Specific Messages

### Dashboard
**Focus**: General navigation and health overview
**Capabilities**: View health overview, access records, manage care team
**Call to Action**: "What would you like to explore today?"

### Medical Forms
**Focus**: Form completion and understanding
**Capabilities**: Complete forms, understand terminology, share securely
**Call to Action**: "Which form would you like help with?"

### Health Records
**Focus**: Record interpretation and organization
**Capabilities**: Review results, understand reports, track trends
**Call to Action**: "Would you like me to explain any test results?"

### Insurance
**Focus**: Coverage understanding and claims
**Capabilities**: Understand benefits, connect providers, track claims
**Call to Action**: "Do you need help understanding your coverage?"

### Medical Profile
**Focus**: Profile management and updates
**Capabilities**: Manage conditions, medications, allergies
**Call to Action**: "Would you like to add a new condition or medication?"

### Care
**Focus**: Provider relationships and appointments
**Capabilities**: Manage care team, schedule appointments, track visits
**Call to Action**: "Do you need to schedule an appointment?"

### Network
**Focus**: Provider and pharmacy management
**Capabilities**: Find providers, add pharmacies, check coverage
**Call to Action**: "Are you looking for a new provider?"

### Vitals
**Focus**: Health metrics tracking
**Capabilities**: Record vitals, understand trends, share with providers
**Call to Action**: "Would you like to record new measurements?"

## User Experience Benefits

### Personalization
- Messages feel tailored to current task
- Reduces cognitive load
- Increases engagement

### Relevance
- Suggestions match page functionality
- Contextual help at the right time
- Fewer irrelevant responses

### Consistency
- Same friendly tone across pages
- Predictable behavior
- Professional medical communication

### Efficiency
- Faster task completion
- Fewer clarifying questions needed
- Direct path to user goals

## Error Handling

### Unknown Pages
- Falls back to dashboard context
- Generic but helpful message
- Graceful degradation

### Missing Context
- Default to 'dashboard' context
- Never breaks user experience
- Logs for debugging (if implemented)

### API Failures
- Voice: Shows retry button
- Chat: Displays error message
- Maintains conversation state

## Testing Context Awareness

### Manual Testing
1. Navigate to each page
2. Click "Talk" button
3. Verify voice message matches page context
4. Open chat panel
5. Verify initial greeting matches page context
6. Send messages and verify AI responses are contextual

### Expected Behavior
- ✅ Different greeting for each page
- ✅ Page-specific capabilities mentioned
- ✅ Relevant call-to-actions
- ✅ Context persists during conversation
- ✅ Smooth transitions between pages

## Future Enhancements

### Possible Additions
1. **User State Awareness**: Detect if user has data vs. empty state
2. **Time-based Context**: Different messages based on time of day
3. **Journey Stage**: First-time vs. returning user messaging
4. **Task Completion**: Celebrate completed tasks
5. **Proactive Suggestions**: Based on user behavior patterns

### Analytics Integration
- Track which contexts get most engagement
- Measure task completion by context
- A/B test different messages
- Optimize call-to-actions

## Maintenance

### Adding New Pages
1. Add page to `PageContext` type in `context-messages.ts`
2. Create voice message in `voiceMessages` object
3. Update `currentPage` state to include new page
4. Test voice and chat on new page

### Updating Messages
1. Edit messages in `src/lib/voice/context-messages.ts`
2. Maintain consistent structure (greeting, context, capabilities, CTA)
3. Keep tone friendly and professional
4. Test TTS pronunciation if needed

### Monitoring
- Review user feedback on AI helpfulness
- Track conversation metrics by page
- Identify pages needing better context
- Iterate based on usage patterns

## Code Locations

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Context Messages | `/src/lib/voice/context-messages.ts` | Message templates |
| Voice Component | `/src/components/FloatingChatActions.tsx` | Voice trigger |
| Voice Modal | `/src/components/VoiceInteraction.tsx` | TTS playback |
| Chat Panel | `/src/components/AIAssistantPanel.tsx` | Text chat |
| AI Backend | `/supabase/functions/ai-health-assistant/index.ts` | AI processing |
| Dashboard | `/src/pages/DashboardPage.tsx` | Context provider |

## Summary

The context-aware voice and chat system provides intelligent, page-specific assistance throughout the Health Vault application. By detecting the current page and delivering tailored messages, the AI assistant creates a more personalized, relevant, and efficient user experience. The system is extensible, maintainable, and designed for continuous improvement based on user feedback and behavior.
