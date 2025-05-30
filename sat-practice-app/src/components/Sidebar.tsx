"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Home, Clock, BarChart2, MessageSquare, ChevronRight, Calculator, BookOpen, Crosshair, Rabbit, LogOut, User, Settings, CreditCard } from "lucide-react"
import styles from "./sidebar.module.css"
import DifficultyModal from "../app/components/DifficultyModal"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { usePostHog } from 'posthog-js/react'

const navItems = [
  { name: "Dashboard", icon: Home, path: "/home" },
  {
    name: "Quick Practice",
    icon: Rabbit,
    subItems: [
      { name: "Math", icon: Calculator, subject: "1" },
      { name: "Reading/Writing", icon: BookOpen, subject: "2" },
    ],
  },
  { name: "Timed Practice Test", icon: Clock, path: "/TimedTestDash" },
  { name: "Targeted Skill Practice", icon: Crosshair, path: "/skills" },
  { name: "Progress", icon: BarChart2, path: "/progress" },
  { name: "Settings", icon: Settings, path: "/subscription" },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const posthog = usePostHog()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Create Supabase client
  const supabase = createClientComponentClient()
  
  // Add states for difficulty modal
  const [showDifficultyModal, setShowDifficultyModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  // Get user email on mount
  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoadingUser(true)
      const { data: { session } } = await supabase.auth.getSession()
      console.log("User session:", session)
      if (session?.user) {
        console.log("User email:", session.user.email)
        setUserEmail(session.user.email)
      } else {
        // If no session, try to get user data
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          console.log("User email from getUser:", user.email)
          setUserEmail(user.email)
        }
      }
      setIsLoadingUser(false)
    }
    
    getUserInfo()
    
    // Subscribe to auth changes to update email when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event)
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

  // Identify user when email is available
  useEffect(() => {
    if (userEmail && !isLoadingUser) {
      posthog?.identify(userEmail, {
        email: userEmail
      })
    }
  }, [userEmail, isLoadingUser, posthog])

  const handleLogout = async () => {
    try {
      // Track logout event
      posthog?.capture('user_logout', { source: 'sidebar' })
      
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const toggleSubMenu = (name: string) => {
    if (expandedSubMenu === name) {
      setExpandedSubMenu(null)
    } else {
      setExpandedSubMenu(name)
    }
    
    // Track submenu toggle event
    posthog?.capture('sidebar_submenu_toggled', { 
      menu_name: name,
      action: expandedSubMenu === name ? 'closed' : 'opened'
    })
  }

  // Add this to your component or import from a styles file
  const sidebarStyles = {
    active: {
      backgroundColor: "#10b981",
      color: "white",
      borderRadius: "0.375rem",
    }
  };

  // Handle quick practice item click
  const handleQuickPracticeClick = (subject: string) => {
    setSelectedSubject(subject)
    setShowDifficultyModal(true)
    // Close the sidebar when opening the modal
    setIsExpanded(false)
    setExpandedSubMenu(null)
    
    // Track quick practice selection with PostHog
    posthog?.capture('quick_practice_selected', { 
      subject: subject === "1" ? "Math" : "Reading/Writing",
      source: 'sidebar'
    })
  }

  // Toggle sidebar expanded state
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
    
    // Track sidebar toggle event
    posthog?.capture('sidebar_toggled', { 
      action: !isExpanded ? 'expanded' : 'collapsed' 
    })
  }

  // Add scroll event listener to handle sidebar position
  useEffect(() => {
    const handleScroll = () => {
      const sidebar = document.querySelector(`.${styles.sidebarContent}`) as HTMLElement
      if (sidebar) {
        const scrollTop = window.scrollY
        sidebar.style.top = `${scrollTop}px`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ""}`}
      onMouseEnter={() => {
        setIsExpanded(true)
        posthog?.capture('sidebar_hovered', { action: 'expanded' })
      }}
      onMouseLeave={() => {
        setIsExpanded(false)
        setExpandedSubMenu(null)
        setShowUserMenu(false)
        posthog?.capture('sidebar_hovered', { action: 'collapsed' })
      }}
      style={{ overflow: 'hidden', width: isExpanded ? '240px' : '53px' }}
    >
      <div className={styles.sidebarContent} style={{ 
        position: 'fixed', 
        width: isExpanded ? '240px' : '53px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <Image
              src="/assets/images/logo.png"
              alt="SAT Study Logo"
              width={40}
              height={40}
              className={styles.logo}
            />
          </div>
        </div>

        <nav className={styles.nav} style={{ width: '100%', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = item.path ? pathname === item.path : false
            const hasSubItems = item.subItems && item.subItems.length > 0

            return (
              <React.Fragment key={item.name}>
                {hasSubItems ? (
                  <div className={`${styles.navItem} ${styles.hasSubItems}`} onClick={() => toggleSubMenu(item.name)}>
                    <div className={styles.iconWrapper}>
                      <item.icon className={styles.icon} />
                    </div>
                    <span className={styles.label}>{item.name}</span>
                    {isExpanded && (
                      <ChevronRight
                        className={`${styles.chevron} ${expandedSubMenu === item.name ? styles.rotated : ""}`}
                      />
                    )}
                  </div>
                ) : (
                  <Link 
                    href={item.path!} 
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                    style={isActive ? sidebarStyles.active : {}}
                  >
                    <div className={styles.iconWrapper}>
                      <item.icon className={styles.icon} style={isActive ? { color: "white" } : {}} />
                    </div>
                    <span className={styles.label}>{item.name}</span>
                  </Link>
                )}
                {hasSubItems && (expandedSubMenu === item.name || !isExpanded) && (
                  <div className={styles.subItems}>
                    {item.subItems!.map((subItem) => {
                      // Check if this is a Quick Practice subitem (has subject property)
                      if (subItem.subject) {
                        return (
                          <div
                            key={subItem.name}
                            className={`${styles.navItem} ${styles.subItem}`}
                            onClick={() => handleQuickPracticeClick(subItem.subject)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={styles.iconWrapper}>
                              <subItem.icon className={styles.icon} />
                            </div>
                            <span className={styles.label}>{subItem.name}</span>
                          </div>
                        );
                      }
                      
                      // Regular link for other subitems
                      return (
                        <Link
                          key={subItem.name}
                          href={ "#"}
                          className={`${styles.navItem} ${styles.subItem} `}
                        >
                          <div className={styles.iconWrapper}>
                            <subItem.icon className={styles.icon} />
                          </div>
                          <span className={styles.label}>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </nav>
        
        {/* User profile section at bottom */}
        <div className={styles.userSection} style={{ 
          marginTop: 'auto', 
          padding: '16px 8px',
          borderTop: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <div 
            className={styles.navItem} 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.iconWrapper} style={{ 
              backgroundColor: userEmail ? '#ecfdf5' : '#f3f4f6',
              color: userEmail ? '#10b981' : '#9ca3af'
            }}>
              <User className={styles.icon} />
            </div>
            <span className={styles.label} style={{ 
              opacity: isExpanded ? 1 : 0,
              transform: isExpanded ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '170px',
              fontSize: '14px'
            }}>
              {isLoadingUser ? 'Loading...' : userEmail || 'Not signed in'}
            </span>
            {isExpanded && (
              <ChevronRight
                className={`${styles.chevron} ${showUserMenu ? styles.rotated : ""}`}
                style={{ marginLeft: 'auto', opacity: 0.5 }}
              />
            )}
          </div>
          
          {isExpanded && showUserMenu && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '10px',
              right: '10px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              padding: '8px 0',
              zIndex: 100
            }}>
              {userEmail && (
                <div style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                  wordBreak: 'break-all'
                }}>
                  {userEmail}
                </div>
              )}
              <div 
                onClick={handleLogout}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: '#dc2626',
                  borderRadius: '4px',
                  margin: '4px 8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={16} />
                <span style={{ fontSize: '14px' }}>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className={`${styles.toggleButton} ${isExpanded ? styles.rotated : ""}`}
        style={{ position: 'fixed', left: isExpanded ? '220px' : '30px' }}
      >
        <ChevronRight />
      </button>
      
      {/* Difficulty Modal */}
      {showDifficultyModal && (
        <DifficultyModal
          isOpen={showDifficultyModal}
          onClose={() => {
            setShowDifficultyModal(false)
            // Ensure sidebar is collapsed when modal is closed
            setIsExpanded(false)
            setExpandedSubMenu(null)
          }}
          subject={selectedSubject}
          mode="quick"
          title="Quick Practice"
        />
      )}
    </div>
  )
}

