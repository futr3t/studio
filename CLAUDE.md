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
Required Firebase configuration:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

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
1. Data is fetched via API routes that interact with Firebase
2. DataContext manages application state
3. Components consume data through the `useData()` hook
4. CRUD operations trigger automatic re-fetching

### Supabase Integration
- Supabase client is configured in `src/lib/supabase.ts`
- API routes handle PostgreSQL operations via Supabase
- Type-safe database operations with auto-generated types
- Real-time subscriptions available for live updates

### Environment Variables
Required for Supabase connection:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous public key

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