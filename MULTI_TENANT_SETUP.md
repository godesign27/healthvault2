# Multi-Tenant Domain Setup Guide

This guide explains how to set up and use the multi-tenant subdomain routing system for HealthVault.

## Overview

HealthVault supports multiple organizations through subdomain-based routing:

- **Super Admin Interface**: `admin.healthvault.me` or `healthvault.me/admin` - System administration
- **Provider Admin Interfaces**: `[org-subdomain].healthvault.me` - Organization-specific dashboards
  - Example: `acme-clinic.healthvault.me`
  - Example: `riverside-health.healthvault.me`

## DNS Configuration

### 1. Set Up Wildcard DNS

Add a wildcard CNAME record in your DNS settings:

```
Type: CNAME
Name: *
Value: your-deployment-url.netlify.app (or your hosting platform URL)
TTL: Auto or 3600
```

This allows any subdomain (e.g., `acme-clinic.healthvault.me`, `riverside-health.healthvault.me`) to resolve to your application.

### 2. Add Admin Subdomain (Optional)

If you want a dedicated admin subdomain, add:

```
Type: CNAME
Name: admin
Value: your-deployment-url.netlify.app
TTL: Auto or 3600
```

### 3. Root Domain

Ensure your root domain is also configured:

```
Type: A or CNAME (depending on your DNS provider)
Name: @
Value: your-deployment-url or IP address
TTL: Auto or 3600
```

## Local Development

During local development (localhost), the subdomain routing uses query parameters instead:

- **Super Admin**: `http://localhost:5173/admin` or `http://localhost:5173/`
- **Provider Admin**: `http://localhost:5173/?subdomain=acme-clinic`

Example URLs:
- `http://localhost:5173/?subdomain=acme-clinic` - Acme Medical Clinic admin
- `http://localhost:5173/?subdomain=riverside-health` - Riverside Health admin
- `http://localhost:5173/?subdomain=city-general` - City General Hospital admin

## Database Schema

### Organizations Table

Stores organization information:

- `id` - UUID primary key
- `name` - Organization name
- `subdomain` - Unique subdomain slug (e.g., 'acme-clinic')
- `slug` - URL-friendly slug
- `logo_url` - Organization logo
- `primary_color` - Brand color
- `contact_email` - Contact email
- `contact_phone` - Contact phone
- `address` - JSONB address details
- `settings` - JSONB organization settings
- `status` - active, inactive, or suspended
- `subscription_tier` - free, basic, professional, or enterprise
- `subscription_expires_at` - Subscription expiration
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Organization Admins Table

Maps users to organizations with roles:

- `id` - UUID primary key
- `organization_id` - Reference to organization
- `user_id` - Reference to auth.users
- `role` - owner, admin, or staff
- `permissions` - JSONB granular permissions
- `created_at` - Assignment timestamp

### Organization Patients Table

Maps patients to organizations:

- `id` - UUID primary key
- `organization_id` - Reference to organization
- `patient_id` - Patient user ID
- `patient_number` - Organization-specific patient ID
- `notes` - Optional notes
- `assigned_at` - Assignment timestamp

## Adding a New Organization

### Via SQL

```sql
INSERT INTO organizations (name, subdomain, slug, contact_email, contact_phone, status)
VALUES ('New Clinic', 'new-clinic', 'new-clinic', 'contact@new-clinic.com', '(555) 000-0000', 'active');
```

### Via Super Admin Interface

1. Navigate to `admin.healthvault.me`
2. Click "Add Organization"
3. Fill in the organization details
4. The subdomain will be automatically available

## Assigning Admins to Organizations

```sql
-- Get the user ID from auth.users
-- Get the organization ID from organizations table

INSERT INTO organization_admins (organization_id, user_id, role)
VALUES ('organization-uuid', 'user-uuid', 'owner');
```

Roles:
- `owner` - Full control, can manage other admins
- `admin` - Can manage patients and settings
- `staff` - Limited access

## Security

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

1. **Organizations**
   - Public can view active organizations
   - Only super admins can create, update, or delete

2. **Organization Admins**
   - Users can view their own assignments
   - Organization owners can manage their org's admins
   - Super admins can manage all

3. **Organization Patients**
   - Patients can view their assignments
   - Organization admins can view and manage their patients

### Super Admin Access

Super admin status is controlled via the `auth.users.raw_app_meta_data` field:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb
WHERE email = 'admin@healthvault.me';
```

## Routing Logic

The application checks subdomains in this order:

1. **Share Routes** (`/share/*`) - Always processed first
2. **Super Admin Routes**
   - No subdomain OR
   - Subdomain is 'admin' OR
   - Subdomain is 'www' OR
   - Path is `/admin`
3. **Provider Admin Routes**
   - Any other subdomain that matches an active organization

## Accessing Interfaces

### Production

- Super Admin: `https://admin.healthvault.me` or `https://healthvault.me/admin`
- Provider (Acme Clinic): `https://acme-clinic.healthvault.me`
- Provider (Riverside Health): `https://riverside-health.healthvault.me`

### Local Development

- Super Admin: `http://localhost:5173/admin`
- Provider (Acme Clinic): `http://localhost:5173/?subdomain=acme-clinic`
- Provider (Riverside Health): `http://localhost:5173/?subdomain=riverside-health`

## Sample Organizations

The system comes pre-seeded with three sample organizations:

1. **Acme Medical Clinic**
   - Subdomain: `acme-clinic`
   - Contact: contact@acme-clinic.com

2. **Riverside Health**
   - Subdomain: `riverside-health`
   - Contact: info@riverside-health.com

3. **City General Hospital**
   - Subdomain: `city-general`
   - Contact: admin@city-general.com

## Troubleshooting

### Organization Not Found

If you see "Organization Not Found":

1. Check that the subdomain matches exactly (case-sensitive)
2. Verify the organization status is 'active' in the database
3. Check DNS propagation (can take up to 48 hours)

### Access Denied

If you can't access an organization:

1. Verify you're in the `organization_admins` table for that org
2. Check your role has the necessary permissions
3. Ensure your user session is active

### Local Development Not Working

If query parameters don't work:

1. Clear your browser cache
2. Try incognito/private browsing mode
3. Check the browser console for errors
4. Verify the subdomain query parameter is correct

## Architecture Notes

The subdomain detection logic is in `src/lib/subdomain.ts` and provides:

- `parseSubdomain()` - Parse current hostname and return subdomain info
- `getOrganizationFromSubdomain()` - Get organization slug from subdomain
- `isSuperAdminDomain()` - Check if current domain is super admin
- `isProviderDomain()` - Check if current domain is a provider admin
- `buildUrl()` - Build a URL for a specific subdomain

The routing happens at the App level in `src/App.tsx` before any other routing logic.
