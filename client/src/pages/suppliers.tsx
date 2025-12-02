import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Phone, Mail, Building2, Star, TrendingUp, Tag, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/suppliers');
      return response.json();
    },
  });

  const filteredSuppliers = suppliers?.filter((supplier: any) => {
    const matchesSearch = supplier.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.industryType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.industryType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = suppliers ? Array.from(new Set(suppliers.map((s: any) => s.industryType))) : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Suppliers & Organizations</h1>
        <p className="text-muted-foreground">
          Discover trusted suppliers for all your material and equipment needs
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6 border-2">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto">
                  <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
                  {categories.slice(0, 5).map((cat: any) => (
                    <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">
                      {cat.split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Suppliers */}
      {filteredSuppliers && filteredSuppliers.some((s: any) => s.featured) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Featured Suppliers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers
              .filter((s: any) => s.featured)
              .map((supplier: any) => (
                <Card 
                  key={supplier.userId} 
                  className="hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/50 cursor-pointer border-2 border-primary/20"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-16 w-16 border-2">
                        <AvatarImage src={supplier.logo || supplier.user?.profilePhotoUrl} />
                        <AvatarFallback className="text-lg bg-primary/10">
                          {supplier.companyName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="default" className="bg-primary">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-3">{supplier.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{supplier.ratingAverage || '0.0'}</span>
                      <span className="text-muted-foreground">({supplier.reviewCount || 0} reviews)</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="mb-2">
                      {supplier.industryType}
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.physicalAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.companyPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{supplier.companyEmail}</span>
                      </div>
                    </div>

                    {supplier.specialOffer && (
                      <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Tag className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium text-success">{supplier.specialOffer}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Contact:</span> {supplier.contactPerson}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Position:</span> {supplier.contactPosition}
                      </p>
                    </div>

                    <Link href={`/suppliers/${supplier.userId}`}>
                      <Button className="w-full mt-4" variant="default">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Suppliers */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          All Suppliers
        </h2>
        {filteredSuppliers && filteredSuppliers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers
              .filter((s: any) => !s.featured)
              .map((supplier: any) => (
                <Card 
                  key={supplier.userId} 
                  className="hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/50 cursor-pointer border-2"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-16 w-16 border-2">
                        <AvatarImage src={supplier.logo || supplier.user?.profilePhotoUrl} />
                        <AvatarFallback className="text-lg bg-muted">
                          {supplier.companyName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl mt-3">{supplier.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{supplier.ratingAverage || '0.0'}</span>
                      <span className="text-muted-foreground">({supplier.reviewCount || 0} reviews)</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="mb-2">
                      {supplier.industryType}
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.physicalAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.companyPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{supplier.companyEmail}</span>
                      </div>
                    </div>

                    {supplier.specialOffer && (
                      <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Tag className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium text-success">{supplier.specialOffer}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Contact:</span> {supplier.contactPerson}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Position:</span> {supplier.contactPosition}
                      </p>
                    </div>

                    <Link href={`/suppliers/${supplier.userId}`}>
                      <Button className="w-full mt-4" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}