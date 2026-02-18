'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadInputProps {
  onUploaded: (url: string) => void;
}

export function ImageUploadInput({ onUploaded }: ImageUploadInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');

  async function handleUpload() {
    setError('');
    if (!file) {
      setError('Please choose an image first');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const url = String(result.url || '');
      if (!url) {
        throw new Error('Upload did not return a URL');
      }

      setUploadedUrl(url);
      onUploaded(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
      <Button type="button" onClick={handleUpload} disabled={isUploading} variant="outline">
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </Button>
      {uploadedUrl && (
        <p className="text-xs text-muted-foreground truncate">Uploaded: {uploadedUrl}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
