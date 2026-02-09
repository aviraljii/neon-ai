'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Sparkles, Home, Search, Clock } from 'lucide-react';

const SAMPLE_SEARCHES = [
  {
    id: '1',
    query: 'Cotton T-shirt under 500',
    timestamp: '2 hours ago',
    result: 'Recommended 3 products',
  },
  {
    id: '2',
    query: 'Formal shirt for office',
    timestamp: '1 day ago',
    result: 'Recommended 5 products',
  },
  {
    id: '3',
    query: 'Summer casual dress',
    timestamp: '2 days ago',
    result: 'Recommended 4 products',
  },
];

const SAMPLE_RECOMMENDATIONS = [
  {
    id: '1',
    title: 'Premium Cotton Shirt',
    price: '₹1,299',
    source: 'Amazon',
    fabric: 'Cotton',
  },
  {
    id: '2',
    title: 'Summer Casual Dress',
    price: '₹899',
    source: 'Myntra',
    fabric: 'Linen Blend',
  },
  {
    id: '3',
    title: 'Comfortable Lounge Wear',
    price: '₹699',
    source: 'Flipkart',
    fabric: 'Cotton Blend',
  },
];

export default function DashboardPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Your Shopping Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your searches, recommendations, and saved products
          </p>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Searches */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-accent" />
                <h2 className="text-2xl font-bold text-foreground">Recent Searches</h2>
              </div>

              <div className="space-y-3">
                {SAMPLE_SEARCHES.map((search) => (
                  <Card
                    key={search.id}
                    className="bg-card border-border p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{search.query}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{search.result}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4">{search.timestamp}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recommendations */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Search className="h-5 w-5 text-secondary" />
                <h2 className="text-2xl font-bold text-foreground">Recommendations</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {SAMPLE_RECOMMENDATIONS.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-card border-border p-4 sm:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
                        <p className="text-accent text-lg font-bold mt-2">{item.price}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Source:</span>
                          <span className="text-foreground font-medium">{item.source}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fabric:</span>
                          <span className="text-foreground font-medium">{item.fabric}</span>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        size="sm"
                      >
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          View Product
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-card border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Searches</p>
                  <p className="text-3xl font-bold text-accent">12</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products Analyzed</p>
                  <p className="text-3xl font-bold text-secondary">34</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                  <p className="text-3xl font-bold text-accent">8</p>
                </div>
              </div>
            </Card>

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-accent/20 to-secondary/20 border-accent/40 p-6">
              <h3 className="font-bold text-foreground mb-3">Continue Shopping</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste a product link to get AI-powered recommendations
              </p>
              <Button
                asChild
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/chat">Go to Chat</Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
