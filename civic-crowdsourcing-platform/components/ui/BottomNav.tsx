'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',        label: 'Home',      icon: '🏠' },
  { href: '/map',     label: 'Map',       icon: '🗺️' },
  { href: '/issues/new', label: 'Report', icon: '➕' },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on certain routes (full-screen map already has its own UI)
  if (pathname === '/issues/new') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center px-4 py-1 rounded-lg transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
