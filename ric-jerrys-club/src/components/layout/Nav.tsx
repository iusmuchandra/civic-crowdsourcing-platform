'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-400 ${scrolled ? 'bg-[#0A1A18]/95 backdrop-blur-md' : 'bg-gradient-to-b from-[#0A1A18]/95 to-transparent'}`}>
      <div className="font-serif text-lg font-light tracking-[0.2em] uppercase text-[#F5F2EE]">
        Ric <span className="text-[#D4A85A]">&</span> Jerry&apos;s <span className="text-[#F5F2EE]/30">·</span> WSC
      </div>
      
      <ul className="hidden md:flex gap-10 list-none m-0 p-0">
        <li><Link href="#the-lake" className="text-xs tracking-[0.18em] uppercase text-[#F5F2EE]/70 hover:text-[#4EC9C0] transition-colors">The Lake</Link></li>
        <li><Link href="#the-pull" className="text-xs tracking-[0.18em] uppercase text-[#F5F2EE]/70 hover:text-[#4EC9C0] transition-colors">Performance</Link></li>
        <li><Link href="#booking" className="text-xs tracking-[0.18em] uppercase text-[#F5F2EE]/70 hover:text-[#4EC9C0] transition-colors">Booking</Link></li>
      </ul>

      <Link href="#membership" className="text-[0.7rem] tracking-[0.15em] uppercase px-6 py-2.5 border border-[#D4A85A] text-[#D4A85A] hover:bg-[#D4A85A] hover:text-[#0A1A18] transition-all">
        Join the Club
      </Link>
    </nav>
  );
}