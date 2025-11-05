 import { Link } from 'wouter';
import { Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: MapPin,
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
    },
    {
      icon: Shield,
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through our instant messaging',
    },
    {
      icon: Star,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback and ratings',
    },
    {
      icon: Clock,
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
    },
    {
      icon: Search,
      title: 'Easy Discovery',
      description: 'Browse by category, location, rating, and availability',
    },
  ];

  // 👇 Updated to use mock image paths instead of Lucide icons
  const categories = [
    { name: 'Plumbing', image: '/img/plumbing.png' },
    { name: 'Electrical', image: '/img/electrical.png' },
    { name: 'Carpentry', image: '/img/carpentry.png' },
    { name: 'Painting', image: '/img/painting.png' },
    { name: 'Cleaning', image: '/img/cleaning.png' },
    { name: 'Gardening', image: '/img/gardening.png' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section: Flat White Background, Centered Search Bar */}
      <section className="relative bg-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Removed gradient classes from title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Connect with Trusted Local Service Providers
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Find skilled professionals for all your service needs. From plumbers to electricians,
              carpenters to cleaners - all verified and rated by the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button size="lg" className="w-full sm:w-auto text-lg" data-testid="button-browse-services">
                      Browse Services
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/post-job">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg" data-testid="button-post-request">
                      Post a Request
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto text-lg" data-testid="button-get-started">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg" data-testid="button-login-hero">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* 👇 Search Bar: Centered with max-w-2xl mx-auto */}
            <Card className="max-w-2xl mx-auto border-2 border-primary shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for services..."
                      className="pl-10"
                      data-testid="input-search-services"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter your location"
                      className="pl-10"
                      data-testid="input-location"
                    />
                  </div>
                  <Button data-testid="button-search">
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section: Using Images */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="hover-elevate active-elevate-2 cursor-pointer transition-all h-full" 
                data-testid={`card-category-${category.name.toLowerCase()}`}
              >
                <CardContent className="flex flex-col items-center justify-start p-0">
                  {/* 👇 Image Placeholder for Category */}
                  <div className="w-full h-32 bg-secondary rounded-t-xl overflow-hidden mb-3">
                    <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-base text-center p-4 pt-0">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Note: Icons now use the new Primary (Orange) color */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose JobTradeSasa?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We connect you with the best local service providers, ensuring quality,
              reliability, and trust in every interaction.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate transition-all">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section: Uses solid Primary (Orange) background */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who trust JobTradeSasa for their service needs.
            Whether you're looking for help or offering your skills, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <a>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" data-testid="button-join-requester">
                  I Need Services
                </Button>
              </a>
            </Link>
            <Link href="/signup">
              <a>
                <Button 
                  size="lg" 
                  variant="outline" 
                  // Inverted colors for high contrast against the primary background
                  className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" 
                  data-testid="button-join-provider"
                >
                  I'm a Service Provider
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 JobTradeSasa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
