import { useQuery } from "@tanstack/react-query";
import { SupplierPromotion, Supplier, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Tag, Calendar, Building2, ArrowRight, Star, Percent, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';

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

  const activePromotions = promotions?.filter(p => p.isActive) || [];
  const featuredPromos = activePromotions.filter(p => p.supplier.featured);
  const regularPromos = activePromotions.filter(p => !p.supplier.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-[#1a3a3a] py-16 mb-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-transparent to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1">
            Exclusive Marketplace Deals
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Supplier <span className="text-orange-400">Promotions</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Save big on materials and equipment from our verified network of industry-leading suppliers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {activePromotions.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Tag className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">No active promotions right now</h3>
              <p className="text-muted-foreground text-center max-w-md">
                We're currently working with our suppliers to bring you new exclusive deals. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-16">
            {/* Featured Carousel Section */}
            {featuredPromos.length > 0 && (
              <section className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Sparkles className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Featured Partners</h2>
                      <p className="text-sm text-muted-foreground">Top-tier deals from our premium suppliers</p>
                    </div>
                  </div>
                </div>
                
                <FeaturedCarousel promos={featuredPromos} />
              </section>
            )}

            {/* Regular Grid Section */}
            {regularPromos.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Percent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Marketplace Offers</h2>
                    <p className="text-sm text-muted-foreground">Browse all current discounts and limited-time deals</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularPromos.map((promo) => (
                    <PromotionCard key={promo.id} promo={promo} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedCarousel({ promos }: { promos: PromotionWithSupplier[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false
  });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex -ml-4 md:-ml-6">
          {promos.map((promo) => (
            <div key={promo.id} className="flex-[0_0_100%] md:flex-[0_0_80%] lg:flex-[0_0_65%] pl-4 md:pl-6">
              <Link href={`/suppliers/${promo.supplier.userId}`}>
                <div className="relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden cursor-pointer group/card border shadow-xl">
                  {/* Background Image */}
                  {(promo.images as string[])?.length > 0 ? (
                    <img 
                      src={(promo.images as string[])[0]} 
                      alt={promo.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-white px-3 py-1 font-bold">
                        FEATURED PARTNER
                      </Badge>
                      {promo.discountPercentage && (
                        <Badge variant="outline" className="text-white border-white/30 backdrop-blur-md bg-white/10 px-3 py-1 font-bold">
                          SAVE {promo.discountPercentage}%
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight group-hover/card:text-orange-400 transition-colors">
                      {promo.title}
                    </h3>
                    
                    <p className="text-white/80 text-lg mb-8 line-clamp-2 max-w-2xl font-medium">
                      {promo.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center">
                          <img 
                            src={promo.supplier.logo || promo.supplier.user?.profilePhotoUrl || "/placeholder-supplier.png"} 
                            alt={promo.supplier.companyName}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                        <div>
                          <p className="text-orange-400 font-bold tracking-wider text-sm uppercase">SUPPLIED BY</p>
                          <p className="text-xl font-black">{promo.supplier.companyName}</p>
                        </div>
                      </div>
                      
                      <Button className="bg-white text-black hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-full px-8 py-6 h-auto text-lg font-bold shadow-2xl">
                        Claim This Offer
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {promos.length > 1 && (
        <>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={scrollPrev}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white rounded-full h-12 w-12 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all z-20 hidden md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={scrollNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white rounded-full h-12 w-12 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all z-20 hidden md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
}

function PromotionCard({ promo }: { promo: PromotionWithSupplier }) {
  const images = promo.images as string[] || [];
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <Card className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 flex flex-col h-full">
      <div className="relative aspect-[16/10] overflow-hidden">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={promo.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Tag className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {promo.discountPercentage && (
            <div className="bg-red-500 text-white font-black text-sm px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Percent className="h-3 w-3" />
              {promo.discountPercentage}% OFF
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center flex-shrink-0">
            <img 
              src={promo.supplier.logo || promo.supplier.user?.profilePhotoUrl || "/placeholder-supplier.png"} 
              alt={promo.supplier.companyName}
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
            {promo.supplier.companyName}
          </p>
        </div>

        <h3 className="text-xl font-bold mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {promo.title}
        </h3>
        
        <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1 font-medium">
          {promo.description}
        </p>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">EXPIRES</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(promo.validUntil), "MMM d, yyyy")}
            </div>
          </div>
          
          <Link href={`/suppliers/${promo.supplier.userId}`}>
            <Button size="sm" className="rounded-full px-6 font-bold hover-elevate transition-all">
              View Offer
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
