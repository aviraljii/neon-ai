'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/api';

interface ImageUploadInputProps {
  onUploaded: (url: string) => void;
  onImageSelected?: (file: File) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUploadInput({ onUploaded, onImageSelected }: ImageUploadInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    // Check file type
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Only JPG, PNG, and WEBP images are allowed';
    }

    // Check file extension
    const fileName = f.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return 'Invalid file extension. Use JPG, PNG, or WEBP';
    }

    // Check file size
    if (f.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }

    return null;
  }

  function handleFileSelect(f: File) {
    setError('');

    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview('');
      return;
    }

    setFile(f);
    onImageSelected?.(f);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    } else {
      setError('Please drop an image file');
    }
  }

  async function handleUpload() {
    setError('');
    if (!file) {
      setError('Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadImage(file);

      if (!result.success || result.error) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploaded(result.url);
      clearUpload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function clearUpload() {
    setFile(null);
    setPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors',
          isDragging
            ? 'border-accent bg-accent/10'
            : file
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {preview ? (
            <div className="relative w-full">
              <img
                src={preview}
                alt="Preview"
                className="max-h-32 w-auto mx-auto rounded object-cover"
              />
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {file ? 'Image selected' : 'Drag and drop an image here'}
                </p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Info */}
      {file && !error && (
        <div className="text-xs text-muted-foreground">
          <p>File: {file.name}</p>
          <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Action Buttons */}
      {file && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            size="sm"
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <Button
            type="button"
            onClick={clearUpload}
            disabled={isUploading}
            size="sm"
            variant="outline"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
