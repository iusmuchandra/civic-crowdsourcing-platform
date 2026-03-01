'use client';

import dynamic from 'next/dynamic';
import { ConditionsTicker } from "@/components/sections/ConditionsTicker";
import { PerformanceStats } from "@/components/sections/PerformanceStats";
import { BookingCalendar } from "@/components/sections/BookingCalendar";
import { ConciergeChat } from "@/components/sections/ConciergeChat";
import { ScrollReveal } from "@/components/layout/ScrollReveal";

const Hero = dynamic(() => import('@/components/sections/Hero').then(mod => ({ default: mod.Hero })), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-screen items-center justify-center bg-[#0A1A18]">
      <span className="text-[#4EC9C0] font-sans text-sm tracking-[0.2em] uppercase animate-pulse">
        Loading 3D Environment...
      </span>
    </div>
  )
});

const TheLake = dynamic(() => import('@/components/sections/TheLake').then(mod => ({ default: mod.TheLake })), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-[80vh] items-center justify-center bg-[#0A1A18]">
      <span className="text-[#4EC9C0] font-sans text-sm tracking-[0.2em] uppercase animate-pulse">
        Loading Lake Visualization...
      </span>
    </div>
  )
});

const GlassCam = dynamic(() => import('@/components/sections/GlassCam').then(mod => ({ default: mod.GlassCam })), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-[80vh] items-center justify-center bg-[#0A1A18]">
      <span className="text-[#4EC9C0] font-sans text-sm tracking-[0.2em] uppercase animate-pulse">
        Loading Glass Cam...
      </span>
    </div>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <ScrollReveal />
      <Hero />
      <ConditionsTicker />
      <TheLake />
      <GlassCam />
      <PerformanceStats />
      <BookingCalendar />
      <ConciergeChat />
    </main>
  );
}
