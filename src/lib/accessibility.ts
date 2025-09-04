/**
 * Accessibility utilities for the SoundScape application
 */

// ARIA labels for common actions
export const ARIA_LABELS = {
  // Navigation
  NAVIGATE_HOME: 'Navigate to home page',
  NAVIGATE_BACK: 'Navigate back',
  NAVIGATE_FORWARD: 'Navigate forward',
  
  // Music controls
  PLAY_TRACK: 'Play track',
  PAUSE_TRACK: 'Pause track',
  STOP_TRACK: 'Stop track',
  NEXT_TRACK: 'Next track',
  PREVIOUS_TRACK: 'Previous track',
  SEEK_TRACK: 'Seek to position in track',
  VOLUME_CONTROL: 'Volume control',
  MUTE_AUDIO: 'Mute audio',
  UNMUTE_AUDIO: 'Unmute audio',
  
  // Actions
  LIKE_TRACK: 'Like track',
  UNLIKE_TRACK: 'Unlike track',
  ADD_TO_PLAYLIST: 'Add to playlist',
  REMOVE_FROM_PLAYLIST: 'Remove from playlist',
  SHARE_TRACK: 'Share track',
  DOWNLOAD_TRACK: 'Download track',
  
  // Forms
  SEARCH_TRACKS: 'Search for tracks',
  FILTER_RESULTS: 'Filter search results',
  CLEAR_FILTERS: 'Clear all filters',
  SUBMIT_FORM: 'Submit form',
  CANCEL_ACTION: 'Cancel action',
  
  // UI elements
  CLOSE_MODAL: 'Close modal',
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  EXPAND_SECTION: 'Expand section',
  COLLAPSE_SECTION: 'Collapse section',
  TOGGLE_SIDEBAR: 'Toggle sidebar',
  
  // Status
  LOADING_CONTENT: 'Loading content',
  ERROR_OCCURRED: 'An error occurred',
  SUCCESS_MESSAGE: 'Operation completed successfully',
  WARNING_MESSAGE: 'Warning message',
  
  // Media
  AUDIO_PLAYER: 'Audio player controls',
  TRACK_PROGRESS: 'Track progress bar',
  TRACK_DURATION: 'Track duration',
  TRACK_TITLE: 'Track title',
  ARTIST_NAME: 'Artist name',
  ALBUM_COVER: 'Album cover image',
  
  // Social
  FOLLOW_ARTIST: 'Follow artist',
  UNFOLLOW_ARTIST: 'Unfollow artist',
  SHARE_PROFILE: 'Share artist profile',
  VIEW_PROFILE: 'View artist profile',
  
  // Upload
  UPLOAD_AUDIO: 'Upload audio file',
  UPLOAD_COVER: 'Upload cover art',
  SELECT_FILE: 'Select file',
  REMOVE_FILE: 'Remove file',
  
  // Tabs
  TRACKS_TAB: 'Tracks tab',
  ARTISTS_TAB: 'Artists tab',
  SCENES_TAB: 'Scenes tab',
  PLAYLISTS_TAB: 'Playlists tab',
  
  // Filters
  TIME_FILTER: 'Time period filter',
  GENRE_FILTER: 'Genre filter',
  MOOD_FILTER: 'Mood filter',
  SCENE_FILTER: 'Scene filter',
  BPM_FILTER: 'BPM range filter',
  POPULARITY_FILTER: 'Popularity filter',
  
  // Sorting
  SORT_BY_LISTENERS: 'Sort by number of listeners',
  SORT_BY_PLAYS: 'Sort by number of plays',
  SORT_BY_DATE: 'Sort by date',
  SORT_BY_TITLE: 'Sort by title',
  SORT_BY_ARTIST: 'Sort by artist name',
  
  // Pagination
  NEXT_PAGE: 'Go to next page',
  PREVIOUS_PAGE: 'Go to previous page',
  FIRST_PAGE: 'Go to first page',
  LAST_PAGE: 'Go to last page',
  PAGE_NUMBER: 'Page number',
  
  // Notifications
  NOTIFICATION_CLOSE: 'Close notification',
  NOTIFICATION_ACTION: 'Notification action',
  
  // Settings
  TOGGLE_DARK_MODE: 'Toggle dark mode',
  TOGGLE_NOTIFICATIONS: 'Toggle notifications',
  OPEN_SETTINGS: 'Open settings',
  CLOSE_SETTINGS: 'Close settings',
  
  // Help
  OPEN_HELP: 'Open help',
  CLOSE_HELP: 'Close help',
  SEARCH_HELP: 'Search help topics',
  
  // Language
  CHANGE_LANGUAGE: 'Change language',
  CURRENT_LANGUAGE: 'Current language',
  
  // Accessibility
  INCREASE_FONT_SIZE: 'Increase font size',
  DECREASE_FONT_SIZE: 'Decrease font size',
  TOGGLE_HIGH_CONTRAST: 'Toggle high contrast mode',
  TOGGLE_REDUCED_MOTION: 'Toggle reduced motion',
  SKIP_TO_CONTENT: 'Skip to main content',
  SKIP_TO_NAVIGATION: 'Skip to navigation',
};

// ARIA descriptions for complex elements
export const ARIA_DESCRIPTIONS = {
  AUDIO_PLAYER: 'Audio player with play, pause, seek, and volume controls',
  TRACK_CARD: 'Track information card with play button and metadata',
  FILTER_PANEL: 'Panel containing various filters to refine search results',
  SEARCH_RESULTS: 'List of search results with track information',
  PLAYLIST_ITEM: 'Playlist item with track information and controls',
  UPLOAD_FORM: 'Form for uploading new tracks with metadata',
  PROFILE_EDITOR: 'Editor for modifying user profile information',
  NOTIFICATION_TOAST: 'Notification message that can be dismissed',
  MODAL_DIALOG: 'Modal dialog for user interaction',
  DROPDOWN_MENU: 'Dropdown menu with various options',
  TAB_PANEL: 'Tab panel containing different content sections',
  ACCORDION_SECTION: 'Collapsible section of content',
  PROGRESS_BAR: 'Progress indicator for ongoing operations',
  RATING_STARS: 'Star rating system for tracks or artists',
  SOCIAL_SHARE: 'Social media sharing options',
  FILE_UPLOAD: 'File upload area with drag and drop support',
  COLOR_PICKER: 'Color selection tool',
  DATE_PICKER: 'Date selection calendar',
  TIME_PICKER: 'Time selection interface',
  SLIDER_CONTROL: 'Slider control for adjusting values',
  CHECKBOX_GROUP: 'Group of checkboxes for multiple selection',
  RADIO_GROUP: 'Group of radio buttons for single selection',
  AUTOCOMPLETE: 'Autocomplete input field with suggestions',
  MULTI_SELECT: 'Multi-select dropdown with search',
  RANGE_SLIDER: 'Range slider for selecting value ranges',
  TOGGLE_SWITCH: 'Toggle switch for binary options',
  BREADCRUMB: 'Breadcrumb navigation showing current location',
  PAGINATION: 'Pagination controls for navigating through pages',
  SORT_CONTROLS: 'Controls for sorting content in different ways',
  FILTER_CHIPS: 'Visual representation of active filters',
  SEARCH_HISTORY: 'List of previous search queries',
  RECOMMENDATIONS: 'Recommended content based on user preferences',
  TRENDING_CONTENT: 'Currently trending content',
  RECENT_ACTIVITY: 'Recent user activity and updates',
  USER_FEEDBACK: 'User feedback and rating system',
  HELP_SYSTEM: 'Help and documentation system',
  SETTINGS_PANEL: 'Application settings and preferences',
  USER_PROFILE: 'User profile information and settings',
  NOTIFICATION_CENTER: 'Center for managing all notifications',
  SEARCH_SUGGESTIONS: 'Search suggestions and autocomplete',
  CONTEXT_MENU: 'Context-sensitive menu with relevant actions',
  TOOLTIP: 'Helpful information displayed on hover',
  STATUS_INDICATOR: 'Indicator showing current status or state',
  PROGRESS_INDICATOR: 'Indicator showing progress of operations',
  ERROR_DISPLAY: 'Display area for error messages',
  SUCCESS_DISPLAY: 'Display area for success messages',
  WARNING_DISPLAY: 'Display area for warning messages',
  INFO_DISPLAY: 'Display area for informational messages',
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  NAVIGATE_HOME: { key: 'h', description: 'Go to home page' },
  NAVIGATE_BACK: { key: 'b', description: 'Go back' },
  NAVIGATE_FORWARD: { key: 'f', description: 'Go forward' },
  
  // Music controls
  PLAY_PAUSE: { key: 'Space', description: 'Play/pause current track' },
  NEXT_TRACK: { key: 'ArrowRight', description: 'Next track' },
  PREVIOUS_TRACK: { key: 'ArrowLeft', description: 'Previous track' },
  VOLUME_UP: { key: 'ArrowUp', description: 'Increase volume' },
  VOLUME_DOWN: { key: 'ArrowDown', description: 'Decrease volume' },
  MUTE: { key: 'm', description: 'Mute/unmute audio' },
  
  // Actions
  LIKE_TRACK: { key: 'l', description: 'Like current track' },
  ADD_TO_PLAYLIST: { key: 'p', description: 'Add to playlist' },
  SHARE: { key: 's', description: 'Share current track' },
  
  // Search and navigation
  SEARCH: { key: '/', description: 'Focus search input' },
  CLEAR_SEARCH: { key: 'Escape', description: 'Clear search' },
  OPEN_FILTERS: { key: 'f', description: 'Open filters panel' },
  
  // UI controls
  TOGGLE_SIDEBAR: { key: 'b', description: 'Toggle sidebar' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal' },
  TOGGLE_DARK_MODE: { key: 'd', description: 'Toggle dark mode' },
  
  // Accessibility
  INCREASE_FONT: { key: 'Ctrl+Plus', description: 'Increase font size' },
  DECREASE_FONT: { key: 'Ctrl+Minus', description: 'Decrease font size' },
  RESET_FONT: { key: 'Ctrl+0', description: 'Reset font size' },
  TOGGLE_HIGH_CONTRAST: { key: 'Ctrl+Shift+C', description: 'Toggle high contrast' },
  TOGGLE_REDUCED_MOTION: { key: 'Ctrl+Shift+M', description: 'Toggle reduced motion' },
  
  // Help
  OPEN_HELP: { key: 'F1', description: 'Open help' },
  SHOW_SHORTCUTS: { key: '?', description: 'Show keyboard shortcuts' },
  
  // Settings
  OPEN_SETTINGS: { key: 'Ctrl+,', description: 'Open settings' },
  
  // Refresh
  REFRESH: { key: 'F5', description: 'Refresh page' },
  HARD_REFRESH: { key: 'Ctrl+F5', description: 'Hard refresh' },
  
  // Focus management
  FOCUS_MAIN: { key: 'Tab', description: 'Navigate through focusable elements' },
  SKIP_TO_CONTENT: { key: 'Tab', description: 'Skip to main content' },
  
  // Form controls
  SUBMIT_FORM: { key: 'Enter', description: 'Submit form' },
  CANCEL_FORM: { key: 'Escape', description: 'Cancel form' },
  
  // Selection
  SELECT_ALL: { key: 'Ctrl+A', description: 'Select all items' },
  DESELECT_ALL: { key: 'Ctrl+Shift+A', description: 'Deselect all items' },
  
  // Actions
  UNDO: { key: 'Ctrl+Z', description: 'Undo last action' },
  REDO: { key: 'Ctrl+Y', description: 'Redo last action' },
  COPY: { key: 'Ctrl+C', description: 'Copy selected item' },
  PASTE: { key: 'Ctrl+V', description: 'Paste item' },
  DELETE: { key: 'Delete', description: 'Delete selected item' },
  
  // Navigation
  FIRST_ITEM: { key: 'Home', description: 'Go to first item' },
  LAST_ITEM: { key: 'End', description: 'Go to last item' },
  PAGE_UP: { key: 'PageUp', description: 'Go up one page' },
  PAGE_DOWN: { key: 'PageDown', description: 'Go down one page' },
};

// Focus management utilities
export const focusManagement = {
  // Focus trap for modals
  createFocusTrap: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
  
  // Focus first focusable element
  focusFirstElement: (container: HTMLElement) => {
    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusableElement) {
      focusableElement.focus();
    }
  },
  
  // Focus last focusable element
  focusLastElement: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (lastElement) {
      lastElement.focus();
    }
  },
  
  // Store and restore focus
  storeFocus: () => {
    const activeElement = document.activeElement as HTMLElement;
    return activeElement;
  },
  
  restoreFocus: (element: HTMLElement) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },
};

// Screen reader utilities
export const screenReader = {
  // Announce message to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
  
  // Announce loading state
  announceLoading: (message: string = 'Loading content') => {
    screenReader.announce(message, 'polite');
  },
  
  // Announce error
  announceError: (message: string) => {
    screenReader.announce(message, 'assertive');
  },
  
  // Announce success
  announceSuccess: (message: string) => {
    screenReader.announce(message, 'polite');
  },
  
  // Announce navigation
  announceNavigation: (destination: string) => {
    screenReader.announce(`Navigated to ${destination}`, 'polite');
  },
};

// High contrast mode detection
export const highContrast = {
  // Check if high contrast mode is enabled
  isEnabled: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Listen for high contrast mode changes
  onChanged: (callback: (isHighContrast: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  },
};

// Reduced motion detection
export const reducedMotion = {
  // Check if reduced motion is preferred
  isPreferred: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Listen for reduced motion preference changes
  onChanged: (callback: (isReduced: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  },
  
  // Apply reduced motion styles
  applyReducedMotion: (element: HTMLElement) => {
    if (reducedMotion.isPreferred()) {
      element.style.setProperty('--animation-duration', '0.01ms');
      element.style.setProperty('--transition-duration', '0.01ms');
    }
  },
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  // Calculate contrast ratio
  getContrastRatio: (l1: number, l2: number): number => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },
  
  // Check if contrast meets WCAG AA standards
  meetsWCAGAA: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    const requiredRatio = isLargeText ? 3 : 4.5;
    return contrastRatio >= requiredRatio;
  },
  
  // Check if contrast meets WCAG AAA standards
  meetsWCAGAAA: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    const requiredRatio = isLargeText ? 4.5 : 7;
    return contrastRatio >= requiredRatio;
  },
};

// Export all utilities
export default {
  ARIA_LABELS,
  ARIA_DESCRIPTIONS,
  KEYBOARD_SHORTCUTS,
  focusManagement,
  screenReader,
  highContrast,
  reducedMotion,
  colorContrast,
};
