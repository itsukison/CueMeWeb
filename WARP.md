# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CueMeWeb is a Next.js web application for an AI interview preparation tool. It serves both as a landing page and a dashboard for managing user subscriptions, QnA collections, and usage tracking. This web app works in tandem with a desktop Electron application that provides real-time interview assistance.

### Architecture

**Frontend:** Next.js 15 with App Router, React 19, TypeScript, TailwindCSS 4, shadcn/ui components
**Backend:** Supabase (PostgreSQL + Auth + RLS)  
**Payment:** Stripe for subscription management
**Analytics:** Vercel Analytics + Google Analytics/GTM
**AI:** OpenAI API for embeddings and vector search

## Essential Development Commands

### Daily Development
```bash
# Start development server with Turbo
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing & Debugging
```bash
# Check specific API endpoint
curl -H "Content-Type: application/json" http://localhost:3000/api/subscriptions/plans

# Test Stripe webhook locally (requires Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check TypeScript compilation
npx tsc --noEmit
```

## Core Architecture Patterns

### Subscription System Architecture

The application implements a comprehensive subscription system with three tiers:
- **Free Plan:** 1 file, 5 QnAs per file, 10 questions/month
- **Basic Plan:** ¥750/month - 5 files, 20 QnAs per file, 200 questions/month  
- **Premium Plan:** ¥2500/month - 20 files, 50 QnAs per file, 1000 questions/month

**Key Components:**
- `/src/lib/usage-enforcement.ts` - Contains all usage validation logic
- `/src/app/api/subscriptions/` - Stripe integration APIs
- `/src/app/api/usage/` - Usage tracking and monthly reset APIs
- Database tables: `subscription_plans`, `user_subscriptions`, `usage_tracking`

### Authentication Flow

Users authenticate through Supabase Auth. The main app page (`/src/app/page.tsx`) renders the landing page for SEO but redirects authenticated users to `/dashboard` after a 100ms delay.

**Pattern:**
1. Landing page renders immediately (SEO-optimized)
2. Auth check happens client-side
3. Authenticated users get redirected to dashboard
4. Dashboard layout (`/src/app/dashboard/layout.tsx`) handles auth state

### Usage Enforcement Pattern

Usage limits are enforced at multiple levels:

**Client-side validation:**
```typescript
import { clientUsageEnforcement } from '@/lib/usage-enforcement'

const { allowed, reason } = await clientUsageEnforcement.canCreateFile()
if (!allowed) {
  // Show error to user
}
```

**Server-side validation:**
```typescript
import { canCreateFile } from '@/lib/usage-enforcement'

const check = await canCreateFile(userId)
if (!check.allowed) {
  return NextResponse.json({ error: check.reason }, { status: 400 })
}
```

### Integration with Electron App

The web app provides APIs consumed by the companion Electron app:
- `/api/usage/increment` - Tracks question usage from Electron app
- `/api/subscriptions/user` - Returns current subscription limits
- Authentication via Supabase session tokens

## File Organization

### Key Directories

**`/src/app/`** - Next.js App Router pages
- `api/` - API route handlers for subscriptions, usage tracking, Stripe webhooks
- `dashboard/` - Protected user dashboard pages
- `page.tsx` - Main landing page with auth redirect logic

**`/src/components/`**
- `ui/` - Reusable shadcn/ui components
- `landing-page.tsx` - SEO-optimized landing page component
- `download-section.tsx` - Download section for Electron app

**`/src/lib/`** - Utility libraries
- `supabase.ts` - Database client with TypeScript types
- `usage-enforcement.ts` - Subscription limit validation logic
- `stripe.ts` - Server-side Stripe configuration
- `stripe-client.ts` - Client-side Stripe setup
- `usage-tracking.ts` - Usage record management
- `vector-search.ts` - OpenAI embeddings for QnA search

## Environment Variables

### Required for Development
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# OpenAI for embeddings
OPENAI_API_KEY=

# Site configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Usage reset cron job
CRON_SECRET=your-secure-secret

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=
NEXT_PUBLIC_GTM_ID=
```

## Database Relationships

### Core Tables
- `qna_collections` (user files) → `qna_items` (questions/answers)
- `subscription_plans` → `user_subscriptions` (active subscriptions)
- `usage_tracking` (monthly question counts per user)

### Important Constraints
- RLS policies protect user data
- Free plan auto-assigned to new users
- Monthly usage resets via cron job (`/api/usage/reset`)

## Deployment Considerations

### Stripe Setup Required
1. Create products in Stripe dashboard (Basic: ¥750, Premium: ¥2500)
2. Update database with Stripe price IDs
3. Configure webhook endpoint: `/api/webhooks/stripe`
4. Set webhook events: `checkout.session.completed`, `customer.subscription.*`

### Cron Job Setup
Monthly usage reset requires either:
- Vercel Cron Jobs (add `vercel.json` with cron configuration)
- External cron service calling `/api/usage/reset` with Bearer token

### SEO Optimization
- Comprehensive Japanese SEO metadata in `layout.tsx`
- Structured data (JSON-LD) for software application and FAQ
- PWA manifest and icons configured
- Landing page optimized for "AI面接対策" keywords

## Common Development Tasks

### Adding New API Routes
Follow the pattern in `/src/app/api/subscriptions/user/route.ts`:
1. Validate Supabase JWT token
2. Extract user ID from token
3. Perform database operations with RLS
4. Return typed JSON responses

### Usage Limit Changes
Modify limits in three places:
1. Database: Update `subscription_plans` table
2. Types: Update `Database` type in `supabase.ts`
3. UI: Update plan display components in `/dashboard/subscription/`

### Stripe Integration
- All Stripe operations go through `/src/lib/stripe.ts`
- Client-side Stripe uses `/src/lib/stripe-client.ts`
- Webhook handling in `/api/webhooks/stripe/route.ts`

### Vector Search Implementation
QnA items support semantic search via OpenAI embeddings:
- Embeddings generated in `/api/embeddings/route.ts`
- Search function: `search_qna_items()` in Supabase
- Client usage in vector search workflows

## Japanese Market Considerations

- All pricing in JPY (Japanese Yen)
- UI text primarily in Japanese
- SEO optimized for Japanese search terms
- Structured data includes Japanese descriptions
- Interview preparation context specific to Japanese job market