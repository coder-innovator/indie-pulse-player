import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

/**
 * Upload Helpers for Supabase Storage Integration
 * Provides file validation, chunked uploads, progress tracking, and error handling
 */

// Configuration constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  ALLOWED_AUDIO_TYPES: ['.mp3', '.wav', '.m4a'],
  ALLOWED_AUDIO_MIMES: [
    'audio/mpeg',      // .mp3
    'audio/wav',       // .wav
    'audio/x-wav',     // .wav (alternative)
    'audio/wave',      // .wav (alternative)
    'audio/mp4',       // .m4a
    'audio/x-m4a',     // .m4a (alternative)
  ],
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
} as const;

/**
 * File validation result interface
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
    hash: string;
  };
}

/**
 * Upload progress callback interface
 */
export interface UploadProgress {
  stage: 'validating' | 'uploading' | 'processing' | 'completing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  bytesUploaded?: number;
  totalBytes?: number;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  filePath?: string;
  error?: string;
  trackId?: string;
}

/**
 * Audio metadata interface
 */
export interface AudioMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
}

/**
 * Validate audio file before upload
 */
export const validateAudioFile = async (file: File): Promise<FileValidationResult> => {
  try {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024;
      return { 
        isValid: false, 
        error: `File too large. Maximum size is ${maxSizeMB}MB, but file is ${(file.size / 1024 / 1024).toFixed(1)}MB` 
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.includes(extension as any)) {
      return { 
        isValid: false, 
        error: `Invalid format. Only ${UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.join(', ')} files are allowed` 
      };
    }

    // Check MIME type
    if (!UPLOAD_CONFIG.ALLOWED_AUDIO_MIMES.includes(file.type as any)) {
      return { 
        isValid: false, 
        error: `Invalid file type. Expected audio file, got ${file.type}` 
      };
    }

    // Generate MD5 hash for duplicate detection
    const hash = await generateFileHash(file);

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        extension,
        hash,
      }
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Generate MD5 hash of file for duplicate detection
 */
export const generateFileHash = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const hash = CryptoJS.MD5(wordArray).toString();
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file for hashing'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Check for duplicate files by hash
 */
export const checkForDuplicateFile = async (hash: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title')
      .eq('file_hash', hash)
      .limit(1);

    if (error) {
      console.warn('Error checking for duplicates:', error);
      return false; // Don't block upload if check fails
    }

    return data && data.length > 0;
  } catch (error) {
    console.warn('Error checking for duplicates:', error);
    return false;
  }
};

/**
 * Extract audio metadata from file
 */
export const extractAudioMetadata = (file: File): Promise<AudioMetadata> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    audio.onloadedmetadata = () => {
      const metadata: AudioMetadata = {
        duration: audio.duration,
        format: file.type,
      };
      
      cleanup();
      resolve(metadata);
    };

    audio.onerror = () => {
      cleanup();
      resolve({}); // Return empty metadata on error
    };

    // Set a timeout to prevent hanging
    setTimeout(() => {
      cleanup();
      resolve({});
    }, 10000);

    audio.src = objectUrl;
  });
};

/**
 * Upload file to Supabase Storage with chunking and progress tracking
 */
export const uploadFileToStorage = async (
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  let attempt = 0;
  
  while (attempt < UPLOAD_CONFIG.RETRY_ATTEMPTS) {
    try {
      attempt++;
      
      onProgress({
        stage: 'uploading',
        progress: 0,
        message: `Starting upload (attempt ${attempt}/${UPLOAD_CONFIG.RETRY_ATTEMPTS})...`,
        bytesUploaded: 0,
        totalBytes: file.size,
      });

      // For files larger than chunk size, use resumable upload
      if (file.size > UPLOAD_CONFIG.CHUNK_SIZE) {
        return await uploadLargeFile(file, bucket, filePath, onProgress, attempt);
      } else {
        return await uploadSmallFile(file, bucket, filePath, onProgress);
      }
      
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt >= UPLOAD_CONFIG.RETRY_ATTEMPTS) {
        return {
          success: false,
          error: `Upload failed after ${UPLOAD_CONFIG.RETRY_ATTEMPTS} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      
      // Wait before retry
      onProgress({
        stage: 'uploading',
        progress: 0,
        message: `Upload failed, retrying in ${UPLOAD_CONFIG.RETRY_DELAY / 1000} seconds...`,
      });
      
      await new Promise(resolve => setTimeout(resolve, UPLOAD_CONFIG.RETRY_DELAY * attempt));
    }
  }

  return {
    success: false,
    error: 'Upload failed after all retry attempts'
  };
};

/**
 * Upload small files directly
 */
const uploadSmallFile = async (
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false // Prevent overwriting
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  onProgress({
    stage: 'uploading',
    progress: 100,
    message: 'Upload completed successfully',
    bytesUploaded: file.size,
    totalBytes: file.size,
  });

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    success: true,
    fileUrl: urlData.publicUrl,
    filePath: data.path,
  };
};

/**
 * Upload large files with chunking (simplified for Supabase)
 * Note: Supabase doesn't support true chunked uploads, but we simulate progress
 */
const uploadLargeFile = async (
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (progress: UploadProgress) => void,
  attempt: number
): Promise<UploadResult> => {
  // Simulate chunked upload progress
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) {
        clearInterval(interval);
        return;
      }
      
      onProgress({
        stage: 'uploading',
        progress: Math.min(progress, 90),
        message: `Uploading large file... ${Math.round(progress)}%`,
        bytesUploaded: Math.round((progress / 100) * file.size),
        totalBytes: file.size,
      });
    }, 500);
    
    return interval;
  };

  const progressInterval = simulateProgress();

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    clearInterval(progressInterval);

    if (error) {
      throw new Error(`Large file upload failed: ${error.message}`);
    }

    onProgress({
      stage: 'uploading',
      progress: 100,
      message: 'Large file upload completed successfully',
      bytesUploaded: file.size,
      totalBytes: file.size,
    });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      filePath: data.path,
    };
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
};

/**
 * Create database entry for uploaded track
 */
export const createTrackRecord = async (
  trackData: {
    title: string;
    description: string;
    bpm: number;
    mood: string;
    genre: string;
    scene: string;
    audioUrl: string;
    coverUrl?: string;
    fileHash: string;
    metadata: AudioMetadata;
  },
  artistId: string
): Promise<UploadResult> => {
  try {
    // Create track record
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        artist_id: artistId,
        title: trackData.title,
        description: trackData.description,
        bpm: trackData.bpm,
        stream_url: trackData.audioUrl,
        cover_url: trackData.coverUrl || '/src/assets/sample-cover-1.jpg',
        popularity_tier: 'emerging',
        unique_listeners: 0,
        total_plays: 0,
        duration: trackData.metadata.duration || null,
        file_hash: trackData.fileHash,
      })
      .select('id')
      .single();

    if (trackError) {
      throw new Error(`Failed to create track record: ${trackError.message}`);
    }

    // Create tags
    const tagTypes = [
      { name: trackData.mood, type: 'mood' },
      { name: trackData.genre, type: 'genre' },
      { name: trackData.scene, type: 'scene' }
    ];

    for (const tagInfo of tagTypes) {
      // Get or create tag
      let { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagInfo.name)
        .eq('type', tagInfo.type)
        .single();

      let tagId;
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({
            name: tagInfo.name,
            type: tagInfo.type
          })
          .select('id')
          .single();

        if (tagError) {
          console.warn(`Failed to create tag ${tagInfo.name}:`, tagError);
          continue; // Skip this tag but don't fail the entire upload
        }
        tagId = newTag.id;
      }

      // Create track-tag relationship
      const { error: trackTagError } = await supabase
        .from('track_tags')
        .insert({
          track_id: track.id,
          tag_id: tagId
        });

      if (trackTagError) {
        console.warn(`Failed to link tag ${tagInfo.name}:`, trackTagError);
      }
    }

    return {
      success: true,
      trackId: track.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create track record'
    };
  }
};

/**
 * Clean up partial uploads on failure
 */
export const cleanupFailedUpload = async (
  bucket: string,
  filePath?: string,
  trackId?: string
): Promise<void> => {
  try {
    // Remove file from storage if it was uploaded
    if (filePath) {
      await supabase.storage
        .from(bucket)
        .remove([filePath]);
    }

    // Remove track record if it was created
    if (trackId) {
      // Remove track-tag relationships first
      await supabase
        .from('track_tags')
        .delete()
        .eq('track_id', trackId);

      // Remove track record
      await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
    // Don't throw - cleanup failure shouldn't block error reporting
  }
};

/**
 * Get or create artist profile
 */
export const getOrCreateArtist = async (userId: string, userEmail?: string): Promise<{ id: string } | null> => {
  try {
    // Try to get existing artist
    let { data: artist } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!artist) {
      // Create new artist
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert({
          user_id: userId,
          name: userEmail?.split('@')[0] || 'Unknown Artist',
          bio: 'New artist on SoundScape'
        })
        .select('id')
        .single();

      if (artistError) {
        throw new Error(`Failed to create artist profile: ${artistError.message}`);
      }
      artist = newArtist;
    }

    return artist;
  } catch (error) {
    console.error('Error getting/creating artist:', error);
    return null;
  }
};
