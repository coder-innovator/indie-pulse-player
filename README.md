# SoundScape - Music Discovery & Streaming Platform

## 🎵 Project Vision

SoundScape is a modern music discovery platform that connects emerging artists with listeners through scene-based exploration and AI-powered recommendations. We're building the next generation of music discovery that goes beyond algorithms to create genuine musical communities.

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system for consistent styling
- **React Router** for client-side navigation
- **Shadcn/ui** for accessible, customizable components

### Backend Stack
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** for relational data with advanced querying
- **Supabase Storage** for audio files and cover art with CDN
- **Edge Functions** for serverless backend logic
- **Row Level Security (RLS)** for data protection

### Key Features
- 🎧 **Real-time Audio Streaming** with waveform visualization
- 🌍 **Scene-based Discovery** by location and genre
- 📊 **Artist Analytics** with detailed insights
- 🔍 **Advanced Search** with mood, BPM, and genre filters
- 👥 **Social Features** with follows, likes, and playlists
- 📱 **Responsive Design** for all devices

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── AudioPlayer.tsx  # Main audio playback component
│   ├── MusicPlayer.tsx  # Global music player
│   ├── SearchBar.tsx    # Advanced search with filters
│   ├── TrackCard.tsx    # Track display component
│   ├── DiscoveryShelf.tsx # Track collections
│   └── UploadTrack.tsx  # Track upload interface
├── pages/               # Route components
│   ├── Index.tsx        # Homepage with discovery
│   ├── Auth.tsx         # Login/signup flows
│   ├── Artist.tsx       # Artist profile pages
│   ├── Trending.tsx     # Trending content
│   ├── Scenes.tsx       # Scene exploration
│   └── Dashboard.tsx    # Artist dashboard
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state
│   ├── useTracks.ts     # Track data fetching
│   └── usePlayer.ts     # Audio player state
├── lib/                 # Utilities and configurations
└── integrations/        # External service integrations
    └── supabase/        # Supabase client and types
```

## 🗄️ Database Schema

### Core Tables
- **tracks** - Music tracks with metadata, popularity tiers
- **artists** - Artist profiles with bio and social links
- **users** - User accounts and preferences
- **plays** - Play tracking for analytics
- **likes** - User interactions with tracks
- **tags** - Genre, mood, and scene categorization
- **follows** - Artist following relationships

### Storage Buckets
- **audio-files** - Audio tracks (private, streamed via signed URLs)
- **cover-art** - Album/track artwork (public CDN)

## 🎯 Current Implementation Status

### ✅ Completed Features
- [x] Authentication system with email/password
- [x] Basic track display and discovery shelves
- [x] Search functionality with advanced filters
- [x] Database schema with RLS policies
- [x] Upload interface (UI only)
- [x] Responsive design system
- [x] Mock audio player interface
- [x] Artist profile pages
- [x] Trending content pages
- [x] Scene exploration pages
- [x] Artist dashboard

### 🚧 In Progress
- [ ] Real audio streaming and playback
- [ ] Upload processing backend
- [ ] Navigation linking between pages

### 📋 Priority Backlog
- [ ] Social features (follows, playlists)
- [ ] Real-time notifications
- [ ] Advanced recommendation engine
- [ ] Mobile app optimization

## 🚀 Development Workflow

### Prerequisites
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Database Migrations
All database changes are handled through Supabase migrations in the `supabase/migrations/` directory.

### Design System Guidelines
- Use semantic tokens from `index.css` and `tailwind.config.ts`
- Never use direct colors in components
- All colors must be in HSL format
- Create component variants for different states
- Maintain dark/light mode compatibility

## 🎨 Design Principles

### Color System
```css
/* Primary brand colors */
--primary: [Main brand color]
--primary-foreground: [Text on primary]

/* UI colors */
--background: [Page background]
--foreground: [Primary text]
--muted: [Secondary elements]
--accent: [Highlight color]

/* Semantic colors */
--destructive: [Error states]
--warning: [Warning states]
--success: [Success states]
```

### Component Architecture
- **Atomic Design**: Small, reusable components
- **Composition over Configuration**: Flexible component APIs
- **Accessibility First**: ARIA compliant components
- **Performance Optimized**: Lazy loading and code splitting

## 🔐 Security & Performance

### Authentication
- JWT-based sessions with automatic refresh
- Row Level Security for data isolation
- Secure file upload with validation
- Rate limiting on API endpoints

### Performance
- Image optimization and lazy loading
- Audio streaming with progressive enhancement
- Database query optimization with indexes
- CDN for static assets

## 📈 Analytics & Monitoring

### User Analytics
- Play tracking with completion rates
- User engagement metrics
- Artist performance analytics
- Geographic listening patterns

### Technical Monitoring
- Application performance monitoring
- Error tracking and logging
- Database performance metrics
- Real-time user activity

## 🎵 Music Industry Focus

### For Artists
- **Discovery Platform**: Get discovered by new audiences
- **Analytics Dashboard**: Understand your listeners
- **Community Building**: Connect with fans and scenes
- **Revenue Insights**: Track engagement and growth

### For Listeners
- **Scene Discovery**: Find music by location and community
- **Mood-based Playlists**: AI-powered recommendations
- **Emerging Artists**: Discover talent before it goes mainstream
- **Social Discovery**: Follow friends and taste-makers

## 🤝 Contributing

### Development Standards
- TypeScript for all new code
- ESLint and Prettier for code formatting
- Component documentation with JSDoc
- Unit tests for complex logic
- Integration tests for user flows

### Git Workflow
- Feature branches from `main`
- Pull requests with detailed descriptions
- Code review required for all changes
- Automated testing in CI/CD

## 🔮 Roadmap

### Phase 1: Core Navigation & Pages ✅
- [x] Artist profile pages
- [x] Trending content algorithms
- [x] Scene exploration interface
- [x] Artist dashboard

### Phase 2: Audio Streaming (Next)
- [ ] Real audio file upload and storage
- [ ] Audio streaming infrastructure
- [ ] Waveform visualization
- [ ] Play tracking implementation

### Phase 3: Social Features
- [ ] Follow/unfollow functionality
- [ ] Playlist creation and management
- [ ] Real-time notifications
- [ ] Community interactions

### Phase 4: Advanced Features
- [ ] AI-powered recommendations
- [ ] Advanced analytics
- [ ] Monetization features
- [ ] Mobile optimization

## 📞 Support & Documentation

### Development Help
- Check the `components/` directory for reusable UI elements
- Use `hooks/` for shared state logic
- Follow the design system in `index.css`
- Reference Supabase docs for backend features

### Database Queries
- Use the `useTracks` hook for track data
- Implement new queries in custom hooks
- Follow RLS policies for data access
- Use TypeScript types from `supabase/types.ts`

### Audio Implementation
- Extend `AudioPlayer` component for new features
- Use Supabase Storage for file management
- Implement progressive loading for large files
- Add waveform visualization with Web Audio API

---

**SoundScape** - Discover music. Support artists. Build scenes. 🎵