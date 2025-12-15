# ServiçoJá - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app explicitly requires user accounts, differentiation between clients and service providers, chat functionality, and data sync.

**Implementation:**
- Email/password authentication (as specified in requirements)
- Separate registration flows for:
  - **Clients** (Clientes): Simplified signup - name, email, password, city
  - **Service Providers** (Prestadores): Extended signup - name, email, password, profile photo, services offered, hourly rate, city, categories, description
- Include login/signup screens with:
  - "Esqueci minha senha" (Forgot password) link
  - Privacy policy & terms of service links (placeholder URLs)
- Account screen with:
  - Edit profile
  - Log out (with confirmation: "Tem certeza que deseja sair?")
  - Delete account (nested under Settings > Conta > Excluir Conta, double confirmation)

### Navigation
**Tab Navigation** - The app has 4 distinct feature areas:

1. **Home/Explorar** (Browse) - Search and discover service providers
2. **Mensagens** (Messages) - Chat with providers
3. **Favoritos** (Favorites) - Saved providers
4. **Perfil** (Profile) - User account/dashboard

**Tab Bar Specifications:**
- Position: Bottom of screen
- Style: Filled background (white), subtle top border
- Active tab: Primary color icon + label
- Inactive tab: Gray icon + label
- Icons: Use Feather icons from @expo/vector-icons

### Screen Specifications

#### 1. Home Screen (Explorar)
**Purpose:** Central hub for discovering service providers

**Layout:**
- **Header:** Custom transparent header
  - Left: App logo/wordmark "ServiçoJá"
  - Right: Notification bell icon button
  - No back button
  - Top inset: insets.top + Spacing.xl
- **Main Content:** Scrollable view
  - Search bar (sticky below header)
  - Category chips (horizontal scroll)
  - "Prestadores em Destaque" section
  - "Todos os Prestadores" section
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:** Search input, category pills, provider cards (grid/list)

#### 2. Search Results Screen
**Purpose:** Display filtered providers based on search/filters

**Layout:**
- **Header:** Default navigation header (non-transparent)
  - Left: Back button
  - Center: Search query text or "Resultados"
  - Right: Filter icon button
  - Top inset: Spacing.xl
- **Main Content:** Scrollable list
  - Active filter chips (dismissible)
  - Provider cards
  - Sort dropdown (Avaliação, Preço, Proximidade)
  - Bottom inset: tabBarHeight + Spacing.xl
- **Floating Element:** Filter modal (full screen when opened)

#### 3. Provider Profile Screen
**Purpose:** Detailed view of service provider

**Layout:**
- **Header:** Custom transparent header with blur backdrop
  - Left: Back button (white/contrasting)
  - Right: Favorite heart icon button, Share button
  - Top inset: insets.top + Spacing.xl
- **Main Content:** Scrollable view
  - Cover photo with verification badge overlay
  - Provider name, rating, and price
  - Service categories chips
  - "Sobre" section with description
  - "Galeria de Serviços" (photo grid)
  - "Avaliações" section (rating summary + reviews list)
  - Bottom inset: 80px (for floating action buttons)
- **Floating Elements:**
  - Primary action button: "Solicitar Orçamento" (bottom, full-width with margins)
  - Secondary action button: "Conversar" (stacked above primary)
  - Shadow specs: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

#### 4. Chat/Messages Screen
**Purpose:** Real-time messaging between clients and providers

**Layout:**
- **Header:** Default navigation header
  - Left: Back button (when in conversation)
  - Center: Contact name and online status
  - Right: Info button
- **Main Content:**
  - Conversation list view (when no chat open)
  - Message thread (when chat open, inverted FlatList)
  - Bottom inset: insets.bottom (no tab bar in active chat)
- **Input Area:** Sticky text input with send button at bottom

#### 5. Profile/Dashboard Screen
**Purpose:** User account management and provider dashboard

**Layout:**
- **Header:** Custom header
  - Left: User avatar and name
  - Right: Settings gear icon
  - Top inset: insets.top + Spacing.xl
- **Main Content:** Scrollable view
  - **For Clients:**
    - Profile info section
    - "Meus Serviços Solicitados" (booking history)
    - "Prestadores Favoritos"
  - **For Providers:**
    - Profile preview card with "Editar Perfil" button
    - Quick stats (avaliação média, total serviços)
    - "Gerenciar Serviços" section
    - "Minhas Avaliações"
  - Bottom inset: tabBarHeight + Spacing.xl

#### 6. Filter Modal
**Purpose:** Advanced filtering options

**Layout:**
- **Header:** Custom header
  - Left: Close/Cancel button
  - Center: "Filtros"
  - Right: "Limpar" text button
- **Main Content:** Scrollable form
  - Category multi-select
  - Price range slider (min/max)
  - Minimum rating selector (stars)
  - City/location dropdown
  - Submit and cancel in footer (sticky bottom)
  - Bottom inset: insets.bottom + Spacing.xl

## Design System

### Color Palette
- **Primary:** #FF6B35 (Vibrant orange - energy, trust, action)
- **Primary Dark:** #E55527 (for pressed states)
- **Secondary:** #004E89 (Deep blue - professionalism, reliability)
- **Success:** #2D9F4E (for verification badges, positive actions)
- **Warning:** #F4A300 (for ratings, pending states)
- **Error:** #E63946 (for errors, destructive actions)
- **Background:** #F8F9FA (light gray for screens)
- **Surface:** #FFFFFF (cards, modals)
- **Text Primary:** #1A1A1A
- **Text Secondary:** #6B7280
- **Border:** #E5E7EB
- **Disabled:** #D1D5DB

### Typography
- **Heading 1:** 28px, Bold, Text Primary
- **Heading 2:** 24px, SemiBold, Text Primary
- **Heading 3:** 20px, SemiBold, Text Primary
- **Body Large:** 16px, Regular, Text Primary
- **Body:** 14px, Regular, Text Primary
- **Caption:** 12px, Regular, Text Secondary
- **Button:** 16px, SemiBold

### Spacing Scale
- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 24px
- **2xl:** 32px
- **3xl:** 48px

### Component Specifications

**Provider Card:**
- Card container with subtle border, rounded corners (12px)
- Square photo (aspect ratio 1:1) with rounded corners (8px)
- Verification badge overlay (top-right of photo, green checkmark)
- Name (Heading 3), rating stars + number, location icon + city
- Price badge (bottom-right): "AOA 2,500/h" format
- Press feedback: slight scale down (0.98) + opacity 0.8

**Category Chip:**
- Pill-shaped with border or filled background
- Icon (left) + label
- Touchable with press feedback
- Active state: Primary color background, white text
- Inactive state: Border only, primary color text

**Search Bar:**
- Rounded rectangle (height 48px, border radius 24px)
- Light background (#F3F4F6)
- Search icon (left), placeholder "Buscar serviços..."
- Clear button (right, when text present)

**Rating Display:**
- Star icons (filled/half/empty based on rating)
- Rating number beside stars (e.g., "4.8")
- Review count in secondary text "(127 avaliações)"

**Action Buttons:**
- Primary: Full-width rounded rectangle (12px), primary color, white text
- Secondary: Full-width rounded rectangle, white background, primary color border and text
- Height: 52px
- Shadow for floating buttons (as specified above)

**Message Bubble:**
- Sender: Aligned right, primary color background, white text
- Receiver: Aligned left, light gray background, dark text
- Border radius: 16px (with tail pointing to sender/receiver)
- Timestamp below bubble (caption size)

### Assets Required

**Category Icons (8-10 essential categories):**
1. Reparos Domésticos (wrench icon)
2. Limpeza (broom icon)
3. Aulas Particulares (book icon)
4. Beleza e Estética (scissors icon)
5. Tecnologia (monitor icon)
6. Construção (hard-hat icon)
7. Jardinagem (leaf icon)
8. Transporte (truck icon)

**Profile Avatars (3-4 preset options):**
- Generate simple, friendly avatar illustrations
- Aesthetic: Professional but approachable, diverse representation
- Use warm colors matching the marketplace theme
- Include both male and female avatar options

**Verification Badge Asset:**
- Green checkmark in circular badge
- Size: 24x24px
- Use as overlay on provider photos

**App Logo:**
- Wordmark "ServiçoJá" with icon
- Icon: Abstract representation of service/handshake
- Colors: Primary orange and secondary blue

### Interaction Design

**Touch Feedback:**
- All touchable elements must have visual feedback
- Buttons: Darken by 10% when pressed
- Cards/List items: Background opacity 0.05 overlay when pressed
- Icons: Scale down to 0.95 when pressed

**Loading States:**
- Skeleton screens for provider cards while loading
- Spinner for actions (submitting forms, sending messages)
- Pull-to-refresh on lists

**Empty States:**
- Illustration + helpful message
- Call-to-action button where appropriate
- Examples: "Nenhum prestador encontrado", "Sem mensagens ainda"

### Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text
- All icons have text labels for screen readers
- Form inputs have clear labels and error states
- Support for dynamic text sizing