'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye } from 'lucide-react';

export interface Product {
  id: string;
  title: string;
  price: number;
  fabric: string;
  category: string;
  sourceLink: string;
  source: 'Amazon' | 'Flipkart' | 'Myntra' | 'Meesho';
  comfortLevel?: string;
  occasion?: string;
  isInWishlist?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToWishlist?: (productId: string) => void;
  onView?: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToWishlist,
  onView,
}: ProductCardProps) {
  const trackedBuyUrl = `/api/affiliate/click?productId=${encodeURIComponent(product.id)}&platform=${encodeURIComponent(product.source)}&affiliateLink=${encodeURIComponent(product.sourceLink)}`;

  return (
    <Card className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image Placeholder */}
      <div className="bg-muted aspect-video flex items-center justify-center text-4xl border-b border-border">
        👕
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-foreground text-lg line-clamp-2">{product.title}</h3>
            <Badge variant="outline" className="text-xs text-accent border-accent flex-shrink-0">
              {product.source}
            </Badge>
          </div>

          <p className="text-accent text-2xl font-bold mb-4">₹{product.price}</p>

          {/* Details */}
          <div className="space-y-2 text-sm mb-4">
            {product.fabric && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fabric:</span>
                <span className="text-foreground font-medium">{product.fabric}</span>
              </div>
            )}
            {product.occasion && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occasion:</span>
                <span className="text-foreground font-medium">{product.occasion}</span>
              </div>
            )}
            {product.comfortLevel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comfort:</span>
                <span className="text-foreground font-medium">{product.comfortLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={() => onView?.(product)}
            asChild
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            <a href={trackedBuyUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">View</span>
            </a>
          </Button>
          <Button
            onClick={() => onAddToWishlist?.(product.id)}
            variant={product.isInWishlist ? 'default' : 'outline'}
            size="sm"
            className={
              product.isInWishlist
                ? 'bg-accent text-accent-foreground'
                : 'border-border text-foreground hover:bg-muted'
            }
          >
            <Heart
              className="h-4 w-4"
              fill={product.isInWishlist ? 'currentColor' : 'none'}
            />
          </Button>
        </div>
      </div>
    </Card>
  );
}
