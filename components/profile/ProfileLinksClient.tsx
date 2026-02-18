'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface LinkItem {
  _id: string;
  title: string;
  url: string;
}

interface ProfileResponse {
  username: string;
  userId?: string;
  links: LinkItem[];
}

interface ProfileLinksClientProps {
  username: string;
}

export function ProfileLinksClient({ username }: ProfileLinksClientProps) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    setUserId(storedUserId);
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function loadProfile() {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/profile-links/${encodeURIComponent(username)}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load profile');
      }
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    setError('');
    if (!title.trim() || !url.trim()) {
      setError('Title and URL are required');
      return;
    }

    try {
      const response = await fetch(`/api/profile-links/${encodeURIComponent(username)}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: editingId || undefined,
          title: title.trim(),
          url: url.trim(),
          userId: userId || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save link');
      }

      setData(result);
      setTitle('');
      setUrl('');
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save link');
    }
  }

  async function handleDelete(linkId: string) {
    setError('');
    try {
      const response = await fetch(`/api/profile-links/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, userId: userId || undefined }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete link');
      }
      setData(result);
      if (editingId === linkId) {
        setEditingId(null);
        setTitle('');
        setUrl('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete link');
    }
  }

  function startEdit(item: LinkItem) {
    setEditingId(item._id);
    setTitle(item.title);
    setUrl(item.url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6 border-border bg-card">
          <h1 className="text-2xl font-bold">@{username}</h1>
          <p className="text-sm text-muted-foreground">Public profile links page</p>
        </Card>

        <Card className="p-6 border-border bg-card space-y-3">
          <h2 className="font-semibold">{editingId ? 'Edit Link' : 'Add Link'}</h2>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title"
          />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="bg-accent text-accent-foreground">
              {editingId ? 'Update Link' : 'Add Link'}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setTitle('');
                  setUrl('');
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>

        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading links...</p>}
          {!isLoading && (!data?.links || data.links.length === 0) && (
            <Card className="p-6 border-border bg-card text-sm text-muted-foreground">
              No links added yet.
            </Card>
          )}
          {data?.links?.map((item) => (
            <Card key={item._id} className="p-4 border-border bg-card">
              <div className="flex items-center justify-between gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline truncate"
                >
                  {item.title}
                </a>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
