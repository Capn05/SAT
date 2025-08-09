"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Pages where sidebar and mobile nav should be hidden
  const authPages = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/reset-password',
    '/auth/reset-redirect',
    '/auth/handle-auth',
    '/auth/callback',
    '/pricing'
  ]
  
  // Check if current page should hide navigation
  const shouldHideNavigation = 
    pathname === '/' ||
    pathname.startsWith('/landing') ||
    authPages.includes(pathname)

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile and auth pages */}
      {!shouldHideNavigation && <Sidebar />}
      
      <div style={{ 
        marginLeft: shouldHideNavigation ? "0px" : "0px",
        flex: 1,
        width: shouldHideNavigation ? "100%" : "auto",
        paddingBottom: shouldHideNavigation ? "0" : "60px" // Add padding for mobile nav
      }}>
        {children}
      </div>
      
      {/* Mobile Navigation - hidden on desktop and auth pages */}
      {!shouldHideNavigation && <MobileNav />}
    </>
  )
}
