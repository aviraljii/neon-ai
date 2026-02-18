'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploadInput } from '@/components/upload/ImageUploadInput';

interface FeedPost {
  _id: string;
  image: string;
  title: string;
  link: string;
  userId: string;
  createdAt: string;
}

function createGuestUserId() {
  return `guest_${Math.random().toString(36).slice(2, 10)}`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const existing = localStorage.getItem('userId');
    const currentUserId = existing || createGuestUserId();
    localStorage.setItem('userId', currentUserId);
    setUserId(currentUserId);
    void loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const response = await fetch('/api/posts');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch posts');
      setPosts(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch posts');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !link.trim() || !imageUrl.trim()) {
      setError('Uploaded image, title, and affiliate link are required');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set('title', title.trim());
      formData.set('link', link.trim());
      formData.set('userId', userId || 'anonymous');
      formData.set('imageUrl', imageUrl.trim());

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create post');
      }

      setPosts((prev) => [result, ...prev]);
      setTitle('');
      setLink('');
      setImageUrl('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/posts/${id}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete post');
      }
      setPosts((prev) => prev.filter((post) => post._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete post');
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-6 border-border bg-card">
          <h1 className="text-2xl font-bold">Style Feed</h1>
          <p className="text-sm text-muted-foreground">Pinterest-style affiliate post feed</p>
        </Card>

        <Card className="p-6 border-border bg-card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <ImageUploadInput onUploaded={setImageUrl} />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
            />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Affiliate link"
            />
            <Button type="submit" disabled={isLoading} className="bg-accent text-accent-foreground">
              {isLoading ? 'Posting...' : 'Post to Feed'}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </Card>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          {posts.map((post) => (
            <Card key={post._id} className="mb-4 break-inside-avoid overflow-hidden border-border bg-card">
              <a href={post.link} target="_blank" rel="noopener noreferrer">
                <img src={post.image} alt={post.title} className="w-full h-auto object-cover" />
              </a>
              <div className="p-4 space-y-3">
                <p className="font-medium">{post.title}</p>
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline block truncate"
                >
                  Buy now
                </a>
                {post.userId === userId && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(post._id)}>
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
