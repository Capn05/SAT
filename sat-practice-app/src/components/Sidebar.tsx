"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Clock, BarChart2, MessageSquare, ChevronRight, Calculator, BookOpen, Crosshair, Rabbit } from "lucide-react"
import styles from "./sidebar.module.css"

const navItems = [
  { name: "Dashboard", icon: Home, path: "/home" },
  {
    name: "Quick Practice",
    icon: Rabbit,
    subItems: [
      { name: "Math", icon: Calculator, path: "/questions?subject=1&mode=quick" },
      { name: "Reading/Writing", icon: BookOpen, path: "/questions?subject=2&mode=quick" },
    ],
  },
  { name: "Timed Practice Test", icon: Clock, path: "/TimedTestDash" },
  { name: "Targeted Skill Practice", icon: Crosshair, path: "/skills" },
  { name: "Progress", icon: BarChart2, path: "/analytics" },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null)
  const pathname = usePathname()

  const toggleSubMenu = (name: string) => {
    if (expandedSubMenu === name) {
      setExpandedSubMenu(null)
    } else {
      setExpandedSubMenu(name)
    }
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
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false)
        setExpandedSubMenu(null)
      }}
      style={{ overflow: 'hidden', width: isExpanded ? '240px' : '60px' }}
    >
      <div className={styles.sidebarContent} style={{ 
        position: 'fixed', 
        width: isExpanded ? '240px' : '60px',
        overflow: 'hidden'
      }}>
        <div className={styles.header}>
          <span className={styles.logoIcon}>S</span>
        </div>

        <nav className={styles.nav} style={{ width: '100%' }}>
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
                  <Link href={item.path!} className={`${styles.navItem} ${isActive ? styles.active : ""}`}>
                    <div className={styles.iconWrapper}>
                      <item.icon className={styles.icon} />
                    </div>
                    <span className={styles.label}>{item.name}</span>
                  </Link>
                )}
                {hasSubItems && (expandedSubMenu === item.name || !isExpanded) && (
                  <div className={styles.subItems}>
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.path}
                        className={`${styles.navItem} ${styles.subItem} ${pathname === subItem.path ? styles.active : ""}`}
                      >
                        <div className={styles.iconWrapper}>
                          <subItem.icon className={styles.icon} />
                        </div>
                        <span className={styles.label}>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${styles.toggleButton} ${isExpanded ? styles.rotated : ""}`}
        style={{ position: 'fixed', left: isExpanded ? '220px' : '40px' }}
      >
        <ChevronRight />
      </button>
    </div>
  )
}

