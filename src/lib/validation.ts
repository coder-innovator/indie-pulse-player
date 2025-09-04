/**
 * Validation utility functions for the SoundScape application
 */

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (minimum 8 characters, at least one letter and one number)
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Audio file validation
export const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid audio file type. Please use MP3, WAV, FLAC, OGG, or M4A.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 100MB.' };
  }
  
  return { isValid: true };
};

// Image file validation
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid image file type. Please use JPEG, PNG, WebP, or GIF.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large. Maximum size is 10MB.' };
  }
  
  return { isValid: true };
};

// Track title validation
export const validateTrackTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title.trim()) {
    return { isValid: false, error: 'Track title is required.' };
  }
  
  if (title.length > 100) {
    return { isValid: false, error: 'Track title must be less than 100 characters.' };
  }
  
  return { isValid: true };
};

// BPM validation
export const validateBPM = (bpm: number): { isValid: boolean; error?: string } => {
  if (bpm < 60 || bpm > 200) {
    return { isValid: false, error: 'BPM must be between 60 and 200.' };
  }
  
  return { isValid: true };
};

// Duration validation (in seconds)
export const validateDuration = (duration: number): { isValid: boolean; error?: string } => {
  if (duration < 1) {
    return { isValid: false, error: 'Duration must be at least 1 second.' };
  }
  
  if (duration > 3600) { // 1 hour
    return { isValid: false, error: 'Duration must be less than 1 hour.' };
  }
  
  return { isValid: true };
};

// Required field validation
export const validateRequired = (value: string | number | null | undefined, fieldName: string): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  
  return { isValid: true };
};

// URL validation
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Username validation
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required.' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters long.' };
  }
  
  // Only allow alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens.' };
  }
  
  return { isValid: true };
};

// Bio validation
export const validateBio = (bio: string): { isValid: boolean; error?: string } => {
  if (bio.length > 500) {
    return { isValid: false, error: 'Bio must be less than 500 characters.' };
  }
  
  return { isValid: true };
};

// Form validation helper
export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => { isValid: boolean; error?: string }>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
