import { useState } from 'react';
import { Search, MapPin, Phone, Mail, Building2, Star, TrendingUp, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock supplier data
  const suppliers = [
    {
      id: 1,
      name: 'Premium Hardware Supplies',
      industry: 'Hardware Supplies',
      address: '123 Main Street, Downtown',
      phone: '+267 123 4567',
      email: 'info@premiumhardware.com',
      rating: 4.8,
      reviewCount: 156,
      logo: null,
      specialOffer: '15% off all power tools this month!',
      featured: true,
    },
    {
      id: 2,
      name: 'ElectroTech Solutions',
      industry: 'Electrical Supplies',
      address: '456 Commerce Ave, Industrial Area',
      phone: '+267 234 5678',
      email: 'sales@electrotech.com',
      rating: 4.6,
      reviewCount: 98,
      logo: null,
      specialOffer: 'Free delivery on orders over $100',
      featured: true,
    },
    {
      id: 3,
      name: 'Plumbing Pro Distributors',
      industry: 'Plumbing Supplies',
      address: '789 Industrial Road, Zone 5',
      phone: '+267 345 6789',
      email: 'contact@plumbingpro.com',
      rating: 4.9,
      reviewCount: 203,
      logo: null,
      specialOffer: 'Buy 2 Get 1 Free on selected pipes',
      featured: false,
    },
    {
      id: 4,
      name: 'BuildRight Construction Supplies',
      industry: 'Construction Materials',
      address: '321 Builder Lane, Construction Park',
      phone: '+267 456 7890',
      email: 'orders@buildright.com',
      rating: 4.7,
      reviewCount: 187,
      logo: null,
      specialOffer: 'Bulk discount available - Call for quote',
      featured: false,
    },
    {
      id: 5,
      name: 'ToolMaster Equipment',
      industry: 'Tools & Equipment',
      address: '654 Equipment Drive, Trade Center',
      phone: '+267 567 8901',
      email: 'info@toolmaster.com',
      rating: 4.5,
      reviewCount: 142,
      logo: null,
      specialOffer: 'New arrivals - 20% off!',
      featured: true,
    },
  ];

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.industry === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(suppliers.map(s => s.industry)));

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
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto">
                <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
                {categories.slice(0, 5).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">
                    {cat.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Featured Suppliers */}
      {filteredSuppliers.some(s => s.featured) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Featured Suppliers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers
              .filter(s => s.featured)
              .map((supplier) => (
                <Card 
                  key={supplier.id} 
                  className="hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/50 cursor-pointer border-2 border-primary/20"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-16 w-16 border-2">
                        <AvatarImage src={supplier.logo || undefined} />
                        <AvatarFallback className="text-lg bg-primary/10">
                          {supplier.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Badge variant="default" className="bg-primary">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-3">{supplier.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{supplier.rating}</span>
                      <span className="text-muted-foreground">({supplier.reviewCount} reviews)</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="mb-2">
                      {supplier.industry}
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{supplier.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{supplier.email}</span>
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

                    <Button className="w-full mt-4" variant="outline">
                      View Details
                    </Button>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers
            .filter(s => !s.featured)
            .map((supplier) => (
              <Card 
                key={supplier.id} 
                className="hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/50 cursor-pointer border-2"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-16 w-16 border-2">
                      <AvatarImage src={supplier.logo || undefined} />
                      <AvatarFallback className="text-lg bg-muted">
                        {supplier.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl mt-3">{supplier.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{supplier.rating}</span>
                    <span className="text-muted-foreground">({supplier.reviewCount} reviews)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className="mb-2">
                    {supplier.industry}
                  </Badge>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{supplier.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{supplier.email}</span>
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

                  <Button className="w-full mt-4" variant="outline">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {filteredSuppliers.length === 0 && (
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
