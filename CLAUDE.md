# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChefCheck is a HACCP (Hazard Analysis Critical Control Points) compliance management application built with Next.js 15, React 18, and Supabase PostgreSQL. The application helps food service establishments maintain food safety compliance through real-time monitoring, logging, and reporting.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack on port 9002
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm run typecheck` - Run TypeScript type checking

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: Radix UI components with Tailwind CSS
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **State Management**: React Context (DataContext)
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Charts**: Recharts
- **Deployment**: Vercel

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/context/` - React Context providers
- `src/lib/` - Utility functions and shared logic

### Data Architecture
The application uses a centralized data context (`DataContext.tsx`) that:
- Fetches data from Supabase via REST API routes
- Provides CRUD operations for all entities
- Manages real-time state updates
- Handles error states and user notifications

### API Structure
All API routes follow REST conventions:
- `GET /api/[entity]` - List all entities
- `GET /api/[entity]/[id]` - Get specific entity
- `POST /api/[entity]` - Create new entity
- `PUT /api/[entity]/[id]` - Update entity
- `DELETE /api/[entity]/[id]` - Delete entity

### Core Entities
- **Suppliers**: Food suppliers and vendors
- **Appliances**: Kitchen equipment (fridges, freezers, ovens)
- **Production Logs**: Food production compliance records
- **Delivery Logs**: Incoming delivery tracking
- **Temperature Logs**: Equipment temperature monitoring
- **Cleaning Tasks**: Cleaning procedures and schedules
- **Users**: Staff members with role-based access

## Configuration

### Environment Variables
Required Supabase configuration in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

### TypeScript Configuration
- Uses strict mode with bundler module resolution
- Path aliases: `@/*` maps to `./src/*`
- Target: ES2017

### Styling System
- Uses shadcn/ui component library
- Custom color scheme defined in `tailwind.config.ts`
- CSS variables for theming
- Inter font family for consistent typography

## Development Guidelines

### Component Structure
- Follow the existing pattern of shadcn/ui components in `src/components/ui/`
- Business logic components in feature-specific directories
- Layout components in `src/components/layout/`

### Data Flow
1. Data is fetched via API routes that interact with Supabase
2. DataContext manages application state
3. Components consume data through the `useData()` hook
4. CRUD operations trigger automatic re-fetching

### Supabase Integration
- Server-side Supabase clients configured in `src/lib/supabase/server.ts`
- API routes handle PostgreSQL operations via Supabase with proper authentication
- Type-safe database operations with auto-generated types
- Real-time subscriptions available for live updates
- Auth middleware (`withAuth`, `withAdminAuth`) enforces proper access control

### Deployment
- **Platform**: Vercel (optimal for Next.js)
- **Configuration**: `vercel.json` for build settings
- **Environment Variables**: Set in Vercel dashboard
- **Database**: Hosted on Supabase (separate from frontend)

### Compliance Features
- Temperature range validation based on appliance types
- Automatic compliance checking for logs
- Visual indicators for non-compliant records
- Activity feed for audit trails

## Current Status (December 2024)

### Recent Fixes Applied
- ✅ Fixed missing Lock icon import in `main-nav.tsx`
- ✅ Resolved React Hooks rules violations by moving hooks before early returns
- ✅ Fixed TypeScript compilation errors
- ✅ Created `.env.local` template file
- ✅ Installed ESLint dependencies and configuration
- ✅ Updated server-side Supabase client architecture
- ✅ Applied authentication middleware across API routes

### Application Status
- **Development Server**: ✅ Running on http://localhost:9002
- **TypeScript**: ✅ Compilation passes without errors
- **Core Functionality**: ✅ Ready for testing once environment is configured
- **Linting**: ⚠️ Some performance warnings remain (non-blocking)

### Immediate Next Steps
1. **Configure Environment**: Add actual Supabase credentials to `.env.local`
2. **Test Authentication**: Verify login/logout functionality
3. **Test Data Operations**: Verify CRUD operations work properly
4. **Performance Optimization**: Address remaining ESLint warnings with useCallback optimizations

### Known Issues
- ESLint warnings about function dependencies in DataContext (performance optimization needed)
- Font loading warning in layout.tsx (cosmetic issue)

### Architecture Changes Made
- Replaced insecure direct Supabase calls with proper server-side client functions
- Added authentication middleware for API route protection
- Improved error handling and loading states in DataContext
- Fixed React Hooks compliance for better performance and reliability