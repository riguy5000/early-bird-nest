# Jewelry & Pawn SaaS Application Guidelines

## Authentication System

### Root Admin Account
- **Email**: admin@bravojewellers.com
- **Password**: 9811QWEasd
- **Role**: root_admin
- **Access**: Full platform oversight and management via Root Admin Console

### Demo Accounts
- **Regular User**: demo@example.com / password123
- **2FA Test User**: demo2fa@example.com / password123 (requires 2FA code: 123456)

## Google Places Integration

### Implementation
- **GooglePlacesAutocomplete Component** - Reusable address input with autocomplete
- **Mock API Service** - Development mode with realistic address suggestions
- **Place Details Storage** - Stores placeId, formatted address, and structured data
- **Address Validation** - Requires selection from suggestions for validation

### Usage Locations
- **Registration Wizard** - Store address input during registration
- **Customer Forms** - Customer address input when adding/editing clients
- **Future Modules** - Ready for employee addresses, supplier locations, etc.

### Features
- Real-time address suggestions with debounced input
- Structured address data (street, city, state, zip, coordinates)
- Visual validation with green checkmarks for verified addresses
- Responsive dropdown with loading states and error handling
- Google Places API format ready for production integration

### Production Setup
To implement real Google Places API:
1. Get Google Places API key from Google Cloud Console
2. Enable Places API and Geocoding API
3. Replace mock service with actual Google Places API calls
4. Add API key to environment variables
5. Configure rate limiting and usage monitoring

## Design System Guidelines

### Typography
- Base font size: 14px (defined in CSS variables)
- Use default typography from globals.css - avoid overriding with Tailwind font classes unless specifically requested
- Font weights: 400 (normal), 500 (medium)

### Colors & Theming
- Primary color: #030213 (dark blue-black)
- Destructive: #d4183d (red)
- Background: #ffffff (light) / oklch(0.145 0 0) (dark)
- Follow the established color tokens in globals.css

### Layout Guidelines
- Use flexbox and grid for responsive layouts
- Avoid absolute positioning unless necessary
- Keep components modular and reusable
- Max width for centered content: 420px for auth forms, 1200px+ for dashboards

### Component Structure
- Use shadcn/ui components consistently
- Implement proper loading states and error handling
- Include proper accessibility attributes (ARIA labels, etc.)
- Follow the established patterns for forms, cards, and navigation

### Form Validation
- Real-time validation with inline error messages
- Required field indicators with red asterisks
- Visual feedback for successful validation (green borders/checkmarks)
- Comprehensive error handling with user-friendly messages
- Phone number auto-formatting for consistent data entry

### Authentication Flow
- Multi-step registration wizard for new stores
- Comprehensive form validation with inline error messages
- Rate limiting simulation for security
- Social login support (Google, Apple)
- 2FA support with OTP input
- Persistent sessions with remember me functionality

### Root Admin Features
- Platform-wide store oversight
- API management and health monitoring
- System-wide alerts and news management
- Multi-tenant architecture support
- Live metal prices integration
- Comprehensive admin controls

### Customer Management
- Comprehensive customer profiles with Google Places addresses
- ID verification requirements for pawn transactions
- Age validation (18+ required)
- Phone number formatting and validation
- Multiple phone number support
- Structured address storage with place IDs

### Security Considerations
- Never expose service role keys to frontend
- Implement proper session management
- Rate limiting for authentication attempts
- Secure password requirements (8+ chars, uppercase, number)
- Email verification workflows
- Customer data protection and privacy compliance

## Code Organization

### File Structure
- `/components` - Reusable UI components
- `/components/auth` - Authentication-specific components
- `/components/ui` - shadcn/ui component library
- `/utils` - Utility functions and API clients
- `/supabase` - Backend functions and database utilities

### Google Places Components
- `GooglePlacesAutocomplete` - Main autocomplete component
- `CustomerForm` - Customer form with address integration
- Mock service for development testing
- Structured data handling for addresses

### Development Guidelines
- Keep file sizes manageable
- Refactor code as you develop
- Use TypeScript interfaces for data structures
- Implement proper error boundaries
- Include comprehensive JSDoc comments for complex functions
- Follow React best practices (hooks, state management, etc.)

## API Integration
- GoldAPI integration for precious metals pricing
- Supabase backend with edge functions
- Google Places API integration (mock in development)
- RESTful API patterns
- Proper error handling and user feedback
- Environment variable management for API keys

## Responsive Design
- Mobile-first approach
- Touch-friendly interface elements
- Responsive grid layouts
- Proper breakpoint handling
- Accessible navigation on all screen sizes

## Data Storage
- Customer addresses stored with Google Places data
- Place IDs for future reference and updates
- Structured address components (street, city, state, zip)
- Coordinates for mapping and location services
- Phone number standardization and formatting