'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] || 'en';

  const navItems = [
    { href: `/${locale}`,          label: 'Home',   icon: '\u{1F3E0}' },
    { href: `/${locale}/map`,      label: 'Map',    icon: '\u{1F5FA}\u{FE0F}' },
    { href: `/${locale}/issues/new`, label: 'Report', icon: '\u{2795}' },
  ];

  const hideNav = pathname.endsWith('/issues/new');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== `/${locale}` && pathname.startsWith(href));
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
