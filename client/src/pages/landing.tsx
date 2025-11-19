import { Link } from 'wouter';
import { 
  Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight, 
  Wrench, Zap, Hammer, Paintbrush, Sparkles, Leaf, TrendingUp, 
  CheckCircle, Users, Award, Headphones, Tag, Gift, AlertCircle, Calendar,
  Building2 // Added for Suppliers section icon
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

  // Special offers data - kept for structure but not used in rendering
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
      // Using solid color for hover effect (Secondary/Emerald Green)
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      // Using solid color for hover effect (Primary/Emerald Green)
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
    // Set the overall page background image 
    <div 
      className="flex flex-col overflow-hidden bg-cover bg-fixed bg-center" 
      // FIX 1: Updated background URL to high quality placeholder
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80')` }}
    >
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 pb-16 sm:py-32">
        {/* Semi-transparent overlay for readability against background image */}
        {/* FIX 1: Reduced overlay opacity for more clarity (was bg-black/60) */}
        <div className="absolute inset-0 bg-black/40"></div> 
        
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white leading-tight">
            Life Made Easier
          </h1>
          <p className="text-xl sm:text-2xl text-neutral-200 max-w-4xl mx-auto mb-12 font-medium">
            Linking people with skilled artisans to deliver trusted services
          </p>
          
          {/* Replace Search Bar with Buttons (Buttons are already styled nicely) */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-2xl mx-auto mb-12">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-secondary hover:bg-secondary/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-white text-white hover:bg-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
            {categories.slice(0, 4).map((category) => (
              <div key={category.name} className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <img src={category.image} alt={category.name} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-end p-4 group-hover:bg-black/70 transition-colors">
                  <p className="text-white font-bold text-sm">{category.name}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Stats Section - New Dark, Translucent Background (Goal 5) */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-neutral-900/80 backdrop-blur-sm text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className={`bg-primary-foreground/10 border-none shadow-xl backdrop-blur-sm group hover:scale-[1.03] transition-transform duration-300`}
              >
                <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                    <img src={stat.image} alt={stat.label} className="w-10 h-10 rounded-full object-cover opacity-80" />
                  </div>
                  <p className="text-5xl sm:text-6xl font-extrabold text-white mb-2">
                    {stat.number}
                  </p>
                  <p className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Adverts Section (Replaced Special Offers) (Goal 6) */}
      <section className="py-16 sm:py-24 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Advertising Space
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Mascom's current promotions and offers in partnership with JobTradeSasa.
            </p>
          </div>
          {/* FIX 2: Added realistic Mascom advert banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mascom Banner 1: Data Deal (Using green/yellow colors) */}
            <div className="group relative aspect-video bg-[#4B8C3E] rounded-xl shadow-lg overflow-hidden flex flex-col items-center justify-center p-6 text-white transform hover:scale-[1.03] transition-transform duration-300">
              <span className="absolute top-4 left-4 bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded-full transform group-hover:rotate-2 transition-transform">TOP DEAL</span>
              <img src="/logo.png" alt="Mascom" className="h-10 w-auto mb-2 opacity-50" />
              <p className="text-4xl font-extrabold mb-1">50GB</p>
              <p className="text-sm font-semibold mb-3">Mobile Data for Artisans</p>
              <Button size="sm" className="bg-white text-black hover:bg-neutral-200 shadow-md">Get Offer</Button>
            </div>

            {/* Mascom Banner 2: Voice Offer (Using blue/white colors) */}
            <div className="group relative aspect-video bg-[#00AEEF] rounded-xl shadow-lg overflow-hidden flex flex-col items-center justify-center p-6 text-white transform hover:scale-[1.03] transition-transform duration-300">
              <span className="absolute top-4 right-4 text-xs font-medium border border-white px-2 py-0.5 rounded-full">NEW</span>
              <img src="/logo.png" alt="Mascom" className="h-10 w-auto mb-2 opacity-50" />
              <p className="text-4xl font-extrabold mb-1">FREE Calls</p>
              <p className="text-sm font-semibold mb-3">Unlimited Talktime on Mascom</p>
              <Button size="sm" variant="outline" className="text-white hover:bg-white/20 border-white shadow-md">More Info</Button>
            </div>

            {/* Mascom Banner 3: App Bonus (Using corporate primary color) */}
            <div className="group relative aspect-video bg-primary/90 rounded-xl shadow-lg overflow-hidden flex flex-col items-center justify-center p-6 text-white transform hover:scale-[1.03] transition-transform duration-300">
              <span className="absolute bottom-4 right-4 text-xs font-medium bg-white/30 px-2 py-0.5 rounded-full">JOB BONUS</span>
              <img src="/logo.png" alt="Mascom" className="h-10 w-auto mb-2 opacity-50" />
              <p className="text-4xl font-extrabold mb-1">+2GB</p>
              <p className="text-sm font-semibold mb-3">On Every Completed Job</p>
              <Button size="sm" className="bg-white text-primary hover:bg-neutral-200 shadow-md">Claim Now</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Now Popular Services (Goal 8) */}
      <section id="popular-services" className="py-16 sm:py-20 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/5 py-1 px-3 text-sm font-semibold"
            >
              Popular Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3">
              Find the Service You Need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Browse top categories and connect with verified specialists today.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="relative w-full h-32 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors"></div>
                  </div>
                  <div className="p-4 text-center">
                    <p className="font-semibold text-base group-hover:text-primary transition-colors">
                      {category.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/5">
                View All Categories <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section (Why Choose Us) (Goal 8) */}
      <section id="why-choose-us" className="py-16 sm:py-24 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              variant="default" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 py-1 px-3 text-sm font-semibold"
            >
              Why Choose Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3">
              The JobTradeSasa Advantage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              A platform built on trust, transparency, and quality assurance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group overflow-hidden rounded-2xl shadow-xl border-2 border-transparent transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2`}
              >
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

      {/* Suppliers Section (Goal 8) */}
      <section id="suppliers-section" className="py-16 sm:py-24 bg-secondary/10 dark:bg-secondary/20 bg-opacity-70 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Trusted Supply Materials
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Browse our network of verified suppliers to find and purchase high-quality building and repair materials for your projects.
          </p>
          <Link href="/suppliers">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl">
              Browse Suppliers <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Call to Action Section - New Dark, Blurred Background (Goal 7) */}
      <section className="py-16 sm:py-24 bg-neutral-900/80 backdrop-blur-md text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <Sparkles className="h-12 w-12 text-secondary mx-auto mb-4 animate-pulse-slow" />
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl sm:text-2xl text-neutral-300 max-w-3xl mx-auto mb-10 font-medium">
            Join thousands of satisfied customers and verified professionals today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <Button 
                size="xl" 
                className="w-full sm:w-auto text-lg sm:text-xl px-10 py-7 bg-secondary hover:bg-secondary/90 shadow-2xl hover:shadow-3xl transform hover:scale-[1.05] transition-all duration-300 font-bold"
              >
                Create Your Account Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button 
                size="xl" 
                variant="outline"
                className="w-full sm:w-auto text-lg sm:text-xl px-10 py-7 border-4 border-white text-white hover:bg-white/20 shadow-2xl hover:shadow-3xl transform hover:scale-[1.05] transition-all duration-300 font-bold"
              >
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Footer Section - kept as is */}
      <footer className="bg-neutral-800 text-neutral-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-neutral-700 pb-8 mb-8">
            {/* ... (rest of footer content) */}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-400">
            <p>&copy; {new Date().getFullYear()} JobTradeSasa. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Badge variant="outline" className="border-secondary text-secondary hover:bg-secondary/5">Terms</Badge>
              <Badge variant="outline" className="border-primary text-primary hover:bg-primary/5">Privacy</Badge>
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
        /* No longer using the grid background due to full image background */
      `}</style>
    </div>
  );
}
