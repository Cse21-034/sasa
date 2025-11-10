import { Link } from 'wouter';
import { 
  Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight, 
  Wrench, Zap, Hammer, Paintbrush, Sparkles, Leaf, TrendingUp, 
  CheckCircle, Users, Award, Headphones, Tag, Gift, AlertCircle, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Special offers data
  const specialOffers = [
    {
      title: 'First-Time Customer Discount',
      badge: 'NEW',
      discount: '15% OFF',
      description: 'Get 15% off on your first service booking with any of our verified artisans',
      validUntil: '30/12/2025',
      terms: [
        'Valid for first-time customers only',
        'Cannot be combined with other offers',
        'Minimum booking value of P200'
      ]
    },
    {
      title: 'Early Bird Booking',
      badge: 'ALL SERVICES',
      discount: '10% OFF',
      description: 'Book a service 7 days in advance and get 10% off',
      validUntil: '30/10/2025',
      terms: [
        'Must book at least 7 days in advance',
        'Valid for all services',
        'Subject to artisan availability'
      ]
    },
    {
      title: 'Bulk Service Package',
      badge: 'NEW',
      discount: '20% OFF',
      description: 'Book 5 or more services and save 20% on the total cost',
      validUntil: '29/11/2025',
      terms: [
        'Must book 5 or more services',
        'Services must be scheduled within 3 months',
        'Valid for all service categories'
      ]
    }
  ];

  const features = [
    {
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
      // Using solid color for hover effect
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Quality Assurance',
      description: 'Premium service standards guaranteed by our platform',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const categories = [
    { name: 'Plumbing', image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80' },
    { name: 'Electrical', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80' },
    { name: 'Carpentry', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&auto=format&fit=crop&q=80' },
    { name: 'Painting', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80' },
    { name: 'Cleaning', image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&auto=format&fit=crop&q=80' },
    { name: 'Gardening', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=80' },
  ];

  const stats = [
    { number: '10,000+', label: 'Happy Customers', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&auto=format&fit=crop&q=80' },
    { number: '500+', label: 'Verified Providers', image: 'https://images.unsplash.com/photo-1581578731144-8c66106e6041?w=200&auto=format&fit=crop&q=80' },
    { number: '50,000+', label: 'Jobs Completed', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80' },
    { number: '4.9/5', label: 'Average Rating', image: 'https://images.unsplash.com/photo-1513128034602-7814ccaddd4e?w=200&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 h-full opacity-10">
            <div className="relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80" alt="Plumber at work" className="w-full h-full object-cover" />
            </div>
            <div className="relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80" alt="Electrician working" className="w-full h-full object-cover" />
            </div>
            <div className="relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&auto=format&fit=crop&q=80" alt="Carpenter working" className="w-full h-full object-cover" />
            </div>
            <div className="relative overflow-hidden hidden md:block">
              <img src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80" alt="Painter at work" className="w-full h-full object-cover" />
            </div>
          </div>
          {/* REMOVED GRADIENT: Using solid background/sidebar colors with high opacity */}
          <div className="absolute inset-0 bg-background/95 dark:bg-background/95"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {/* REMOVED GRADIENT: Using Primary/Secondary Text */}
              <span className="text-secondary dark:text-primary">
                Connect with Trusted
              </span>
              <br />
              <span className="text-foreground">Local Service Providers</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Find skilled professionals for all your service needs. From plumbers to electricians, carpenters to cleaners - all verified and rated by the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-secondary hover:bg-secondary/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Browse Services
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/post-job">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      // Border/Text: Primary (Green)
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Post a Request
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button 
                      size="lg" 
                      // REMOVED GRADIENT: Solid Secondary (Orange)
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-secondary hover:bg-secondary/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      // Border/Text: Primary (Green)
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
              {categories.slice(0, 4).map((category) => (
                <div key={category.name} className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                  <img src={category.image} alt={category.name} className="w-full h-40 object-cover" />
                  {/* Using solid black/white overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-end p-4 group-hover:bg-black/70 transition-colors">
                    <p className="text-white font-bold text-sm">{category.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - REMOVED GRADIENT */}
      <section className="py-16 sm:py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/[0.1] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary-foreground/20 backdrop-blur-lg rounded-full mb-4 overflow-hidden border-4 border-primary-foreground/30">
                  <img src={stat.image} alt={stat.label} className="w-full h-full object-cover" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-2">{stat.number}</div>
                <div className="text-primary-foreground/90 font-medium text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section - CARD FIX INCLUDED */}
      <section className="py-16 sm:py-20 bg-sidebar"> {/* Using sidebar color for section separation */}
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              // Using secondary/orange for offer badge
              className="mb-4 bg-secondary/10 text-secondary dark:bg-secondary/20"
            >
              <Tag className="h-3 w-3 mr-1" />
              Limited Time Offers
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {/* Using Primary/Secondary Text */}
              <span className="text-secondary dark:text-secondary">Special Offers</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Discover exclusive deals and discounts on our services. Don't miss out on these limited-time offers!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialOffers.map((offer, index) => (
              <Card 
                key={index} 
                // **CARD FIX:** Added explicit border and using bg-card
                className="group cursor-pointer border-card-border border-2 bg-card hover:border-secondary transition-all duration-300 hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2">
                      {offer.badge === 'NEW' && (
                        // Solid Secondary (Orange)
                        <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                          🚨 {offer.badge}
                        </Badge>
                      )}
                      {offer.badge === 'ALL SERVICES' && (
                        // Solid Primary (Green)
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          {offer.badge}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors">
                    {offer.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="h-8 w-8 text-secondary" />
                    <span className="text-3xl font-bold text-secondary">{offer.discount}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>

                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Valid until {offer.validUntil}</span>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold mb-2 text-foreground/90">Terms & Conditions:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {offer.terms.map((term, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    // REMOVED GRADIENT: Solid Secondary (Orange)
                    className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              // Using primary/green for category badge
              className="mb-4 bg-primary/10 text-primary dark:bg-primary/20"
            >
              Popular Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {/* Using Primary/Secondary Text */}
              <span className="text-primary dark:text-primary">Browse by Category</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Discover professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                // Border/Text: Primary (Green)
                className="group cursor-pointer border-2 border-card-border bg-card hover:border-primary transition-all duration-300 hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="font-bold text-base sm:text-lg text-white text-center drop-shadow-lg">{category.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 bg-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              // Using primary/green for feature badge
              className="mb-4 bg-primary/10 text-primary dark:bg-primary/20"
            >
              Why Choose Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {/* Using Primary/Secondary Text */}
              <span className="text-primary dark:text-secondary">Everything You Need</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              We provide the best platform to connect you with verified professionals
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="group relative overflow-hidden border-2 border-card-border bg-card hover:border-transparent transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2">
                {/* REMOVED GRADIENT: Using solid hover background */}
                <div className={`absolute inset-0 ${feature.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <CardContent className="p-6 sm:p-8 relative z-10">
                  <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-lg">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors"></div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - REMOVED GRADIENT */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&auto=format&fit=crop&q=80" alt="Team collaboration" className="w-full h-full object-cover" />
          {/* Using solid Primary/Secondary Overlay */}
          <div className="absolute inset-0 bg-secondary/90 dark:bg-primary/90"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-lg rounded-full mb-6 sm:mb-8 overflow-hidden border-4 border-white/30">
              <img src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=200&auto=format&fit=crop&q=80" alt="Support" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white px-4">Ready to Get Started?</h2>
            <p className="text-lg sm:text-xl mb-8 sm:mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
              Join thousands of users who trust JobTradeSasa for their service needs. Whether you're looking for help or offering your skills, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  // White button with Secondary (Orange) text
                  className="w-full sm:w-auto bg-white text-secondary hover:bg-gray-100 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  I Need Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
                  // Outline button with White border and Primary (Green) hover
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  I'm a Service Provider
                  <Wrench className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - REMOVED GRADIENT */}
      <footer className="border-t border-border py-8 sm:py-12 bg-sidebar">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Solid Primary (Green) */}
              <div className="w-10 h-10 rounded-full bg-primary"></div>
              {/* Text: Secondary (Orange) */}
              <span className="text-lg sm:text-xl font-bold text-secondary dark:text-primary">JobTradeSasa</span>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base text-center">&copy; 2025 JobTradeSasa. All rights reserved.</p>
            <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
              {/* Orange/Secondary Badge */}
              <Badge variant="outline" className="border-secondary text-secondary hover:bg-secondary/5">Terms</Badge>
              {/* Green/Primary Badge */}
              <Badge variant="outline" className="border-primary text-primary hover:bg-primary/5">Privacy</Badge>
              {/* Orange/Secondary Badge */}
              <Badge variant="outline" className="border-secondary text-secondary hover:bg-secondary/5">Contact</Badge>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        /* UPDATED grid color to use Primary in light mode, Secondary in dark mode */
        .bg-grid-primary {
          background-image: 
            linear-gradient(to right, hsla(var(--primary), 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsla(var(--primary), 0.1) 1px, transparent 1px);
        }
        .dark .bg-grid-primary {
           background-image: 
            linear-gradient(to right, hsla(var(--secondary), 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsla(var(--secondary), 0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}
