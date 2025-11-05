 // client/src/pages/landing.tsx
import { Link } from 'wouter';
import { 
  Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight, 
  TrendingUp, CheckCircle, Users, Award, Headphones, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Find Trusted Local Professionals",
      subtitle: "Connect with verified service providers in your area",
      image: "/api/placeholder/800/600?text=Professional+Services"
    },
    {
      title: "Quality Work Guaranteed",
      subtitle: "Every provider is vetted and reviewed by the community",
      image: "/api/placeholder/800/600?text=Quality+Work"
    },
    {
      title: "Fast & Reliable Service",
      subtitle: "Get your jobs done quickly with our efficient platform",
      image: "/api/placeholder/800/600?text=Fast+Service"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      image: "/api/placeholder/400/300?text=Location+Services",
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
    },
    {
      image: "/api/placeholder/400/300?text=Verified+Providers",
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
    },
    {
      image: "/api/placeholder/400/300?text=Real+Time+Chat",
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
    },
    {
      image: "/api/placeholder/400/300?text=Ratings+Reviews",
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
    },
  ];

  const categories = [
    { 
      name: 'Plumbing', 
      image: '/api/placeholder/300/200?text=Plumbing+Services',
      jobs: '250+ Providers'
    },
    { 
      name: 'Electrical', 
      image: '/api/placeholder/300/200?text=Electrical+Work',
      jobs: '180+ Providers'
    },
    { 
      name: 'Carpentry', 
      image: '/api/placeholder/300/200?text=Carpentry+Work',
      jobs: '120+ Providers'
    },
    { 
      name: 'Painting', 
      image: '/api/placeholder/300/200?text=Painting+Services',
      jobs: '90+ Providers'
    },
    { 
      name: 'Cleaning', 
      image: '/api/placeholder/300/200?text=Cleaning+Services',
      jobs: '300+ Providers'
    },
    { 
      name: 'Gardening', 
      image: '/api/placeholder/300/200?text=Gardening+Services',
      jobs: '150+ Providers'
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Happy Customers', icon: Users },
    { number: '500+', label: 'Verified Providers', icon: Shield },
    { number: '50,000+', label: 'Jobs Completed', icon: CheckCircle },
    { number: '4.9/5', label: 'Average Rating', icon: Star },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Modern Hero Section with Slideshow */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        {/* Slideshow Background */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-left space-y-8 animate-slide-up">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-foreground border-primary/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  #1 Service Marketplace
                </Badge>
                
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="text-foreground">
                    Find Trusted
                  </span>
                  <br />
                  <span className="text-primary">Service Professionals</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Connect with verified professionals for all your service needs. 
                  From plumbers to electricians, all rated and reviewed by the community.
                </p>
              </div>

              {/* Search Bar */}
              <Card className="bg-card/80 backdrop-blur-lg border border-border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <Input
                        placeholder="What service do you need?"
                        className="pl-12 h-12 border-border focus:border-primary transition-all bg-background/50"
                      />
                    </div>
                    <div className="flex-1 relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <Input
                        placeholder="Enter your location"
                        className="pl-12 h-12 border-border focus:border-primary transition-all bg-background/50"
                      />
                    </div>
                    <Button 
                      className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/jobs">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Browse Services
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/post-job">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-primary text-foreground hover:bg-primary/10 transition-all duration-300"
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
                        className="w-full sm:w-auto text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-primary text-foreground hover:bg-primary/10 transition-all duration-300"
                      >
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Slideshow Preview */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroSlides[currentSlide].image}
                  alt={heroSlides[currentSlide].title}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-lg rounded-lg p-4">
                  <h3 className="font-semibold text-foreground">{heroSlides[currentSlide].title}</h3>
                  <p className="text-sm text-muted-foreground">{heroSlides[currentSlide].subtitle}</p>
                </div>
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-primary' : 'bg-primary/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center transform hover:scale-105 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section with Images */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-foreground border-primary/30">
              Popular Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover professional services tailored to your needs with real images of work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className="group cursor-pointer border border-border hover:border-primary transition-all duration-300 hover-lift overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="bg-primary/10 text-foreground">
                      {category.jobs}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Modern Cards */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-foreground border-primary/30">
              Why Choose Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We provide the best platform to connect you with verified professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group border border-border hover:border-primary transition-all duration-500 hover-lift overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-foreground/20 backdrop-blur-lg rounded-full mb-8">
              <Headphones className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-10 text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who trust JobTradeSasa for their service needs.
              Whether you're looking for help or offering your skills, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  I Need Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  I'm a Service Provider
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                JobTradeSasa
              </span>
            </div>
            <p className="text-muted-foreground">
              &copy; 2025 JobTradeSasa. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Badge variant="outline" className="border-primary text-foreground">
                Terms
              </Badge>
              <Badge variant="outline" className="border-primary text-foreground">
                Privacy
              </Badge>
              <Badge variant="outline" className="border-primary text-foreground">
                Contact
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
