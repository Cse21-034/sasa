import { Link } from 'wouter';
import { Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight, Wrench, Zap, Hammer, Paintbrush, Sparkles, Leaf, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: MapPin,
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
      color: 'text-blue-500',
    },
    {
      icon: Shield,
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      color: 'text-green-500',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through our instant messaging',
      color: 'text-purple-500',
    },
    {
      icon: Star,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback and ratings',
      color: 'text-yellow-500',
    },
    {
      icon: Clock,
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      color: 'text-orange-500',
    },
    {
      icon: Search,
      title: 'Easy Discovery',
      description: 'Browse by category, location, rating, and availability',
      color: 'text-indigo-500',
    },
  ];

  const categories = [
    { name: 'Plumbing', icon: Wrench, color: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20' },
    { name: 'Electrical', icon: Zap, color: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20' },
    { name: 'Carpentry', icon: Hammer, color: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20' },
    { name: 'Painting', icon: Paintbrush, color: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20' },
    { name: 'Cleaning', icon: Sparkles, color: 'bg-pink-500/10 text-pink-500 dark:bg-pink-500/20' },
    { name: 'Gardening', icon: Leaf, color: 'bg-green-500/10 text-green-500 dark:bg-green-500/20' },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Users', icon: Users },
    { value: '5,000+', label: 'Completed Jobs', icon: CheckCircle },
    { value: '1,500+', label: 'Verified Providers', icon: Shield },
    { value: '4.8/5', label: 'Average Rating', icon: Star },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24 lg:py-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 gradient-mesh opacity-50"></div>
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-6 md:space-y-8 fade-in-up">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Trusted by 10,000+ users</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                Connect with
                <span className="block bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
                  Trusted Local Professionals
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Find skilled professionals for all your service needs. From plumbers to electricians,
                carpenters to cleaners - all verified and rated by the community.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/jobs">
                      <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional pulse-cta" data-testid="button-browse-services">
                        Browse Services
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/post-job">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional" data-testid="button-post-request">
                        Post a Request
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional pulse-cta" data-testid="button-get-started">
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional" data-testid="button-login-hero">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Search Bar */}
              <Card className="max-w-3xl mx-auto mt-12 card-hover glass-effect">
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="What service do you need?"
                        className="pl-10 h-12"
                        data-testid="input-search-services"
                      />
                    </div>
                    <div className="md:col-span-1 relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Your location"
                        className="pl-10 h-12"
                        data-testid="input-location"
                      />
                    </div>
                    <Button size="lg" className="h-12 w-full btn-professional" data-testid="button-search">
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 border-y bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center fade-in-scale" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold stat-number mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <Badge className="badge-professional" variant="outline">Popular Services</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Browse by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the right professional for your specific needs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-container">
            {categories.map((category) => (
              <Card key={category.name} className="card-hover cursor-pointer group" data-testid={`card-category-${category.name.toLowerCase()}`}>
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="h-8 w-8" />
                  </div>
                  <p className="font-semibold text-center">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge className="badge-professional" variant="outline">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Built for Trust & Efficiency</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We connect you with the best local service providers, ensuring quality,
              reliability, and trust in every interaction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-container">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover group">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80"></div>
        <div className="absolute inset-0 gradient-mesh opacity-30"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 fade-in-up">
            <Badge className="badge-professional bg-white/20 text-white border-white/30">
              Join Today
            </Badge>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Ready to Get Started?
            </h2>
            
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Join thousands of users who trust JobTradeSasa for their service needs.
              Whether you're looking for help or offering your skills, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional" data-testid="button-join-requester">
                  I Need Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 btn-professional border-white text-white hover:bg-white hover:text-primary" data-testid="button-join-provider">
                  I'm a Service Provider
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">JT</span>
              </div>
              <span className="font-bold text-lg">JobTradeSasa</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              &copy; 2025 JobTradeSasa. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
