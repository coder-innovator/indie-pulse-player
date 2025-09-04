# CSS Consistency Guide

This guide ensures consistent styling across all endpoints and components in the SoundScape application.

## 🎨 Design System Variables

### Core Colors (HSL)
All colors MUST use HSL values for consistency and easy theming:

```css
:root {
  /* Primary Brand Colors */
  --primary: 260 85% 60%;           /* Purple */
  --accent: 30 80% 55%;             /* Orange */
  --accent-blue: 210 80% 60%;       /* Blue */
  --accent-green: 150 70% 55%;      /* Green */
  --accent-orange: 25 75% 55%;      /* Orange */
  --accent-purple: 260 85% 60%;     /* Purple */
  --accent-pink: 320 75% 60%;       /* Pink */
  
  /* Surface Colors */
  --surface-primary: 220 22% 8%;    /* Dark surface */
  --surface-secondary: 220 20% 10%; /* Medium surface */
  --surface-elevated: 220 18% 12%;  /* Elevated surface */
  
  /* Text Colors */
  --text-primary: 0 0% 95%;         /* Primary text */
  --text-secondary: 0 0% 80%;       /* Secondary text */
  --text-tertiary: 0 0% 65%;        /* Tertiary text */
  --text-muted: 0 0% 50%;           /* Muted text */
  
  /* Border Colors */
  --border-subtle: 220 18% 12%;     /* Subtle borders */
  --border-medium: 220 18% 15%;     /* Medium borders */
  --border-strong: 220 18% 20%;     /* Strong borders */
}
```

## 🧩 Component Classes

### Page Layout
```css
/* Page Backgrounds */
.page-background          /* Standard page background */
.page-background-alt      /* Alternative page background */

/* Containers */
.responsive-container     /* Responsive container with padding */
.responsive-section       /* Standard section spacing */
.responsive-grid          /* Responsive grid layout */
```

### Cards
```css
/* Card Variants */
.card-primary            /* Primary card style */
.card-secondary          /* Secondary card style */
.card-elevated           /* Elevated card with shadow */
.card-stats              /* Statistics card */
.card-artist             /* Artist profile card */
.card-scene              /* Scene information card */

/* Special Card Effects */
.glass-card              /* Glassmorphism effect */
.glow-card               /* Glow effect card */
```

### Buttons
```css
/* Button Variants */
.magic-button            /* Primary action button */
.btn-filter              /* Filter button */
.btn-primary             /* Primary button */
.btn-secondary           /* Secondary button */
.btn-outline             /* Outline button */

/* Button States */
.hover-lift              /* Hover lift effect */
.hover-scale             /* Hover scale effect */
.hover-glow              /* Hover glow effect */
.hover-lift-glow         /* Combined hover effects */
```

### Forms
```css
/* Form Elements */
.form-input              /* Input field styling */
.form-label              /* Label styling */
.form-select             /* Select dropdown styling */

/* Enhanced Form Elements */
.enhanced-select         /* Enhanced select styling */
.enhanced-select-content /* Select dropdown content */
.enhanced-select-item    /* Select option items */
.enhanced-checkbox       /* Enhanced checkbox */
.enhanced-slider         /* Enhanced slider */
```

### Badges
```css
/* Badge Variants */
.badge-primary           /* Primary badge */
.badge-secondary         /* Secondary badge */
.badge-success           /* Success badge */
.badge-warning           /* Warning badge */
.badge-error             /* Error badge */

/* Popularity Badges */
.badge-emerging          /* Emerging artist badge */
.badge-rising            /* Rising artist badge */
.badge-established       /* Established artist badge */
.badge-popular           /* Popular artist badge */
```

### Tabs
```css
/* Tab Styling */
.enhanced-tabs           /* Enhanced tab container */
.enhanced-tab-trigger    /* Enhanced tab trigger */
```

### Filters
```css
/* Filter Components */
.filter-section          /* Filter section container */
.filter-grid             /* Filter grid layout */
.filter-item             /* Individual filter item */
```

## 📱 Responsive Design

### Grid Classes
```css
/* Responsive Grids */
.grid-responsive         /* 1 → 2 → 3 → 4 → 5 columns */
.grid-stats              /* 2 → 4 columns for statistics */
.mobile-grid             /* Mobile-optimized grid */
```

### Typography
```css
/* Responsive Text */
.mobile-text             /* Responsive text sizing */
.mobile-title            /* Responsive title sizing */
.mobile-optimized        /* Mobile-optimized spacing */
```

## 🎭 Animation Classes

### Entrance Animations
```css
.animate-fade-in         /* Fade in animation */
.animate-slide-up        /* Slide up animation */
.animate-scale-in        /* Scale in animation */
```

### Hover Effects
```css
.hover-lift              /* Lift on hover */
.hover-scale             /* Scale on hover */
.hover-glow              /* Glow on hover */
.hover-lift-glow         /* Combined hover effects */
```

### Loading States
```css
.loading-container       /* Loading container */
.loading-content         /* Loading content */
.loading-text            /* Loading text */
```

## 🚨 Error & State Classes

### Error States
```css
.error-container         /* Error container */
.error-card              /* Error card */
.error-header            /* Error header */
.error-title             /* Error title */
.error-message           /* Error message */
```

### Focus States
```css
.focus-visible-ring      /* Focus ring for keyboard navigation */
.focus-enhanced          /* Enhanced focus state */
.focus-ring              /* Standard focus ring */
```

## 🎨 Utility Classes

### Spacing & Layout
```css
.space-responsive        /* Responsive spacing */
.gpu-accelerated        /* GPU acceleration */
```

### Text Effects
```css
.text-gradient           /* Gradient text */
.fluid-text             /* Fluid typography */
.fluid-text-sm          /* Small fluid text */
```

### Accessibility
```css
.sr-only                /* Screen reader only */
.skip-link              /* Skip navigation link */
```

## 📋 Usage Guidelines

### 1. Always Use Semantic Classes
❌ **Don't:**
```tsx
<div className="bg-gray-800 border border-gray-600 p-4 rounded-lg">
```

✅ **Do:**
```tsx
<div className="card-secondary">
```

### 2. Use Consistent Spacing
❌ **Don't:**
```tsx
<div className="p-8 mb-6 mt-4">
```

✅ **Do:**
```tsx
<div className="responsive-section">
```

### 3. Use Consistent Colors
❌ **Don't:**
```tsx
<div className="text-blue-400 bg-red-500">
```

✅ **Do:**
```tsx
<div className="text-accent-blue bg-destructive">
```

### 4. Use Responsive Classes
❌ **Don't:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

✅ **Do:**
```tsx
<div className="responsive-grid">
```

## 🔧 Component-Specific Guidelines

### Trending Page
- Use `.filter-section` for filter containers
- Use `.enhanced-tabs` for tab navigation
- Use `.card-stats` for statistics cards
- Use `.grid-responsive` for track grids

### Dashboard Page
- Use `.card-primary` for main content cards
- Use `.card-secondary` for secondary content
- Use `.enhanced-header` for page headers

### Library Page
- Use `.card-secondary` for playlist cards
- Use `.hover-lift` for interactive elements
- Use `.responsive-grid` for track layouts

### Search Results
- Use `.card-secondary` for result cards
- Use `.enhanced-select` for filter dropdowns
- Use `.hover-glow` for search result interactions

## 🚀 Performance Tips

### 1. Use CSS Variables
```css
/* Good - Uses CSS variables */
.card-primary {
  background: hsl(var(--surface-primary));
}

/* Bad - Hardcoded values */
.card-primary {
  background: #1a1a1a;
}
```

### 2. Minimize Custom CSS
```css
/* Good - Uses utility classes */
.enhanced-card {
  @apply bg-surface-secondary border border-border-medium rounded-xl p-6;
}

/* Bad - Custom CSS */
.enhanced-card {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  padding: 24px;
}
```

### 3. Use Consistent Transitions
```css
/* Good - Uses CSS variables */
.hover-lift {
  transition: transform var(--animation-normal) var(--animation-smooth);
}

/* Bad - Inconsistent timing */
.hover-lift {
  transition: transform 0.3s ease;
}
```

## 🔍 Testing Checklist

Before committing changes, ensure:

- [ ] All components use semantic CSS classes
- [ ] No hardcoded colors or values
- [ ] Responsive design is implemented
- [ ] Hover and focus states are consistent
- [ ] Animations use CSS variables
- [ ] Accessibility features are included
- [ ] Mobile-first approach is followed
- [ ] Performance is optimized

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

---

**Remember**: Consistency is key to maintaining a professional and polished user experience across all endpoints.
