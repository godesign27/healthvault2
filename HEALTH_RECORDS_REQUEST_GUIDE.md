# Health Records Request Flow - AI Assistant Guide

## Overview

This guide defines the AI-assisted "Request Medical Records" flow within the authenticated Health Vault product, specifically in the Health Records area.

---

## Context

- The Health Records page already exists and shows a list of records for the patient
- Clicking a record opens a modal with tabs: Summary, Document, and Insights
- A Health Assistant panel exists on the right side of the page
- The Health Assistant is the primary interface for initiating and guiding the medical record request flow
- A manual form fallback is available for users who prefer traditional forms

---

## Product Goal

Enable patient users to request medical records from a provider in a way that feels simple, safe, and guided.

**Behavior:**
- If the provider is connected: automatically check for and obtain records
- If not connected: capture and track a record request

---

## Design & UX Direction

### Core Principles

- **AI-first, form-second**: The assistant leads, forms are fallback
- **One step at a time**: Progressive disclosure, never overwhelm
- **Extremely simple and low-friction**: Reduce cognitive load
- **Conversational choices**: Use quick actions, chips, and buttons
- **Trustworthy and private**: Healthcare-appropriate language and security
- **Always provide a way forward**: Never leave users stuck

### Tone & Voice

The assistant must be:
- Calm and clear
- Supportive and respectful
- Concise and human
- Medically appropriate

**Avoid:**
- Overly technical language
- Long explanations
- Legal-heavy phrasing
- Robotic responses
- Excessive enthusiasm

---

## Implementation Requirements

### 1. Primary CTA on Health Records Page

**Button:** "Request Records"
- Visible near the top of the Health Records page
- Opens the AI-assisted request flow

### 2. AI Assistant Suggestion Card

**In Assistant Panel:**
- "Find or request medical records"
- Initiates the guided flow when clicked

### 3. Record Requests Status Area

**Location:** New section near the top of Health Records page, or new tab/filter/accordion

**Shows request cards with statuses:**
- Requested
- Checking connected provider
- In progress
- Completed
- Action needed
- Unable to retrieve

### 4. Manual Fallback Option

**Available at any point:**
- "Fill out request manually"
- Opens a structured manual request form
- Short, approachable, non-bureaucratic

---

## AI-Assisted Flow

### Entry Points

The assistant may be triggered by:
- "Request Records" button click
- "Find or request medical records" suggestion
- User asks for missing records
- Empty state prompt

### Default Opening Message

**Prompt:**
"I can help you find or request medical records. Do you know which provider they're from, or would you like help searching?"

**Quick Replies:**
- I know the provider
- Help me search
- Fill out request manually

---

## Flow Path A: Known Provider

### Step 1: Select Provider

**Prompt:**
"Which provider would you like to request records from?"

**Behavior:**
- Show connected providers first
- Allow search for other providers

### Step 2: Select Record Type

**Prompt:**
"What kind of records do you need?"

**Options:**
- Lab results
- Imaging
- Visit summaries
- Specialist reports
- Full medical record
- Other

### Step 3: Select Date Range

**Prompt:**
"What time period should I look for?"

**Options:**
- Most recent
- Last 12 months
- Custom range
- All available

### Step 4: Consent & Authorization

**Prompt:**
"I'll use your authorization to check for or request these records securely."

**Required Checkbox:**
"I authorize Health Vault to request or retrieve these medical records on my behalf."

### Step 5: System Handling

#### If Provider is Connected

**Attempt automatic retrieval first**

**If successful:**
"Good news — I found records from this provider and added them to your Health Records."

**Actions:**
- View records
- Request more records
- Done

**If not immediately found:**
"I checked this provider, but I couldn't retrieve matching records right away. I can still submit a request and track it for you."

**Actions:**
- Submit request
- Edit details
- Cancel

#### If Provider is NOT Connected

**Message:**
"This provider is not currently connected for instant retrieval. I can submit a request and keep you updated."

**Actions:**
- Submit request
- Fill out manually
- Cancel

---

## Flow Path B: Provider Search

### Step 1: Suggest Providers

**Prompt:**
"I can help look for likely providers based on your history."

**Behavior:**
Suggest providers based on:
- Connected providers
- Existing records
- Insurance/provider history
- Prior care context

**Message:**
"Here are some providers that may have records for you."

**Actions:**
- Provider selections (buttons/cards)
- Search another provider
- Fill out request manually

### Step 2: Confirm Provider

**Prompt:**
"Do you want to request records from [Provider Name]?"

**Actions:**
- Yes
- Choose another
- Fill out manually

**Then continue with:**
- Record type selection
- Date range selection
- Consent confirmation

---

## Manual Fallback Flow

### Trigger
User selects "Fill out request manually" at any point

### Opening Message

**Prompt:**
"No problem — you can fill out the request yourself. I'll keep it simple."

### Form Fields (in modal/drawer)

**Required:**
- Provider or facility name
- Record type requested
- Date range
- Consent checkbox/authorization

**Optional:**
- Provider type or department
- Reason for request
- Additional notes

**Design notes:**
- Keep form short and approachable
- Do not make it feel bureaucratic
- Mobile-responsive and accessible

### After Submission

**Message:**
"Your request has been submitted. I'll keep track of the status here."

**Actions:**
- View request status
- Request another record
- Done

---

## Request Status Messaging

Use simple, calm updates in the Record Requests section.

### Status States

| Status | Message |
|--------|---------|
| **Requested** | "Your request has been submitted." |
| **Checking Connected Provider** | "I'm checking this provider for available records." |
| **In Progress** | "Your request is in progress. I'll let you know when there's an update." |
| **Action Needed** | "I need one more thing to continue this request." |
| **Completed** | "Your requested records are now available in Health Records." |
| **Unable to Retrieve** | "I couldn't retrieve these records yet. You can try again or submit a manual request." |

---

## Error Handling

### Provider Not Found
"I couldn't find a match right now. You can search again or fill out the request manually."

### Connection Failure
"I couldn't connect to this provider right now. I can still help you submit a request."

### Missing Consent
"I need your authorization before I can check for or request records."

---

## Behavioral Rules

1. **Always guide step-by-step**: One question at a time
2. **Prefer quick replies over open input**: Use buttons and chips
3. **Default to connected providers first**: Easiest path for users
4. **Attempt automatic retrieval before requesting**: Check connected providers instantly
5. **Always offer manual fallback**: When uncertainty or friction appears
6. **Confirm actions before submitting**: Clear consent and authorization
7. **Provide feedback after every major step**: Keep users informed

---

## Decision Logic

```
IF user wants records:
  → Offer: known provider | provider search | manual fallback

IF provider is connected:
  → Attempt retrieval first

  IF retrieval succeeds:
    → Show success and link to records

  IF retrieval fails:
    → Offer request submission

IF provider is not connected:
  → Create request flow

IF user hesitates or is unclear:
  → Offer manual fallback

IF user explicitly prefers manual:
  → Immediately switch to manual form
```

---

## UI Components Needed

### New Components

1. **Request Records Button**: Primary CTA in Health Records header
2. **Record Request Card**: Status card showing request progress
3. **Manual Request Form**: Modal/drawer with structured form
4. **Provider Suggestion Cards**: Clickable provider options
5. **Record Type Selector**: Button group or chip selector
6. **Date Range Picker**: Quick options + custom range
7. **Consent Confirmation**: Checkbox with clear authorization text

### States Required

- **Success state**: Records found and added
- **Loading state**: Checking provider or processing request
- **Empty state**: No requests yet, prompt to create one
- **Error state**: Unable to retrieve or submit
- **In-progress state**: Request submitted, tracking status

---

## Data Structures

### Record Request Object

```typescript
{
  id: string;
  userId: string;
  providerId?: string;
  providerName: string;
  recordType: 'lab' | 'imaging' | 'visit-summary' | 'specialist' | 'full' | 'other';
  dateRange: {
    type: 'recent' | 'last-12-months' | 'custom' | 'all';
    startDate?: string;
    endDate?: string;
  };
  status: 'requested' | 'checking' | 'in-progress' | 'completed' | 'action-needed' | 'unable';
  consentGiven: boolean;
  consentDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  retrievedRecordIds?: string[];
}
```

---

## Success Criteria

The flow is successful when:
- Users can request records in under 60 seconds
- Users do not need to understand healthcare systems
- Users feel confident their request is being handled
- Users can track progress clearly
- Users can fall back to manual without frustration

---

## UI Alignment

- Use chips and buttons for choices
- Keep messages short (1–2 sentences max)
- Maintain consistent spacing and readability
- Align with Health Vault visual system (stone color palette, clean typography)
- Reinforce trust and privacy visually and verbally
- Mobile-responsive and accessible
- Use progressive disclosure throughout

---

## Privacy & Security Considerations

- Always require explicit consent before retrieving or requesting records
- Use clear, non-scary language about authorization
- Show visual indicators of secure/encrypted connections
- Never expose sensitive data without user action
- Log all record requests for audit purposes
- Allow users to view and cancel pending requests

---

## Integration Points

### Connected Providers
- Check if provider has active connection
- Attempt automatic retrieval via API if connected
- Show connection status to user

### Manual Requests
- Create tracked request record in database
- Send notification to provider (future enhancement)
- Allow status updates from provider portal (future enhancement)

### Notifications
- Notify user when records are found
- Notify user when request status changes
- Notify user if action is needed

---

## Future Enhancements

- Provider portal integration for request status updates
- Automatic notifications via email/SMS
- Bulk record requests from multiple providers
- Smart suggestions based on care gaps or upcoming appointments
- Integration with insurance records to suggest providers
- Document upload for manual record submission

---

## End of Guide
