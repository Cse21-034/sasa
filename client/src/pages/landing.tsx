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
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      gradient: 'from-lime-500 to-lime-600',
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
      gradient: 'from-orange-500 to-lime-500',
    },
    {
      icon: Star,
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
      gradient: 'from-lime-500 to-green-500',
    },
    {
      icon: Clock,
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      gradient: 'from-orange-600 to-orange-700',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Premium service standards guaranteed by our platform',
      gradient: 'from-lime-600 to-lime-700',
    },
  ];

 
  const categories = [
    { name: 'Plumbing', icon: Wrench, color: 'orange' },
    { name: 'Electrical', icon: Zap, color: 'lime' },
    { name: 'Carpentry', icon: Hammer, color: 'orange' },
    { name: 'Painting', icon: Paintbrush, color: 'lime' },
    { name: 'Cleaning', icon: Sparkles, color: 'orange' },
    { name: 'Gardening', icon: Leaf, color: 'lime' },
  ];
 
  const stats = [
    { number: '10,000+', label: 'Happy Customers', icon: Users },
    { number: '500+', label: 'Verified Providers', icon: Shield },
    { number: '50,000+', label: 'Jobs Completed', icon: CheckCircle },
    { number: '4.9/5', label: 'Average Rating', icon: Star },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-lime-50 dark:from-orange-950 dark:via-gray-900 dark:to-lime-950">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        {/* Floating shapes*/}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-orange-200 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 border-2 border-lime-200 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 border-2 border-orange-300 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div> 

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Floating badge 
            <div className="mb-8 animate-bounce">
              <Badge className="bg-gradient-to-r from-orange-500 to-lime-500 text-white text-sm px-4 py-2 shadow-lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                #1 Service Marketplace in Your Area
              </Badge>
            </div>*/}

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-lime-600 bg-clip-text text-transparent">
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <>
                  <Link href="/jobs">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
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
                      className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
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

            {/* Enhanced Search Bar 
            <Card className="max-w-3xl mx-auto shadow-2xl border-2 border-orange-200 dark:border-orange-800 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90">
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
                    className="h-14 px-8 bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-lg font-semibold shadow-lg"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card> */}
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
      <section className="py-20 bg-gradient-to-r from-orange-500 to-lime-500 relative overflow-hidden">
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


{/* Categories Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              Popular Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-600 to-lime-600 bg-clip-text text-transparent">
                Browse by Category
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Card 
                key={category.name}
                className="group cursor-pointer border-2 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/photo-${
                        category.name === 'Plumbing' ? '1585704032-7a4b5c34c5df?w=400' :
                        category.name === 'Electrical' ? '1621905251189-08b45d6a269e?w=400' :
                        category.name === 'Carpentry' ? '1600585152915-199e76e90137?w=400' :
                        category.name === 'Painting' ? '1562259949-e8e7689d7828?w=400' :
                        category.name === 'Cleaning' ? '1581578731144-8c66106e6041?w=400' :
                        '1416879595882-3373a0480b5b?w=400'
                      }&auto=format&fit=crop&q=80`}
                      alt={category.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="font-bold text-lg text-white text-center drop-shadow-lg">
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

      
      {/* Features Section with Modern Cards */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-orange-50/30 to-lime-50/30 dark:from-gray-900 dark:via-orange-950/30 dark:to-lime-950/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-300">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-lime-600 to-orange-600 bg-clip-text text-transparent">
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
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <CardContent className="p-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
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

      {/* CTA Section with Gradient */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-lime-600"></div>
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
      <footer className="border-t-2 border-orange-200 dark:border-orange-800 py-12 bg-gradient-to-b from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500"></div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-lime-600 bg-clip-text text-transparent">
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
