import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

export interface ProductComparison {
  id: string;
  name: string;
  price: number;
  fabric: string;
  comfortLevel: string;
  occasion: string;
  pros: string[];
  cons: string[];
  valueScore: number;
  source: string;
}

interface ComparisonGridProps {
  products: ProductComparison[];
}

export function ComparisonGrid({ products }: ComparisonGridProps) {
  const allAttributes = ['Fabric', 'Comfort', 'Price Value', 'Design', 'Durability'];

  return (
    <div className="space-y-6">
      {/* Product Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="bg-card border-border p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                  <Badge variant="outline" className="text-accent border-accent">
                    {product.source}
                  </Badge>
                </div>
                <p className="text-accent text-2xl font-bold">₹{product.price}</p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fabric</span>
                  <span className="text-foreground font-medium">{product.fabric}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comfort</span>
                  <span className="text-foreground font-medium">{product.comfortLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Occasion</span>
                  <span className="text-foreground font-medium">{product.occasion}</span>
                </div>
              </div>

              {/* Value Score */}
              <div className="py-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Value Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-accent rounded-full h-2 transition-all"
                      style={{ width: `${product.valueScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-accent">{product.valueScore}%</span>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="space-y-3">
                {/* Pros */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Pros</p>
                  <ul className="space-y-1">
                    {product.pros.map((pro, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-accent flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Cons</p>
                  <ul className="space-y-1">
                    {product.cons.map((con, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <X className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Attribute</th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    className="px-4 py-3 text-center font-semibold text-foreground"
                  >
                    {product.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAttributes.map((attr) => (
                <tr key={attr} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{attr}</td>
                  {products.map((product) => (
                    <td key={product.id} className="px-4 py-3 text-center text-muted-foreground">
                      {attr === 'Fabric' && product.fabric}
                      {attr === 'Comfort' && product.comfortLevel}
                      {attr === 'Price Value' && `₹${product.price}`}
                      {attr === 'Design' && product.occasion}
                      {attr === 'Durability' && (
                        <div className="flex justify-center">
                          <span className="text-accent font-semibold">{product.valueScore}%</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendation */}
      {products.length > 0 && (
        <Card className="bg-gradient-to-r from-accent/20 to-secondary/20 border-accent/40 p-6">
          <h3 className="font-bold text-foreground mb-3">Our Recommendation</h3>
          <p className="text-muted-foreground">
            The best choice depends on your priorities. {products[0]?.name} offers the best
            overall value, but compare based on your specific needs for fabric, comfort, and
            occasion.
          </p>
        </Card>
      )}
    </div>
  );
}
