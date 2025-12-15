# ServiçoJá

## Overview

ServiçoJá is a mobile-first marketplace application connecting clients with local service providers in Angola. The platform enables users to discover, contact, and hire professionals across various service categories including home repairs, cleaning, tutoring, beauty, technology, and more.

The application features a React Native/Expo frontend with an Express.js backend, using PostgreSQL for data persistence. It supports two user types: clients who browse and hire services, and providers who offer their services on the platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tab navigators
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: StyleSheet API with a centralized theme system (`client/constants/theme.ts`)
- **Animations**: React Native Reanimated for fluid UI animations

The frontend follows a screen-based architecture with shared components in `client/components/`. Navigation is structured as:
- `RootStackNavigator` - Handles auth flow and modal screens
- `MainTabNavigator` - Bottom tabs for main app sections (Home, Messages, Favorites, Profile)
- Nested stack navigators for each tab section

Path aliases configured in `babel.config.js`:
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT implementation with SHA-256 hashing
- **API Style**: RESTful endpoints prefixed with `/api/`

The backend is organized as:
- `server/index.ts` - Express app setup with CORS and body parsing
- `server/routes.ts` - API route definitions with auth middleware
- `server/storage.ts` - Database access layer using Drizzle ORM
- `server/db.ts` - Database connection pool setup
- `server/seed.ts` - Initial data population script

### Database Schema
Defined in `shared/schema.ts` using Drizzle ORM:
- `users` - Client and provider accounts with auth credentials
- `providers` - Extended provider profiles (linked to users)
- `categories` - Service categories
- `providerCategories` - Many-to-many relationship
- `services` - Individual services offered by providers
- `reviews` - Client reviews of providers
- `conversations` / `messages` - Chat system
- `favorites` - User saved providers
- `serviceOrders` - Service booking records

### Authentication Flow
- Email/password authentication with JWT tokens
- Separate registration flows for clients (simplified) and providers (extended profile)
- Password reset via token-based email recovery
- Token stored client-side in AsyncStorage
- Auth state managed via `AuthContext`

### Key Design Patterns
- Portuguese (Brazilian/Angolan) language throughout the UI
- Primary color: `#FF6B35` (orange)
- Mobile-first design with bottom tab navigation
- Blur effects on iOS tab bar and headers
- Card-based provider listings with ratings and verification badges

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Third-Party Services
- **Expo**: Mobile app development platform
- **React Navigation**: Navigation infrastructure
- **TanStack Query**: Data fetching and caching
- **AsyncStorage**: Local token persistence

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to placeholder in dev)
- `EXPO_PUBLIC_DOMAIN` - API server domain for client requests
- `REPLIT_DEV_DOMAIN` - Development domain for CORS

### Development Commands
- `npm run all:dev` - Start both Expo and server in development
- `npm run db:push` - Push schema changes to database
- `npm run server:dev` - Run backend only
- `npm run expo:dev` - Run Expo development server