import { useQuery } from "@tanstack/react-query";
import { SupplierPromotion, Supplier, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Tag, Calendar, Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type PromotionWithSupplier = SupplierPromotion & {
  supplier: Supplier & { user: User };
};

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery<PromotionWithSupplier[]>({
    queryKey: ["/api/promotions/active"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter and sort: Featured promotions first, then by discount
  const activePromotions = promotions?.filter(p => p.isActive) || [];
  const featuredPromos = activePromotions.filter(p => p.supplier.featured);
  const regularPromos = activePromotions.filter(p => !p.supplier.featured);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Promotions</h1>
          <p className="text-muted-foreground mt-1">
            Discover exclusive deals and offers from our trusted suppliers.
          </p>
        </div>
        <Link href="/suppliers">
          <Button variant="outline" size="sm">
            View All Suppliers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {activePromotions.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-lg font-medium">No active promotions</p>
            <p className="text-muted-foreground">Check back later for new deals!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Featured Section - Larger Space */}
          {featuredPromos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                  Featured Deals
                </Badge>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPromos.map((promo) => (
                  <PromotionCard key={promo.id} promo={promo} isFeatured />
                ))}
              </div>
            </section>
          )}

          {/* Regular Section */}
          {regularPromos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold">All Offers</h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {regularPromos.map((promo) => (
                  <PromotionCard key={promo.id} promo={promo} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PromotionCard({ promo, isFeatured }: { promo: PromotionWithSupplier; isFeatured?: boolean }) {
  const images = promo.images as string[] || [];
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${isFeatured ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="relative">
        {mainImage ? (
          <div className={`${isFeatured ? 'h-64 md:h-80' : 'h-48'} overflow-hidden`}>
            <img 
              src={mainImage} 
              alt={promo.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className={`${isFeatured ? 'h-64 md:h-80' : 'h-48'} bg-muted flex items-center justify-center`}>
            <Tag className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        
        {promo.discountPercentage && (
          <Badge className="absolute top-4 right-4 bg-red-600 text-white border-none text-lg font-bold px-3 py-1">
            -{promo.discountPercentage}%
          </Badge>
        )}
        
        {isFeatured && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-none px-3 py-1 shadow-sm">
            PREMIUM PARTNER
          </Badge>
        )}
      </div>

      <CardHeader className={`${isFeatured ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-primary" />
          <Link href={`/suppliers/${promo.supplier.userId}`}>
            <a className="text-sm font-medium hover:text-primary transition-colors">
              {promo.supplier.companyName}
            </a>
          </Link>
        </div>
        <CardTitle className={`${isFeatured ? 'text-2xl' : 'text-lg'} line-clamp-1`}>
          {promo.title}
        </CardTitle>
        <CardDescription className={`${isFeatured ? 'text-base' : 'text-sm'} line-clamp-2 mt-2`}>
          {promo.description}
        </CardDescription>
      </CardHeader>

      <CardContent className={`${isFeatured ? 'p-6 pt-0' : 'p-4 pt-0'} flex flex-col gap-4`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Valid until {format(new Date(promo.validUntil), "MMM d, yyyy")}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <Link href={`/suppliers/${promo.supplier.userId}`}>
            <Button variant={isFeatured ? "default" : "outline"} className="w-full">
              Claim Offer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
