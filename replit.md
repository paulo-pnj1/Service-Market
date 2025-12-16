# ServiçoJá

## Overview

ServiçoJá is a mobile-first marketplace application connecting clients with local service providers in Angola. The platform enables users to discover, contact, and hire professionals across various service categories including home repairs, cleaning, tutoring, beauty, technology, and more.

The application features a React Native/Expo frontend with Firebase as the backend. It uses Firebase Authentication for user management and Firestore as the database. It supports two user types: clients who browse and hire services, and providers who offer their services on the platform.

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

### Backend Architecture (Firebase)
- **Authentication**: Firebase Authentication with email/password and phone number support
- **Database**: Cloud Firestore (NoSQL)
- **No Express backend required** - All data access happens directly from the frontend

Key Firebase files:
- `client/lib/firebase.ts` - Firebase initialization and exports
- `client/lib/firestore.ts` - Firestore service layer with CRUD operations for all collections

### Database Collections (Firestore)
- `users` - Client and provider accounts with profile information
- `providers` - Extended provider profiles (linked to users via userId)
- `categories` - Service categories (e.g., cleaning, repairs, tutoring)
- `services` - Individual services offered by providers
- `reviews` - Client reviews of providers
- `conversations` - Chat conversations between clients and providers
- `messages` - Individual chat messages within conversations
- `favorites` - User saved/favorite providers
- `serviceOrders` - Service booking records

### Authentication Flow
- Email/password authentication via Firebase Auth
- Phone number authentication support (available in UI)
- Separate registration flows for clients (simplified) and providers (extended profile)
- Password reset via Firebase Auth
- Auth state managed via `AuthContext` using `onAuthStateChanged` listener
- User data stored in Firestore `users` collection

### Key Design Patterns
- Portuguese (Angolan) language throughout the UI
- Primary color: `#FF6B35` (orange)
- Mobile-first design with bottom tab navigation
- Blur effects on iOS tab bar and headers
- Card-based provider listings with ratings and verification badges

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User authentication (email/password, phone number)
- **Cloud Firestore**: Primary data store (NoSQL document database)
- Firebase project: `servija-34e26`

### Third-Party Libraries
- **Expo**: Mobile app development platform
- **React Navigation**: Navigation infrastructure
- **TanStack Query**: Data fetching and caching
- **Zod**: Schema validation for data integrity

### Firebase Configuration
Firebase configuration is stored in `app.json` under `expo.extra.firebase`. The Firebase API key is public by design (security is enforced via Firestore Security Rules).

### Development Commands
- `npm run start` - Start Expo development server (web on port 5000)
- Web app will be available at the Replit dev URL

## Recent Changes

### December 2024 - Firebase Migration
- Migrated from Express.js backend to Firebase (direct frontend-to-Firebase communication)
- Replaced PostgreSQL/Drizzle ORM with Cloud Firestore
- Implemented Firebase Authentication (email/password)
- Added phone number authentication UI support
- Created Firestore service layer (`client/lib/firestore.ts`) for all CRUD operations
- Updated all screens to use Firestore queries directly via React Query
- Removed backend server directory and simplified package.json

### Key Files Modified
- `client/lib/firebase.ts` - Firebase initialization
- `client/lib/firestore.ts` - Firestore CRUD services
- `client/lib/seedFirestore.ts` - Seed script for initializing Firestore collections
- `client/lib/query-client.ts` - Updated for Firestore
- `client/contexts/AuthContext.tsx` - Firebase Auth integration
- `client/screens/AdminSetupScreen.tsx` - Admin screen for Firebase configuration and seed
- All screen components updated to use Firestore services

### Firebase Console Setup Required
1. Enable "Email/Password" authentication in Firebase Console → Authentication → Sign-in method
2. (Optional) Enable "Phone" authentication for phone number login
3. Configure Firestore Security Rules for development:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
4. Use the "Configuração Firebase" link in the login screen to initialize collections and test connection
