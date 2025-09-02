'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from "../../components/Sidebar.tsx";
import MobileNav from "../../components/MobileNav.tsx";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname === '/privacy' || pathname === '/terms';

  // Update body display style based on page type
  useEffect(() => {
    document.body.style.display = isPublicPage ? "block" : "flex";
  }, [isPublicPage]);

  if (isPublicPage) {
    // For public pages, return children directly without sidebar/mobile nav
    return (
      <div style={{ width: "100%" }}>
        {children}
      </div>
    );
  }

  // For private pages, include sidebar and mobile nav
  return (
    <>
      {/* Desktop Sidebar - hidden on mobile and public pages */}
      <Sidebar />
      
      <div style={{ 
        flex: 1,
        paddingBottom: "60px" // Add padding for mobile nav
      }}>
        {children}
      </div>
      
      {/* Mobile Navigation - hidden on desktop and public pages */}
      <MobileNav />
    </>
  );
}
