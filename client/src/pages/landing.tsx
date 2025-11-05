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
      icon: MapPin,
      title: 'Location-Based Matching',
      description: 'Find service providers near you with real-time distance tracking',
      color: 'orange',
    },
    {
      icon: Shield,
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      color: 'lime',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
      color: 'orange',
    },
    {
      icon: Star,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
      color: 'lime',
    },
    {
      icon: Clock,
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      color: 'orange',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Premium service standards guaranteed by our platform',
      color: 'lime',
    },
  ];

  const categories = [
    { 
      name: 'Plumbing', 
      image: '/api/placeholder/200/200?text=Plumbing',
      color: 'orange' 
    },
    { 
      name: 'Electrical', 
      image: '/api/placeholder/200/200?text=Electrical',
      color: 'lime' 
    },
    { 
      name: 'Carpentry', 
      image: '/api/placeholder/200/200?text=Carpentry',
      color: 'orange' 
    },
    { 
      name: 'Painting', 
      image: '/api/placeholder/200/200?text=Painting',
      color: 'lime' 
    },
    { 
      name: 'Cleaning', 
      image: '/api/placeholder/200/200?text=Cleaning',
      color: 'orange' 
    },
    { 
      name: 'Gardening', 
      image: '/api/placeholder/200/200?text=Gardening',
      color: 'lime' 
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
      {/* Hero Section with Search Bar */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Solid color background */}
        <div className="absolute inset-0 bg-white dark:bg-gray-900">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-lime-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-orange-200 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 border-2 border-lime-200 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 border-2 border-orange-300 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Floating badge */}
            <div className="mb-8 animate-bounce">
              <Badge className="bg-orange-500 text-white text-sm px-4 py-2 shadow-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                #1 Service Marketplace in Your Area
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-orange-600">
                Connect with Trusted
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Local Service Providers
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Find skilled professionals for all your service needs. From plumbers to electricians,
              carpenters to cleaners - all verified and rated by the community.
            </p>

            {/* Search Bar - Moved to Hero Section */}
            <Card className="max-w-3xl mx-auto shadow-2xl border-2 border-orange-200 dark:border-orange-800 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 mb-16">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors" />
                    <Input
                      placeholder="What service do you need?"
                      className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-lime-500 group-hover:text-lime-600 transition-colors" />
                    <Input
                      placeholder="Enter your location"
                      className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-lime-500 transition-all"
                    />
                  </div>
                  <Button 
                    className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-lg font-semibold shadow-lg"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Browse Services
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/post-job">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-lime-500 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-950 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
                      className="w-full sm:w-auto text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-lime-500 text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-950 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Login
                    </Button>
                  </Link>
                </>
              )}
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
      <section className="py-20 bg-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center transform hover:scale-110 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/90 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section with Images */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              Popular Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-orange-600">
                Browse by Category
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className={`group cursor-pointer border-2 hover:border-${category.color}-500 transition-all duration-300 hover:shadow-2xl transform hover:scale-105 hover:-rotate-2`}
              >
                <CardContent className="flex flex-col items-center justify-center p-4 gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="font-bold text-lg text-center group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {category.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Modern Cards */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-gray-900"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-300">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-lime-600">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We provide the best platform to connect you with verified professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group relative overflow-hidden border-2 hover:border-transparent transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-${feature.color}-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-${feature.color}-500 flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Solid Color */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500"></div>
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full mb-8">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who trust JobTradeSasa for their service needs.
              Whether you're looking for help or offering your skills, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 px-10 py-6 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  I Need Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
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
      <footer className="border-t-2 border-orange-200 dark:border-orange-800 py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-orange-500"></div>
              <span className="text-xl font-bold text-orange-600">
                JobTradeSasa
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              &copy; 2025 JobTradeSasa. All rights reserved.
            </p>
            <div className="flex gap-4">
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
