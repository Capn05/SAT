"use client"
import Link from 'next/link'

export default function Sidebar() {
  const subjects = ['Math', 'Reading', 'Science', 'English']
  
  return (
    <div style={styles.sidebar}>
      {subjects.map((subject) => (
        <Link 
          key={subject} 
          href={`/${subject.toLowerCase()}`}
          style={styles.sidebarItem}
        >
          {subject}
        </Link>
      ))}
    </div>
  )
}

const styles = {
  sidebar: {
    width: '200px',
    backgroundColor: '#f5f7f5',
    height: '100vh',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarItem: {
    padding: '12px 24px',
    textDecoration: 'none',
    color: '#333',
    backgroundColor: '#e6f0e6',
    margin: '0 12px',
    borderRadius: '4px',
    fontSize: '14px',
  },
}

