"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Clock, BarChart2, Calculator, BookOpen, Crosshair, Rabbit, Settings, Menu, LogOut, User, AlertTriangle, X } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DifficultyModal from "../app/components/DifficultyModal.jsx"
import styles from "./mobileNav.module.css"

// Share the same nav items as sidebar for consistency
const primaryNavItems = [
  { name: "Dashboard", icon: Home, path: "/home" },
  { name: "Practice Test", icon: Clock, path: "/TimedTestDash" },
  { name: "Skills", icon: Crosshair, path: "/skills" },
  { name: "Progress", icon: BarChart2, path: "/progress" },
  { name: "More", icon: Menu, path: "#", isMenu: true },
]

// Secondary items for the "More" menu
const secondaryNavItems = [
  { 
    name: "Quick Practice", 
    icon: Rabbit, 
    subItems: [
      { name: "Math", icon: Calculator, subject: "1" },
      { name: "Reading/Writing", icon: BookOpen, subject: "2" },
    ],
  },
  { name: "Settings", icon: Settings, path: "/subscription" },
  { name: "Logout", icon: LogOut, isLogout: true },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [showMobileBanner, setShowMobileBanner] = useState(true)
  
  // Create Supabase client
  const supabase = createClientComponentClient()

  // Get user email on mount
  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoadingUser(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email)
      } else {
        // If no session, try to get user data
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
        }
      }
      setIsLoadingUser(false)
    }
    
    getUserInfo()
    
    // Subscribe to auth changes to update email when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoadingUser(true)
        if (session?.user) {
          setUserEmail(session.user.email)
        } else {
          setUserEmail(null)
        }
        setIsLoadingUser(false)
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Handle quick practice item click
  const handleQuickPracticeClick = (subject: string) => {
    setSelectedSubject(subject)
    setShowDifficultyModal(true)
    setShowMoreMenu(false)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Toggle more menu
  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  // Close the mobile warning banner
  const closeMobileBanner = () => {
    setShowMobileBanner(false)
  }

  // Add bannerSpacing class if banner is showing
  const mobileNavWrapperClass = showMobileBanner ? styles.bannerSpacing : '';

  return (
    <div className={mobileNavWrapperClass}>
      {/* Mobile Warning Banner */}
      {showMobileBanner && (
        <div className={styles.mobileBanner}>
          <div className={styles.bannerContent}>
            <AlertTriangle className={styles.bannerIcon} size={16} />
            <span>For best experience, use a computer or tablet</span>
          </div>
          <button 
            className={styles.bannerCloseButton} 
            onClick={closeMobileBanner}
            aria-label="Close warning"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Bottom Navigation Bar */}
      <nav className={styles.mobileNav}>
        {primaryNavItems.map((item) => {
          const isActive = item.path && item.path !== "#" ? pathname === item.path : false;
          
          if (item.isMenu) {
            return (
              <button 
                key={item.name}
                className={`${styles.navItem} ${showMoreMenu ? styles.active : ""}`}
                onClick={toggleMoreMenu}
                aria-label="More options"
              >
                <item.icon className={styles.icon} />
                <span className={styles.label}>{item.name}</span>
              </button>
            );
          }
          
          return (
            <Link 
              key={item.name}
              href={item.path!} 
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <item.icon className={styles.icon} />
              <span className={styles.label}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className={styles.moreMenuOverlay} onClick={() => setShowMoreMenu(false)}>
          <div className={styles.moreMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.moreMenuHeader}>
              <h3>More Options</h3>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowMoreMenu(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            
            {/* User Profile Section */}
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <div className={styles.userIconWrapper}>
                  <User className={styles.userIcon} />
                </div>
                <div className={styles.userDetails}>
                  {isLoadingUser ? (
                    <span className={styles.userEmail}>Loading...</span>
                  ) : userEmail ? (
                    <span className={styles.userEmail}>{userEmail}</span>
                  ) : (
                    <span className={styles.userEmail}>Not signed in</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.moreMenuItems}>
              {secondaryNavItems.map((item) => {
                if (item.subItems) {
                  return (
                    <div key={item.name} className={styles.moreMenuItem}>
                      <div className={styles.moreMenuSection}>
                        <item.icon className={styles.moreMenuIcon} />
                        <span>{item.name}</span>
                      </div>
                      
                      <div className={styles.subItems}>
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.name}
                            className={styles.subItem}
                            onClick={() => handleQuickPracticeClick(subItem.subject)}
                          >
                            <subItem.icon className={styles.subItemIcon} />
                            <span>{subItem.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                if (item.isLogout) {
                  return (
                    <button 
                      key={item.name}
                      className={styles.moreMenuItem}
                      onClick={() => {
                        handleLogout();
                        setShowMoreMenu(false);
                      }}
                    >
                      <item.icon className={styles.moreMenuIcon} style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>{item.name}</span>
                    </button>
                  );
                }
                
                return (
                  <Link 
                    key={item.name}
                    href={item.path!} 
                    className={styles.moreMenuItem}
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <item.icon className={styles.moreMenuIcon} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Difficulty Modal */}
      {showDifficultyModal && (
        <DifficultyModal
          isOpen={showDifficultyModal}
          onClose={() => setShowDifficultyModal(false)}
          subject={selectedSubject}
          title="Select Difficulty Level"
        />
      )}
    </div>
  );
} 