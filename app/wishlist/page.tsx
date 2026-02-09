'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Sparkles, Home, Trash2, Heart } from 'lucide-react';
import { useState } from 'react';

const SAMPLE_WISHLIST = [
  {
    id: '1',
    title: 'Premium Linen Shirt',
    price: '₹2,499',
    image: '👔',
    source: 'Amazon',
    fabric: 'Pure Linen',
    occasion: 'Formal',
    addedDate: '5 days ago',
  },
  {
    id: '2',
    title: 'Summer Casual T-Shirt',
    price: '₹599',
    image: '👕',
    source: 'Flipkart',
    fabric: 'Cotton Blend',
    occasion: 'Casual',
    addedDate: '3 days ago',
  },
  {
    id: '3',
    title: 'Comfortable Jeans',
    price: '₹1,899',
    image: '👖',
    source: 'Myntra',
    fabric: 'Cotton Denim',
    occasion: 'Casual',
    addedDate: '2 days ago',
  },
  {
    id: '4',
    title: 'Formal Office Dress',
    price: '₹3,999',
    image: '👗',
    source: 'Meesho',
    fabric: 'Rayon',
    occasion: 'Formal',
    addedDate: '1 day ago',
  },
  {
    id: '5',
    title: 'Lightweight Summer Dress',
    price: '₹1,299',
    image: '👗',
    source: 'Amazon',
    fabric: 'Cotton Blend',
    occasion: 'Casual',
    addedDate: '1 day ago',
  },
  {
    id: '6',
    title: 'Premium Sweater',
    price: '₹2,199',
    image: '🧥',
    source: 'Flipkart',
    fabric: 'Wool Blend',
    occasion: 'Casual',
    addedDate: '6 hours ago',
  },
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(SAMPLE_WISHLIST);

  const handleRemove = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold text-foreground hidden sm:inline">Neon AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="text-foreground hover:bg-muted"
            >
              <Link href="/chat">Chat</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border text-foreground hover:bg-muted bg-transparent"
            >
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-accent" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Your Wishlist</h1>
          </div>
          <p className="text-muted-foreground">
            {wishlist.length} items saved • Manage your favorite products in one place
          </p>
        </div>

        {/* Wishlist Grid */}
        {wishlist.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card key={item.id} className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                {/* Image Placeholder */}
                <div className="bg-muted aspect-square flex items-center justify-center text-6xl border-b border-border">
                  {item.image}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                    <p className="text-accent text-xl font-bold mt-2">{item.price}</p>

                    {/* Details */}
                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-foreground font-medium">{item.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fabric:</span>
                        <span className="text-foreground font-medium">{item.fabric}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Occasion:</span>
                        <span className="text-foreground font-medium">{item.occasion}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Added:</span>
                        <span className="text-foreground font-medium text-xs">{item.addedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-6">
                    <Button
                      asChild
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      size="sm"
                    >
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                    <Button
                      onClick={() => handleRemove(item.id)}
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Save your favorite products while chatting with Neon AI
            </p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/chat">Start Shopping</Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
