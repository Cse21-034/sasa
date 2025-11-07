import { Link } from 'wouter';
import { 
  Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight, 
  Wrench, Zap, Hammer, Paintbrush, Sparkles, Leaf, TrendingUp, 
  CheckCircle, Users, Award, Headphones
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

  const features = [
    {
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
      gradient: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      gradient: 'from-lime-500 to-lime-600',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
      gradient: 'from-orange-500 to-lime-500',
      image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
      gradient: 'from-lime-500 to-green-500',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      gradient: 'from-orange-600 to-orange-700',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Quality Assurance',
      description: 'Premium service standards guaranteed by our platform',
      gradient: 'from-lime-600 to-lime-700',
      image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const categories = [
    { 
      name: 'Plumbing', 
      image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80'
    },
    { 
      name: 'Electrical', 
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80'
    },
    { 
      name: 'Carpentry', 
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&auto=format&fit=crop&q=80'
    },
    { 
      name: 'Painting', 
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80'
    },
    { 
      name: 'Cleaning', 
      image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&auto=format&fit=crop&q=80'
    },
    { 
      name: 'Gardening', 
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=80'
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Happy Customers', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&auto=format&fit=crop&q=80' },
    { number: '500+', label: 'Verified Providers', image: 'https://images.unsplash.com/photo-1581578731144-8c66106e6041?w=200&auto=format&fit=crop&q=80' },
    { number: '50,000+', label: 'Jobs Completed', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80' },
    { number: '4.9/5', label: 'Average Rating', image: 'https://images.unsplash.com/photo-1513128034602-7814ccaddd4e?w=200&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section with Images */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Images Grid */}
        <div className="absolute inset-0">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 h-full opacity-10">
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80" 
                alt="Plumber at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80" 
                alt="Electrician working"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&auto=format&fit=crop&q=80" 
                alt="Carpenter working"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80" 
                alt="Painter at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&auto=format&fit=crop&q=80" 
                alt="Cleaning service"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=80" 
                alt="Gardening"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1581578731144-8c66106e6041?w=400&auto=format&fit=crop&q=80" 
                alt="Construction work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80" 
                alt="Service provider"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/95 via-white/95 to-lime-50/95 dark:from-orange-950/95 dark:via-gray-900/95 dark:to-lime-950/95"></div>
        </div>

        {/* Floating worker images */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 animate-float shadow-2xl" style={{ animationDelay: '0s' }}>
            <img 
              src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=200&auto=format&fit=crop&q=80" 
              alt="Service professional"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-40 right-20 w-40 h-40 rounded-full overflow-hidden border-4 border-lime-500 animate-float shadow-2xl" style={{ animationDelay: '1s' }}>
            <img 
              src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200&auto=format&fit=crop&q=80" 
              alt="Plumber at work"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-32 left-1/4 w-36 h-36 rounded-full overflow-hidden border-4 border-orange-400 animate-float shadow-2xl" style={{ animationDelay: '2s' }}>
            <img 
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=200&auto=format&fit=crop&q=80" 
              alt="Carpenter"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-lime-600 bg-clip-text text-transparent">
                Connect with Trusted
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Local Service Providers
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Find skilled professionals for all your service needs. From plumbers to electricians,
              carpenters to cleaners - all verified and rated by the community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Browse Services
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/post-job">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-lime-500 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-950 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-lime-500 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-950 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Hero Image Showcase */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
              <div className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=300&auto=format&fit=crop&q=80"
                  alt="Plumbing services"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-sm">Plumbing</p>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"
                  alt="Electrical services"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-sm">Electrical</p>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=300&auto=format&fit=crop&q=80"
                  alt="Carpentry services"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-sm">Carpentry</p>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=300&auto=format&fit=crop&q=80"
                  alt="Cleaning services"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-sm">Cleaning</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-orange-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-500 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-orange-500 to-lime-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center transform hover:scale-110 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-lg rounded-full mb-4 overflow-hidden border-4 border-white/30">
                  <img 
                    src={stat.image} 
                    alt={stat.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/90 font-medium text-sm sm:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              Popular Services
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-600 to-lime-600 bg-clip-text text-transparent">
                Browse by Category
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Discover professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <Card 
                key={category.name}
                className="group cursor-pointer border-2 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="font-bold text-base sm:text-lg text-white text-center drop-shadow-lg">
                        {category.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Images */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-orange-50/30 to-lime-50/30 dark:from-gray-900 dark:via-orange-950/30 dark:to-lime-950/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-300">
              Why Choose Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-lime-600 to-orange-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              We provide the best platform to connect you with verified professionals
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group relative overflow-hidden border-2 hover:border-transparent transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <CardContent className="p-6 sm:p-8 relative z-10">
                  <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-lg">
                    <img 
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Image */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&auto=format&fit=crop&q=80"
            alt="Team collaboration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 via-orange-500/95 to-lime-600/95"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-lg rounded-full mb-6 sm:mb-8 overflow-hidden border-4 border-white/30">
              <img 
                src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=200&auto=format&fit=crop&q=80"
                alt="Support"
                className="w-full h-full object-cover"
              />
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white px-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl mb-8 sm:mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
              Join thousands of users who trust JobTradeSasa for their service needs.
              Whether you're looking for help or offering your skills, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  I Need Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
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

      {/* Footer */}
      <footer className="border-t-2 border-orange-200 dark:border-orange-800 py-8 sm:py-12 bg-gradient-to-b from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500"></div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-lime-600 bg-clip-text text-transparent">
                JobTradeSasa
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base text-center">
              &copy; 2025 JobTradeSasa. All rights reserved.
            </p>
            <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Terms
              </Badge>
              <Badge variant="outline" className="border-lime-500 text-lime-600">
                Privacy
              </Badge>
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Contact
              </Badge>
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
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}
