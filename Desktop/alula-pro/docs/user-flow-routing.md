# Alula Pro User Flow and Routing

## Current Routing Structure

### Public Routes (Not Authenticated)
1. **Landing Page** (`/` → `home.tsx`)
   - Marketing page with product overview
   - Shows "Sign In" and "Start Free Trial" buttons
   - If signed in, shows "Go to Dashboard" button

2. **Sign In** (`/sign-in` → `sign-in.tsx`)
   - Clerk authentication component
   - Redirects to `/dashboard` after successful sign in

3. **Sign Up** (`/sign-up` → `sign-up.tsx`)
   - Clerk registration component
   - Redirects to `/onboarding` after successful sign up

### Protected Routes (Requires Authentication)
4. **Onboarding** (`/onboarding` → `onboarding.tsx`)
   - 3-step introduction to key features
   - Option to load sample data
   - Ends with "Go to Dashboard" button

5. **Dashboard Layout** (`/dashboard/*` → `dashboard/layout.tsx`)
   - Wraps all dashboard pages with sidebar navigation
   - Contains links to: Dashboard, Clients, Archive, Chat, Settings

6. **Dashboard Home** (`/dashboard` → `dashboard/index.tsx`)
   - Zero-search dashboard showing prioritized action cards
   - Displays urgent communications and tasks
   - Quick actions: Reply, Archive, Snooze

7. **Clients List** (`/dashboard/clients` → `dashboard/clients.tsx`)
   - Grid view of all clients
   - "Add Client" button opens modal
   - Click on client card navigates to client detail

8. **Client Detail** (`/dashboard/clients/:clientId` → `dashboard/clients.$clientId.tsx`)
   - Shows client contact information
   - Communication timeline with tabs (Timeline/Notes)
   - "Log Communication" button opens modal
   - Archive functionality for communications

9. **Archive** (`/dashboard/archive` → `dashboard/archive.tsx`)
   - Two tabs: Completed Actions / Past Communications
   - Shows archived items with restore functionality
   - Reference information about archiving purpose

10. **Chat** (`/dashboard/chat` → `dashboard/chat.tsx`)
    - AI chat interface (placeholder)

11. **Settings** (`/dashboard/settings` → `dashboard/settings.tsx`)
    - Profile and subscription management

### Other Routes
- **Pricing** (`/pricing` → `pricing.tsx`) - Subscription plans
- **Success** (`/success` → `success.tsx`) - Payment success page
- **Subscription Required** (`/subscription-required` → `subscription-required.tsx`) - Gate for paid features

## User Journey

### New User Flow
1. Lands on home page (`/`)
2. Clicks "Start Free Trial" → Sign Up (`/sign-up`)
3. After registration → Onboarding (`/onboarding`)
4. Completes onboarding → Dashboard (`/dashboard`)

### Returning User Flow
1. Lands on home page (`/`)
2. Clicks "Sign In" → Sign In (`/sign-in`)
3. After authentication → Dashboard (`/dashboard`)

### Core App Flow
1. **Dashboard** - See prioritized urgent items
2. **Add Client** - Via modal from Clients page
3. **Log Communication** - Via modal from Dashboard or Client Detail
4. **AI Analysis** - Automatic after communication is logged
5. **Take Action** - Reply, Archive, or Snooze from action cards
6. **Review History** - Archive page for completed items

## Archive Page Purpose
The archive page serves as a historical reference for:
- **Completed Actions**: Tasks that have been resolved
- **Past Communications**: Communications that are no longer active
- **Pattern Recognition**: Identify recurring issues across clients
- **Audit Trail**: Maintain complete care history
- **Restore Capability**: Bring back archived items if needed

This ensures consultants never lose important information while keeping their active dashboard focused on current priorities.