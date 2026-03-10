'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Layout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 font-bold text-xl border-b">CarouselBuilder</div>
        <nav className="p-2">
          <Link href="/dashboard" className={`block p-2 rounded ${pathname === '/dashboard' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>
            Dashboard
          </Link>
          <Link href="/builder" className={`block p-2 rounded ${pathname === '/builder' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>
            New Carousel
          </Link>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-semibold">Carousel Builder</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">user@example.com</span>
            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
