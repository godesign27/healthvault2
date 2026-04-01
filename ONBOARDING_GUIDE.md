# Onboarding Flow Guide

## Overview

A complete wizard-style onboarding flow has been implemented with 4 steps. The flow is integrated into the application with proper guards and routing.

## Features

### Database Schema
- **user_profiles** - Extended with identity fields, verification flags, and onboarding status
- **insurance_policies** - Stores insurance information with optional card images
- **user_preferences** - Stores user health assistance preferences

### Onboarding Steps

#### Step 0: Start (/onboarding → start)
- Welcome screen with overview of the onboarding process
- Explains what's required (identity) vs optional (insurance, preferences)
- AI assistant explains timing and data security

#### Step 1: Identity Verification (Required)
- Collects personal information:
  - First name, last name
  - Date of birth
  - Phone number
  - Full address
  - Optional: Last 4 of SSN
- Form validation with inline error messages
- Saves to database and sets `identity_verified = true`
- AI assistant explains why identity is needed
- Quick action to use demo data for testing

#### Step 2: Insurance Provider (Optional)
- Add insurance information:
  - Carrier name, member ID
  - Group number, plan type
  - Claims phone
  - Upload card images (front/back)
- Can skip entirely
- AI assistant provides help reading insurance cards
- Quick action to use demo data

#### Step 3: Health Preferences (Optional)
- Toggle preferences for AI assistance:
  - Help with lab results
  - Help with medical forms
  - Help with providers
  - Wellness suggestions
- Each preference has detailed explanation
- Can skip or use quick actions to turn all on/off
- AI assistant explains what each toggle does

#### Step 4: Complete
- Marks `onboarding_complete = true` in database
- Shows summary of completed steps
- Displays what was added vs what can be done later
- Lists next steps in the application
- Redirects to Dashboard

## User Flow

### New User
1. User signs in for the first time
2. After login, checks if `onboarding_complete = false`
3. Redirects to onboarding flow (Step 0)
4. Must complete identity verification
5. Can skip insurance and preferences
6. After completion, redirects to Dashboard

### Returning User
1. User signs in
2. Checks if `onboarding_complete = true`
3. Redirects directly to Dashboard
4. Cannot access onboarding again (it's complete)

### Resumable Flow
- If user drops out mid-onboarding, they can resume
- System checks onboarding status on each login
- Incomplete onboarding blocks access to Dashboard until identity is verified

## Guards & Routing

The App.tsx includes:
- Authentication check before allowing access
- Onboarding status check after authentication
- Auto-redirect to onboarding for incomplete users
- Auto-redirect to dashboard for completed users
- Step-based navigation with forward/back buttons

## Testing the Flow

### Quick Test with Demo Data

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Trigger onboarding** (Multiple entry points)
   - **From Pricing Page**: Click any "Get Started" button (Free, Personal, or Family Vault plans)
     - If authenticated: Goes directly to onboarding
     - If not authenticated: Goes to login first, then onboarding
   - **From Marketing**: Click "Login" or "Get Started"
   - You'll be redirected to onboarding

3. **Step 1: Identity**
   - Click "Use demo data" quick action
   - Review pre-filled form
   - Click "Continue"

4. **Step 2: Insurance** (Choose one)
   - Option A: Click "Use demo data" and "Continue"
   - Option B: Click "Skip for now"
   - Option C: Click "I don't have insurance"

5. **Step 3: Preferences** (Choose one)
   - Option A: Click "Turn everything on"
   - Option B: Select individual preferences
   - Option C: Click "Skip for now"

6. **Step 4: Complete**
   - Review summary
   - Click "Go to Dashboard"

### Manual Testing

Follow the same flow but manually enter data at each step to test validation.

## AI Assistant Features

Each step includes an AI assistant panel that:
- Explains why information is being collected
- Provides context about the current step
- Offers quick actions for common tasks:
  - Skip steps
  - Fill demo data
  - Get help understanding fields
  - Toggle all preferences

## Database Queries

### Check onboarding status
```sql
SELECT onboarding_complete, identity_verified
FROM user_profiles
WHERE user_id = 'demo-user';
```

### Reset onboarding (for testing)
```sql
UPDATE user_profiles
SET onboarding_complete = false, identity_verified = false
WHERE user_id = 'demo-user';

DELETE FROM insurance_policies WHERE user_id = 'demo-user';
DELETE FROM user_preferences WHERE user_id = 'demo-user';
```

### View onboarding data
```sql
-- Profile data
SELECT * FROM user_profiles WHERE user_id = 'demo-user';

-- Insurance data
SELECT * FROM insurance_policies WHERE user_id = 'demo-user';

-- Preferences data
SELECT * FROM user_preferences WHERE user_id = 'demo-user';
```

## Key Files

### Components
- `src/components/OnboardingLayout.tsx` - Shared layout with progress indicator
- `src/components/OnboardingAssistantPanel.tsx` - AI assistant sidebar

### Pages
- `src/pages/OnboardingStartPage.tsx` - Welcome/intro step
- `src/pages/OnboardingIdentityPage.tsx` - Identity verification form
- `src/pages/OnboardingInsurancePage.tsx` - Insurance information form
- `src/pages/OnboardingPreferencesPage.tsx` - Health preferences toggles
- `src/pages/OnboardingCompletePage.tsx` - Completion summary

### Integration
- `src/App.tsx` - Routing logic and guards

### Database
- `supabase/migrations/*_extend_profiles_for_onboarding.sql`
- `supabase/migrations/*_create_insurance_policies_table.sql`
- `supabase/migrations/*_create_user_preferences_table.sql`

## Notes

- Uses existing Supabase patterns
- Compatible with existing auth system
- All data properly secured with RLS
- Form validation with inline errors
- Responsive design works on mobile/desktop
- Follows existing design patterns and color scheme
- No external dependencies beyond what's already in the project
