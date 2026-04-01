# Insurance Management Module

A comprehensive insurance management system for Health Vault, allowing users to connect, manage, and verify their insurance coverage.

## Overview

This module provides a complete solution for managing insurance coverage information with support for multiple insurance providers, coverage verification, and integration across the Health Vault application.

## Features Implemented

### 1. Database Schema
- **insurance_providers**: Stores insurance provider information with logos and metadata
- **insurance_coverages**: Stores user insurance coverage details with privacy-focused member ID hashing
- **audit_events**: Tracks all insurance-related events for compliance and debugging

### 2. Core Components

#### StatusBadge (`src/components/insurance/StatusBadge.tsx`)
Displays coverage verification status with color-coded badges:
- Connected (green)
- Verifying (blue)
- Needs Attention (amber)
- Expiring Soon (orange)

#### CoverageCard (`src/components/insurance/CoverageCard.tsx`)
Full-featured card displaying coverage details with actions:
- Set as primary coverage
- Refresh verification
- Edit coverage
- Remove coverage
- Masked member ID display
- Status badge integration

#### ProviderPickerDrawer (`src/components/insurance/ProviderPickerDrawer.tsx`)
Modal drawer for selecting insurance providers:
- Search functionality
- Popular providers grid
- All providers list
- Provider logos
- Responsive 480px width

#### ConnectMethodTabs (`src/components/insurance/ConnectMethodTabs.tsx`)
Tab interface for different connection methods:
- OAuth (placeholder for future implementation)
- Upload (placeholder for future implementation)
- Manual entry (fully functional)

#### ManualForm (`src/components/insurance/ManualForm.tsx`)
Validated form for manual insurance entry:
- Zod schema validation
- Required fields: Plan name, Member ID, Effective start date
- Optional fields: Group number, BIN, PCN, Effective end date
- Relationship selector
- Real-time validation feedback

#### InsuranceSummary (`src/components/insurance/InsuranceSummary.tsx`)
Compact summary component for displaying primary coverage:
- Used in Care page
- Shows provider logo and basic info
- Link to full insurance page

### 3. Pages

#### InsurancePage (`src/pages/InsurancePage.tsx`)
Main insurance management page:
- Empty state prompting to use AI Assistant
- List of all coverages
- Primary coverage highlighted
- Add coverage flow integrated with AI Assistant via actionsRef
- Actions: set primary, verify, delete
- Toast notifications for all operations
- No direct "Add Coverage" buttons (handled by AI Assistant)

### 4. Data Layer

#### Types & Schemas (`src/schemas/insurance.ts`)
Comprehensive type definitions:
- `InsuranceProvider`: Provider information
- `Coverage`: Coverage details with validation
- `CoverageWithProvider`: Extended coverage with provider details
- `AuditEvent`: Event tracking
- Utility functions: `hashMemberId()`, `maskMemberId()`

#### FHIR Mapper (`src/lib/insurance/fhirToCoverage.ts`)
Converts FHIR Coverage resources to internal format:
- Maps FHIR fields to Zod schema
- Extracts group number, BIN, PCN from FHIR classes
- Validates FHIR resources

#### Analytics (`src/lib/insurance/analytics.ts`)
Event tracking for insurance operations:
- `insurance.connect.opened`
- `insurance.connect.success`
- `insurance.connect.failed`
- `insurance.verify.refresh`
- `insurance.set_primary`
- Timing and error tracking

#### Hooks (`src/lib/insurance/useInsuranceConnection.ts`)
State management for insurance connection flow:
- States: idle → connecting → verifying → success/failure
- Automatic verification simulation
- Audit event creation
- Error handling

### 5. Integration Points

#### Sidebar Navigation
- Added "Insurance" menu item with ShieldCheck icon
- Positioned after "Care" in the navigation
- Active state highlighting

#### Care Page
- Insurance summary section
- Displays primary coverage
- Link to full insurance page

#### DashboardPage
- Routes to InsurancePage on "insurance" page selection
- Passes insuranceActionsRef to enable AI Assistant integration
- Dark mode support

#### AI Assistant Panel
- Context-aware quick actions for insurance page
- "Add Coverage" button triggers provider picker drawer
- Additional insurance-related prompts:
  - View Benefits
  - Find Providers
  - Check Claims

## Database Setup

The migration `create_insurance_schema` includes:
- Table creation with proper constraints
- Row Level Security (RLS) policies
- Indexes for performance
- 10 pre-populated insurance providers
- Auto-update trigger for timestamps

### Sample Providers
- Blue Cross Blue Shield
- UnitedHealthcare
- Aetna
- Cigna
- Humana
- Kaiser Permanente
- Anthem
- Centene
- Molina Healthcare
- WellCare

## Usage Examples

### Adding Insurance Coverage

```typescript
// User selects provider from ProviderPickerDrawer
const provider = { id: 'uuid', name: 'Blue Cross Blue Shield', ... };

// User fills out manual form
const coverage = {
  providerId: provider.id,
  planName: 'Blue Shield PPO',
  memberId: 'ZXY1234567',
  groupNumber: 'G12345',
  bin: '004336',
  pcn: 'MEDDPRIME',
  relationship: 'self',
  effectiveStart: '2025-01-01T00:00:00.000Z',
  effectiveEnd: null,
  isPrimary: true,
  source: 'manual'
};

// Hook handles connection and verification
await connect(coverage);
```

### FHIR Integration Example

```typescript
import { fhirToCoverage } from './lib/insurance/fhirToCoverage';

const fhirCoverage = {
  resourceType: 'Coverage',
  status: 'active',
  subscriberId: 'ZXY1234567',
  type: {
    coding: [{
      display: 'Blue Shield PPO'
    }]
  },
  period: {
    start: '2025-01-01',
    end: null
  }
};

const coverage = fhirToCoverage(fhirCoverage, providerId, userId);
```

## Security Features

### Member ID Privacy
- Member IDs are hashed before storage using a simple hash function
- Display shows masked version: `••••••4567`
- Original member ID never stored in database

### Row Level Security
- Users can only access their own coverages
- Providers table is publicly readable (authenticated only)
- Audit events are write-only for users

### Data Validation
- All inputs validated with Zod schemas
- Client-side and server-side validation
- Type-safe throughout the stack

## Future Enhancements

### OAuth Integration
Placeholder components exist for OAuth-based insurance connections:
- Connect directly to insurance provider APIs
- Auto-populate coverage data
- Real-time eligibility verification

### Card Upload with OCR
Placeholder for insurance card image upload:
- Camera/file upload
- OCR extraction of card data
- Auto-fill form fields

### Real Eligibility Verification
Current mock verifier can be replaced with:
- Integration with insurance verification APIs
- Real-time eligibility checks
- Automatic expiration warnings

### Onboarding Flow
Insurance connection can be added as an optional onboarding step:
- Feature flag: `insuranceOnboardingEnabled`
- Skippable step in user onboarding
- Analytics tracking for skip rate

## File Structure

```
src/
├── components/
│   └── insurance/
│       ├── StatusBadge.tsx
│       ├── CoverageCard.tsx
│       ├── ProviderPickerDrawer.tsx
│       ├── ConnectMethodTabs.tsx
│       ├── ManualForm.tsx
│       └── InsuranceSummary.tsx
├── lib/
│   └── insurance/
│       ├── fhirToCoverage.ts
│       ├── analytics.ts
│       └── useInsuranceConnection.ts
├── pages/
│   ├── InsurancePage.tsx
│   ├── CarePage.tsx (integrated)
│   └── DashboardPage.tsx (routing)
├── schemas/
│   └── insurance.ts
└── components/
    └── DashboardSidebar.tsx (navigation)

supabase/
└── migrations/
    └── create_insurance_schema.sql
```

## Testing Recommendations

### Unit Tests
- Zod schema validation
- `fhirToCoverage` mapper
- `hashMemberId` and `maskMemberId` utilities

### Integration Tests
- Full connection flow
- Set primary coverage
- Verification refresh
- Coverage deletion

### E2E Tests
- Add coverage → verify → set primary
- Multiple coverage management
- Navigation between pages

## Analytics Events

All insurance operations emit events for tracking:
- User journey through connection flow
- Success/failure rates by method
- Duration metrics
- Error codes and messages

## API Integration

For production deployment, implement these server actions:
- `POST /api/insurance/connect` - Create coverage
- `POST /api/insurance/verify` - Verify eligibility
- `PATCH /api/insurance/:id` - Update coverage
- `DELETE /api/insurance/:id` - Remove coverage
- `POST /api/insurance/:id/setPrimary` - Set primary coverage

Current implementation uses Supabase client directly for demo purposes.
