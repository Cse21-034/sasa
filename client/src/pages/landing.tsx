// client/src/pages/landing.tsx
import { Link } from 'wouter';
import { ArrowRight, Search, MapPin, CheckCircle, Users, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: "Verified Professionals",
      description: "Every service provider is thoroughly vetted and background checked.",
      icon: Shield
    },
    {
      title: "Instant Matching",
      description: "Get connected with available professionals in your area instantly.",
      icon: Search
    },
    {
      title: "Secure Payments",
      description: "Safe and secure payment processing with money-back guarantee.",
      icon: CheckCircle
    },
    {
      title: "Real Reviews",
      description: "Make informed decisions with authentic customer reviews and ratings.",
      icon: Star
    }
  ];

  const services = [
    {
      name: "Home Services",
      image: "/api/placeholder/400/300?text=Home+Services",
      count: "500+ Providers"
    },
    {
      name: "Professional Services",
      image: "/api/placeholder/400/300?text=Professional+Services",
      count: "300+ Providers"
    },
    {
      name: "Creative Services",
      image: "/api/placeholder/400/300?text=Creative+Services",
      count: "200+ Providers"
    },
    {
      name: "Tech Services",
      image: "/api/placeholder/400/300?text=Tech+Services",
      count: "150+ Providers"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
              <span className="text-sm font-medium">Trusted by 10,000+ professionals</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Service Match
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-balance leading-relaxed">
              Connect with verified professionals for any service need. Quality guaranteed, satisfaction delivered.
            </p>

            {/* Search Bar */}
            <Card className="max-w-2xl mx-auto mb-12 modern-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="What service do you need?"
                      className="pl-10 h-12 modern-input"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Location"
                      className="pl-10 h-12 modern-input"
                    />
                  </div>
                  <Button className="h-12 px-8 gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button size="lg" className="h-12 px-8 gap-2">
                      Browse Services
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/post-job">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                      Post a Request
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="h-12 px-8 gap-2">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why Choose JobTrade
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of service matching with our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="modern-card group hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Popular Services
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover services across multiple categories
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.name} className="modern-card group overflow-hidden cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {service.count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Verified Providers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">Jobs Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">4.9</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals and customers who trust JobTrade for their service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 gap-2">
                  Start Today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
