// client/src/pages/landing.tsx
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle, Users, Zap, Shield, Star, Briefcase, MessageSquare, Clock } from 'lucide-react';

export default function Landing() {
  return (
    <>
      {/* HERO SECTION - NAVY + ORANGE */}
      <section className="relative min-h-screen flex items-center justify-center bg-[hsl(var(--navy))]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="text-orange-500">Connect with Trusted</span>
              <br />
              <span className="text-white">Local Service Providers</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
              Verified artisans, instant booking, real reviews — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/signup">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-12 py-7 font-bold shadow-2xl transform hover:scale-105 transition-all">
                  Get Started Free <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-12 py-7 backdrop-blur-sm">
                  Login
                </Button>
              </Link>
            </div>

            <div className="flex justify-center gap-8 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-500" />
                <span>No Fees to Join</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <span>Verified Pros</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span>Instant Booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 150" className="w-full h-32 md:h-48">
            <path fill="white" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,80C672,64,768,64,864,74.7C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,150L1392,150C1344,150,1248,150,1152,150C1056,150,960,150,864,150C768,150,672,150,576,150C480,150,384,150,288,150C192,150,96,150,48,150L0,150Z"></path>
          </svg>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-orange-500">JobTradeSasa</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The fastest way to find reliable local professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1,000+ Verified Pros</h3>
              <p className="text-gray-600">Background-checked and rated by real customers</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Book in 60 Seconds</h3>
              <p className="text-gray-600">No calls. No waiting. Get matched instantly</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Chat & Pay Securely</h3>
              <p className="text-gray-600">Message pros and pay only when job is done</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-[hsl(var(--navy))]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of happy customers who found their perfect pro today
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-xl px-16 py-8 font-bold shadow-2xl">
              Create Free Account <Sparkles className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-orange-500">JobTradeSasa</span>
          </div>
          <p className="text-gray-400">
            © 2025 JobTradeSasa. All rights reserved. Made with love in Botswana
          </p>
        </div>
      </footer>
    </>
  );
}
