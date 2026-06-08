import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Phone, Mail, Building2, Star, Tag, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function PublicSuppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [, setLocation] = useLocation();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['public-suppliers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/public/suppliers');
      return response.json();
    },
  });

  const categories: string[] = suppliers
    ? Array.from(new Set(suppliers.map((s: any) => s.industryType as string)))
    : [];

  const filteredSuppliers = suppliers?.filter((supplier: any) => {
    const matchesSearch =
      supplier.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.industryType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.industryType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a3a3a] via-[#274345] to-[#2a4d4f] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <ShieldCheck className="h-4 w-4 text-orange-300" />
            Verified Suppliers Network
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Find Trusted Suppliers<br className="hidden md:block" /> in Botswana
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Browse our network of verified suppliers for building materials, tools, and equipment — all in one place.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by company name or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-13 text-base rounded-2xl border-0 shadow-xl bg-white text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Supplier grid */}
        {!isLoading && filteredSuppliers && filteredSuppliers.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier: any) => (
                <Card
                  key={supplier.userId}
                  className={`shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all duration-200 border-border/40 ${
                    supplier.featured ? 'border-2 border-primary/30' : 'border'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-14 w-14 border-2">
                        <AvatarImage src={supplier.logo || supplier.user?.profilePhotoUrl} />
                        <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                          {supplier.companyName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {supplier.featured && (
                        <Badge className="bg-primary text-white text-xs">Featured</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3 leading-snug">{supplier.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground text-sm">{supplier.ratingAverage || '0.0'}</span>
                      <span className="text-muted-foreground text-xs">({supplier.reviewCount || 0} reviews)</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="text-xs">{supplier.industryType}</Badge>

                    <div className="space-y-1.5 text-sm">
                      {supplier.physicalAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground line-clamp-1">{supplier.physicalAddress}</span>
                        </div>
                      )}
                      {supplier.companyPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">{supplier.companyPhone}</span>
                        </div>
                      )}
                      {supplier.companyEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{supplier.companyEmail}</span>
                        </div>
                      )}
                    </div>

                    {supplier.specialOffer && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="flex items-start gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{supplier.specialOffer}</p>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full mt-2"
                      variant={supplier.featured ? 'default' : 'outline'}
                      onClick={() => setLocation('/login')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Supplier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && filteredSuppliers && filteredSuppliers.length === 0 && (
          <Card className="border-2 border-dashed border-border/40">
            <CardContent className="p-14 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground text-sm">Try a different search term or category</p>
            </CardContent>
          </Card>
        )}

        {/* Sign-up CTA */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-[#1a3a3a] via-[#274345] to-[#2a4d4f] text-white p-8 md:p-12 text-center shadow-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to connect with suppliers?</h2>
          <p className="text-white/70 mb-7 max-w-xl mx-auto">
            Sign up for free to view full supplier profiles, contact them directly, and manage your projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 shadow-lg">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
