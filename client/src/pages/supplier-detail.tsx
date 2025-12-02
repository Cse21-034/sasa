import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { 
  MapPin, Phone, Mail, Globe, ArrowLeft, Calendar, Tag, 
  Facebook, Instagram, Twitter, MessageCircle, ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

export default function SupplierDetail() {
  const [, params] = useRoute('/suppliers/:id');
  const supplierId = params?.id;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplierDetails', supplierId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/suppliers/${supplierId}/details`);
      return response.json();
    },
    enabled: !!supplierId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    );
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'whatsapp': return <MessageCircle className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const handleGetQuote = () => {
    // Try WhatsApp first if available
    if (supplier.whatsappNumber) {
      const cleanNumber = supplier.whatsappNumber.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Hi ${supplier.companyName}, I'm interested in getting a quote for your services. Can you help?`
      );
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    } 
    // Fallback to phone call
    else if (supplier.companyPhone) {
      window.open(`tel:${supplier.companyPhone}`, '_blank');
    }
    // Fallback to email
    else if (supplier.companyEmail) {
      window.open(`mailto:${supplier.companyEmail}?subject=Quote Request`, '_blank');
    }
    else {
      alert('No contact method available. Please contact this supplier directly.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link href="/suppliers">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Button>
      </Link>

      {/* Header Section */}
      <Card className="mb-6 border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32 border-4">
              <AvatarImage src={supplier.logo || supplier.user?.profilePhotoUrl} />
              <AvatarFallback className="text-3xl bg-primary/10">
                {supplier.companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
  <div className="flex items-start justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-3xl font-bold mb-2">{supplier.companyName}</h1>
      <Badge variant="outline" className="mb-4">{supplier.industryType}</Badge>
    </div>
    <Button 
      className="bg-primary hover:bg-primary/90"
      onClick={handleGetQuote}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {supplier.whatsappNumber ? 'WhatsApp Quote' : 'Request Quote'}
    </Button>
  </div>
  
  {supplier.aboutUs && (
    <p className="text-muted-foreground leading-relaxed mb-4">
      {supplier.aboutUs}
    </p>
  )}

              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.physicalAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.companyPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.companyEmail}</span>
                </div>
                {supplier.websiteUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={supplier.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Person */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Contact Person</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{supplier.contactPerson}</p>
              <p className="text-sm text-muted-foreground">{supplier.contactPosition}</p>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          {(supplier.facebookUrl || supplier.instagramUrl || supplier.twitterUrl || supplier.whatsappNumber) && (
  <Card className="border-2">
    <CardHeader>
      <CardTitle className="text-lg">Connect With Us</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {supplier.whatsappNumber && (
        <a 
          href={`https://wa.me/${supplier.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${supplier.companyName}, I'm interested in your services.`)}`}
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="w-full justify-start">
            {getSocialIcon('whatsapp')}
            <span className="ml-2">WhatsApp Quote</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </a>
      )}
      
      {supplier.facebookUrl && (
        <a href={supplier.facebookUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full justify-start">
            {getSocialIcon('facebook')}
            <span className="ml-2">Facebook</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </a>
      )}
      
      {supplier.instagramUrl && (
        <a href={supplier.instagramUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full justify-start">
            {getSocialIcon('instagram')}
            <span className="ml-2">Instagram</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </a>
      )}
      
      {supplier.twitterUrl && (
        <a href={supplier.twitterUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full justify-start">
            {getSocialIcon('twitter')}
            <span className="ml-2">Twitter/X</span>
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </a>
      )}
    </CardContent>
  </Card>
)}
        </div>

        {/* Main Content - Promotions */}
        <div className="md:col-span-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Active Promotions & Specials</CardTitle>
            </CardHeader>
            <CardContent>
              {supplier.promotions && supplier.promotions.length > 0 ? (
                <div className="space-y-4">
                  {supplier.promotions.map((promo: any) => (
                    <Card key={promo.id} className="border hover-elevate">
                      <CardContent className="p-6">
                        {promo.images && promo.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {promo.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Promotion ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold">{promo.title}</h3>
                          {promo.discountPercentage && (
                            <Badge className="bg-destructive text-destructive-foreground text-lg px-3 py-1">
                              {promo.discountPercentage}% OFF
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground mb-4">{promo.description}</p>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Valid: {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {promo.termsAndConditions && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-semibold mb-1">Terms & Conditions:</p>
                            <p className="text-xs text-muted-foreground">{promo.termsAndConditions}</p>
                          </div>
                        )}

                        <Button className="w-full mt-4" variant="default" onClick={handleGetQuote}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {supplier.whatsappNumber ? 'WhatsApp for This Deal' : 'Request This Deal'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active promotions at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}