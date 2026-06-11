import { Link } from 'wouter';
import {
  Search, MapPin, MessageSquare, Star, Shield, Clock, ArrowRight,
  Sparkles, TrendingUp,
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
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id="loc-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1e4d4d"/>
              <stop offset="100%" stopColor="#0f2626"/>
            </radialGradient>
          </defs>
          <rect width="400" height="192" fill="url(#loc-bg)"/>
          {/* Grid lines */}
          {[40,80,120,160,200,240,280,320,360].map(x => <line key={x} x1={x} y1="0" x2={x} y2="192" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1"/>)}
          {[32,64,96,128,160].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1"/>)}
          {/* Ripple circles */}
          <circle cx="200" cy="96" r="70" fill="none" stroke="#F8992D" strokeOpacity="0.15" strokeWidth="1.5"/>
          <circle cx="200" cy="96" r="48" fill="none" stroke="#F8992D" strokeOpacity="0.25" strokeWidth="1.5"/>
          <circle cx="200" cy="96" r="26" fill="none" stroke="#F8992D" strokeOpacity="0.4" strokeWidth="2"/>
          {/* Nearby provider dots */}
          <circle cx="148" cy="68" r="7" fill="#274345" stroke="#F8992D" strokeWidth="2"/>
          <circle cx="148" cy="68" r="3" fill="#F8992D"/>
          <circle cx="255" cy="75" r="7" fill="#274345" stroke="#F8992D" strokeWidth="2"/>
          <circle cx="255" cy="75" r="3" fill="#F8992D"/>
          <circle cx="162" cy="130" r="7" fill="#274345" stroke="#F8992D" strokeWidth="2"/>
          <circle cx="162" cy="130" r="3" fill="#F8992D"/>
          <circle cx="240" cy="128" r="7" fill="#274345" stroke="#F8992D" strokeWidth="2"/>
          <circle cx="240" cy="128" r="3" fill="#F8992D"/>
          {/* Centre map pin */}
          <path d="M200 56 C187 56 177 66 177 79 C177 97 200 118 200 118 C200 118 223 97 223 79 C223 66 213 56 200 56Z" fill="#F8992D"/>
          <circle cx="200" cy="80" r="8" fill="white"/>
          {/* Distance labels */}
          <rect x="98" y="58" width="36" height="14" rx="7" fill="#F8992D" fillOpacity="0.85"/>
          <text x="116" y="69" textAnchor="middle" fill="white" fontSize="8" fontFamily="sans-serif" fontWeight="600">0.8km</text>
          <rect x="262" y="65" width="36" height="14" rx="7" fill="#F8992D" fillOpacity="0.85"/>
          <text x="280" y="76" textAnchor="middle" fill="white" fontSize="8" fontFamily="sans-serif" fontWeight="600">1.2km</text>
        </svg>
      ),
    },
    {
      title: 'Verified Providers',
      description: 'All providers are verified with certificates and ID documentation',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="id-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3a3a"/>
              <stop offset="100%" stopColor="#274345"/>
            </linearGradient>
          </defs>
          <rect width="400" height="192" fill="url(#id-bg)"/>
          {/* Decorative dots */}
          {[30,70,110,150,190,230,270,310,350].map(x => [20,50,80,110,140,170].map(y =>
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="white" fillOpacity="0.07"/>
          ))}
          {/* ID Card */}
          <rect x="100" y="30" width="200" height="132" rx="12" fill="#0f2626" stroke="#F8992D" strokeWidth="1.5" strokeOpacity="0.6"/>
          <rect x="100" y="30" width="200" height="40" rx="12" fill="#F8992D" fillOpacity="0.9"/>
          <rect x="100" y="58" width="200" height="12" fill="#F8992D" fillOpacity="0.9"/>
          <text x="200" y="52" textAnchor="middle" fill="white" fontSize="11" fontFamily="sans-serif" fontWeight="700">VERIFIED PROVIDER</text>
          {/* Avatar circle */}
          <circle cx="155" cy="108" r="28" fill="#1e4d4d" stroke="#F8992D" strokeWidth="1.5"/>
          <circle cx="155" cy="100" r="11" fill="#F8992D" fillOpacity="0.7"/>
          <ellipse cx="155" cy="126" rx="18" ry="10" fill="#F8992D" fillOpacity="0.7"/>
          {/* Text lines */}
          <rect x="196" y="88" width="80" height="8" rx="4" fill="white" fillOpacity="0.5"/>
          <rect x="196" y="104" width="60" height="6" rx="3" fill="white" fillOpacity="0.3"/>
          <rect x="196" y="118" width="70" height="6" rx="3" fill="white" fillOpacity="0.3"/>
          {/* Badge */}
          <circle cx="305" cy="155" r="22" fill="#0f2626" stroke="#F8992D" strokeWidth="2"/>
          <circle cx="305" cy="155" r="17" fill="#F8992D"/>
          <polyline points="296,155 302,161 315,148" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Real-Time Chat',
      description: 'Communicate directly with providers through instant messaging',
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="chat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#162e2e"/>
              <stop offset="100%" stopColor="#1e4040"/>
            </linearGradient>
          </defs>
          <rect width="400" height="192" fill="url(#chat-bg)"/>
          {/* Subtle wave lines */}
          <path d="M0 140 Q100 120 200 140 Q300 160 400 140" stroke="white" strokeOpacity="0.05" strokeWidth="1" fill="none"/>
          <path d="M0 160 Q100 140 200 160 Q300 180 400 160" stroke="white" strokeOpacity="0.04" strokeWidth="1" fill="none"/>
          {/* Received bubble */}
          <rect x="44" y="28" width="160" height="36" rx="18" fill="#274345" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1"/>
          <circle cx="68" cy="46" r="12" fill="#F8992D" fillOpacity="0.85"/>
          <text x="68" y="50" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700">P</text>
          <rect x="92" y="38" width="90" height="7" rx="3.5" fill="white" fillOpacity="0.55"/>
          <rect x="92" y="50" width="68" height="5" rx="2.5" fill="white" fillOpacity="0.3"/>
          {/* Sent bubble */}
          <rect x="196" y="82" width="160" height="36" rx="18" fill="#F8992D" fillOpacity="0.85"/>
          <circle cx="332" cy="100" r="12" fill="#274345"/>
          <text x="332" y="104" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700">U</text>
          <rect x="212" y="92" width="90" height="7" rx="3.5" fill="white" fillOpacity="0.7"/>
          <rect x="212" y="104" width="68" height="5" rx="2.5" fill="white" fillOpacity="0.5"/>
          {/* Received bubble 2 */}
          <rect x="44" y="136" width="140" height="34" rx="17" fill="#274345" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1"/>
          <circle cx="65" cy="153" r="12" fill="#F8992D" fillOpacity="0.85"/>
          <text x="65" y="157" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700">P</text>
          {/* Typing dots */}
          <circle cx="95" cy="153" r="4" fill="white" fillOpacity="0.7"/>
          <circle cx="111" cy="153" r="4" fill="white" fillOpacity="0.5"/>
          <circle cx="127" cy="153" r="4" fill="white" fillOpacity="0.3"/>
          {/* Online indicator */}
          <circle cx="357" cy="32" r="6" fill="#22c55e"/>
          <text x="344" y="36" textAnchor="end" fill="white" fontSize="9" fontFamily="sans-serif" fillOpacity="0.6">Online</text>
        </svg>
      ),
    },
    {
      title: 'Ratings & Reviews',
      description: 'Make informed decisions based on community feedback',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="rat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3a3a"/>
              <stop offset="100%" stopColor="#0f2020"/>
            </linearGradient>
          </defs>
          <rect width="400" height="192" fill="url(#rat-bg)"/>
          {/* Stars row */}
          {[80,120,160,200,240].map((x,i) => (
            <path key={i} d={`M${x} 44 l5 15 h16 l-13 9 5 15 -13-9 -13 9 5-15 -13-9 h16z`} fill={i < 5 ? "#F8992D" : "#374151"} />
          ))}
          {/* Rating number */}
          <text x="295" y="62" fill="#F8992D" fontSize="28" fontFamily="sans-serif" fontWeight="800">4.8</text>
          <text x="295" y="76" fill="white" fontSize="9" fontFamily="sans-serif" fillOpacity="0.5">out of 5</text>
          {/* Review cards */}
          <rect x="40" y="90" width="148" height="82" rx="10" fill="#1e4040" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1"/>
          <circle cx="62" cy="108" r="11" fill="#F8992D" fillOpacity="0.8"/>
          <text x="62" y="112" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">M</text>
          <rect x="80" y="102" width="70" height="6" rx="3" fill="white" fillOpacity="0.5"/>
          {[0,1,2].map(i => <path key={i} d={`M${80+i*16} 118 l3 9 h10 l-8 6 3 9 -8-6 -8 6 3-9 -8-6 h10z`} fill="#F8992D" transform="scale(0.55) translate(${70+i*30}, 100)"/>)}
          {[105,116].map((y,i) => <rect key={i} x="80" y={y} width={i===0?90:70} height="5" rx="2.5" fill="white" fillOpacity="0.3"/>)}
          <rect x="212" y="90" width="148" height="82" rx="10" fill="#1e4040" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1"/>
          <circle cx="234" cy="108" r="11" fill="#274345" stroke="#F8992D" strokeWidth="1.5"/>
          <text x="234" y="112" textAnchor="middle" fill="#F8992D" fontSize="9" fontWeight="700">K</text>
          <rect x="252" y="102" width="70" height="6" rx="3" fill="white" fillOpacity="0.5"/>
          {[105,116].map((y,i) => <rect key={i} x="252" y={y} width={i===0?90:70} height="5" rx="2.5" fill="white" fillOpacity="0.3"/>)}
          {/* Stars on second card */}
          {[252,264,276,288,300].map((x,i) => (
            <path key={i} d={`M${x} 125 l2 5 h5 l-4 3 2 5 -4-3 -4 3 2-5 -4-3 h5z`} fill={i<4?"#F8992D":"#374151"}/>
          ))}
        </svg>
      ),
    },
    {
      title: 'Fast Response',
      description: 'Get connected with available providers within minutes',
      hoverBg: 'bg-secondary/10 dark:bg-secondary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id="fast-bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e3a3a"/>
              <stop offset="100%" stopColor="#0a1a1a"/>
            </radialGradient>
          </defs>
          <rect width="400" height="192" fill="url(#fast-bg)"/>
          {/* Speed lines */}
          {[30,55,80,105,130].map((y,i) => (
            <line key={i} x1="20" y1={y} x2={60+i*10} y2={y} stroke="#F8992D" strokeOpacity={0.15+i*0.05} strokeWidth="2" strokeLinecap="round"/>
          ))}
          {[62,87,112,137,162].map((y,i) => (
            <line key={i} x1="340" y1={y} x2={300-i*10} y2={y} stroke="#F8992D" strokeOpacity={0.15+i*0.05} strokeWidth="2" strokeLinecap="round"/>
          ))}
          {/* Clock face */}
          <circle cx="200" cy="96" r="60" fill="#0f2020" stroke="#F8992D" strokeWidth="2" strokeOpacity="0.7"/>
          <circle cx="200" cy="96" r="54" fill="none" stroke="#274345" strokeWidth="1"/>
          {/* Clock ticks */}
          {Array.from({length:12},(_,i)=>{
            const a = (i*30-90)*Math.PI/180;
            const r1=46, r2=52;
            return <line key={i} x1={200+r1*Math.cos(a)} y1={96+r1*Math.sin(a)} x2={200+r2*Math.cos(a)} y2={96+r2*Math.sin(a)} stroke="white" strokeOpacity="0.3" strokeWidth={i%3===0?2:1}/>;
          })}
          {/* Hour hand */}
          <line x1="200" y1="96" x2="200" y2="64" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          {/* Minute hand — almost top of the hour */}
          <line x1="200" y1="96" x2="228" y2="72" stroke="#F8992D" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="200" cy="96" r="4" fill="#F8992D"/>
          {/* Lightning bolt */}
          <path d="M218 30 L204 55 L215 55 L197 82 L211 82 L194 110 L228 68 L215 68 L230 44Z" fill="#F8992D" fillOpacity="0.9"/>
          {/* Response time badge */}
          <rect x="148" y="158" width="104" height="24" rx="12" fill="#F8992D"/>
          <text x="200" y="174" textAnchor="middle" fill="white" fontSize="11" fontFamily="sans-serif" fontWeight="700">Avg. Response: 4min</text>
        </svg>
      ),
    },
    {
      title: 'Quality Assurance',
      description: 'Premium service standards guaranteed by our platform',
      hoverBg: 'bg-primary/10 dark:bg-primary/20',
      illustration: (
        <svg viewBox="0 0 400 192" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="qa-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3a3a"/>
              <stop offset="100%" stopColor="#162e2e"/>
            </linearGradient>
          </defs>
          <rect width="400" height="192" fill="url(#qa-bg)"/>
          {/* Sparkles */}
          {[[60,30],[340,28],[48,148],[355,140],[88,96],[316,100]].map(([x,y],i)=>(
            <g key={i} opacity="0.5">
              <line x1={x-7} y1={y} x2={x+7} y2={y} stroke="#F8992D" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1={x} y1={y-7} x2={x} y2={y+7} stroke="#F8992D" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          ))}
          {/* Shield */}
          <path d="M200 18 L260 42 L260 96 C260 134 200 162 200 162 C200 162 140 134 140 96 L140 42 Z" fill="#0f2626" stroke="#F8992D" strokeWidth="2.5" strokeOpacity="0.8"/>
          <path d="M200 30 L248 50 L248 96 C248 126 200 150 200 150 C200 150 152 126 152 96 L152 50 Z" fill="#1e4040"/>
          {/* Checkmark */}
          <polyline points="172,94 190,112 228,76" fill="none" stroke="#F8992D" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Certified banner */}
          <rect x="130" y="162" width="140" height="22" rx="11" fill="#F8992D" fillOpacity="0.9"/>
          <text x="200" y="177" textAnchor="middle" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="700" letterSpacing="1">CERTIFIED QUALITY</text>
          {/* Corner seals */}
          <circle cx="88" cy="96" r="16" fill="#0f2626" stroke="#F8992D" strokeWidth="1.5" strokeOpacity="0.5"/>
          <text x="88" y="99" textAnchor="middle" fill="#F8992D" fontSize="9" fontFamily="sans-serif" fontWeight="700">ISO</text>
          <circle cx="316" cy="100" r="16" fill="#0f2626" stroke="#F8992D" strokeWidth="1.5" strokeOpacity="0.5"/>
          <text x="316" y="103" textAnchor="middle" fill="#F8992D" fontSize="9" fontFamily="sans-serif" fontWeight="700">PRO</text>
        </svg>
      ),
    },
  ];

  const svgBase = { viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.4, strokeLinecap:"round" as const, strokeLinejoin:"round" as const, className:"w-10 h-10" };

  const categories = [
    {
      name: 'Plumbing',
      icon: (
        <svg {...svgBase}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      name: 'Electrical',
      icon: (
        <svg {...svgBase}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      name: 'Carpentry',
      icon: (
        <svg {...svgBase}>
          <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3l8.5-8.5" />
          <path d="M17.64 15L22 10.64" />
          <path d="M20.35 6.35L17.65 9.05a1 1 0 0 0-.15 1.15L19 12l3-3-1.5-1.5a1 1 0 0 0-1.15-.15z" />
          <path d="M4 20L2 22" />
        </svg>
      ),
    },
    {
      name: 'Painting',
      icon: (
        <svg {...svgBase}>
          <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" />
          <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
          <path d="M14.5 17.5L4.5 15" />
        </svg>
      ),
    },
    {
      name: 'Cleaning',
      icon: (
        <svg {...svgBase}>
          <path d="M6 8h12l-1.5 11a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5z" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
          <circle cx="10" cy="14" r="1" />
          <circle cx="14" cy="13" r="1" />
        </svg>
      ),
    },
    {
      name: 'Gardening',
      icon: (
        <svg {...svgBase}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      ),
    },
  ];

  const stats = [
    { number: '2,400+', label: 'Happy Customers' },
    { number: '180+',   label: 'Verified Providers' },
    { number: '8,500+', label: 'Jobs Completed' },
    { number: '4.8/5',  label: 'Average Rating' },
  ];

  return (
    <div className="flex flex-col overflow-hidden bg-background">
     
      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 pb-28 sm:py-32"
        style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 50%, #2a4d4f 100%)' }}
      >
        {/* Decorative abstract lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M-200 700 C200 200 700 900 1440 300" stroke="white" strokeWidth="120" strokeLinecap="round" opacity="0.04"/>
          <path d="M-100 900 C300 400 900 1000 1600 500" stroke="white" strokeWidth="80" strokeLinecap="round" opacity="0.04"/>
          <path d="M400 -100 C600 300 200 700 900 1000" stroke="white" strokeWidth="100" strokeLinecap="round" opacity="0.04"/>
          <path d="M1100 -200 C1300 200 900 600 1440 900" stroke="white" strokeWidth="70" strokeLinecap="round" opacity="0.03"/>
        </svg>

        {/* Wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0 leading-none z-10">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-16 sm:h-20 block" style={{ fill: 'hsl(var(--background))' }}>
            <path d="M0,80 L0,50 Q360,0 720,40 Q1080,80 1440,30 L1440,80 Z" />
          </svg>
        </div>

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
              <div
                key={category.name}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-6 shadow-lg hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors text-white">
                  {category.icon}
                </div>
                <p className="text-white font-bold text-sm text-center">{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-background border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/40">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center py-6 sm:py-8 px-4">
                <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-none mb-2">
                  {stat.number}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adverts Section (Replaced Special Offers) (Goal 6) */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Advertisments
            </h2>
          </div>
          {/* Updated with real Mascom ad images for more appeal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mascom Banner 1: Data Deal */}
            <div className="group relative aspect-video rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://pbs.twimg.com/media/G5j9370WEAAbClT.jpg')` }}
              ></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              <div className="relative flex flex-col items-center justify-center p-6 text-white h-full">
                <span className="absolute top-4 left-4 bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded-full transform group-hover:rotate-2 transition-transform">TOP DEAL</span>
                <p className="text-4xl font-extrabold mb-1 text-yellow-300">MySurf 5G</p>
                <p className="text-sm font-semibold mb-3 text-center">Fast internet for artisans on the go</p>
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200 shadow-md">Get Offer</Button>
              </div>
            </div>
            {/* Mascom Banner 2: Voice Offer */}
            <div className="group relative aspect-video rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://pbs.twimg.com/media/G5n1OMbWwAAlOuZ.jpg')` }}
              ></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              <div className="relative flex flex-col items-center justify-center p-6 text-white h-full">
                <span className="absolute top-4 right-4 text-xs font-medium border border-white px-2 py-0.5 rounded-full">NEW</span>
                <p className="text-4xl font-extrabold mb-1 text-yellow-300">200% Bonus</p>
                <p className="text-sm font-semibold mb-3 text-center">Airtime for unlimited calls</p>
                <Button size="sm" variant="outline" className="text-white hover:bg-white/20 border-white shadow-md">More Info</Button>
              </div>
            </div>
            {/* Mascom Banner 3: App Bonus */}
            <div className="group relative aspect-video rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.03] transition-transform duration-300">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://pbs.twimg.com/media/G5eVJ0-WYAASO5j.jpg')` }}
              ></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              <div className="relative flex flex-col items-center justify-center p-6 text-white h-full">
                <span className="absolute bottom-4 right-4 text-xs font-medium bg-white/30 px-2 py-0.5 rounded-full">JOB BONUS</span>
                <p className="text-4xl font-extrabold mb-1 text-yellow-300">+Bonus Airtime</p>
                <p className="text-sm font-semibold mb-3 text-center">Recharge P30+ via MyZaka</p>
                <Button size="sm" className="bg-white text-primary hover:bg-neutral-200 shadow-md">Claim Now</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Now Popular Services (Goal 8) */}
      <section id="popular-services" className="py-16 sm:py-20 bg-background">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-7 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors text-foreground dark:text-white group-hover:text-primary">
                  {category.icon}
                </div>
                <p className="font-semibold text-sm text-foreground dark:text-white text-center group-hover:text-primary transition-colors">
                  {category.name}
                </p>
              </div>
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
      <section id="why-choose-us" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge
              variant="default"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 py-1 px-3 text-sm font-semibold"
            >
              Why Choose Us
            </Badge>
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
                  <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-lg transform group-hover:scale-[1.02] transition-transform duration-500">
                    {feature.illustration}
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
          <Link href="/browse-suppliers">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl">
              Browse Suppliers <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Call to Action Section - New Dark, Blurred Background (Goal 7) */}
      <section className="py-16 sm:py-24 bg-neutral-900 text-white relative overflow-hidden">
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
                size="lg"
                className="w-full sm:w-auto text-lg sm:text-xl px-10 py-7 bg-secondary hover:bg-secondary/90 shadow-2xl hover:shadow-3xl transform hover:scale-[1.05] transition-all duration-300 font-bold"
              >
                Create Your Account Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                size="lg"
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

    </div>
  );
}
