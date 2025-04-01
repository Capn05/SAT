"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FeedbackPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedbackType: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      console.log('Feedback submitted:', formData)
      setIsSubmitting(false)
      setSubmitted(true)
      
      // Reset form after submission
      setFormData({
        name: '',
        email: '',
        feedbackType: 'general',
        message: ''
      })
      
      // Redirect back to subscription page after 2 seconds
      setTimeout(() => {
        router.push('/subscription')
      }, 2000)
    }, 1000)
  }
  
  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <Link href="/subscription" style={styles.backLink}>
            <ArrowLeft size={20} />
            <span>Back to Subscription</span>
          </Link>
          <h1 style={styles.title}>Feedback</h1>
        </div>
        
        <div style={styles.content}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Thank You for Your Feedback!</h2>
            <p style={styles.successMessage}>
              We appreciate you taking the time to share your thoughts with us.
              Your feedback helps us improve Brill for everyone.
            </p>
            <p style={styles.redirectMessage}>
              Redirecting you back to the subscription page...
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/subscription" style={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Back to Subscription</span>
        </Link>
        <h1 style={styles.title}>Feedback</h1>
      </div>
      
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Share Your Thoughts</h2>
          </div>
          
          <div style={styles.cardContent}>
            <p style={styles.introText}>
              Your feedback is valuable to us. Please let us know how we can improve 
              your experience with Brill.
            </p>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="feedbackType">Feedback Type</label>
                <select
                  id="feedbackType"
                  name="feedbackType"
                  value={formData.feedbackType}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="general">General Feedback</option>
                  <option value="subscription">Subscription Issues</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="content">Content Issues</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={6}
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
                {!isSubmitting && <Send size={16} style={{ marginLeft: '8px' }} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    width: 'fit-content',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  content: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  cardContent: {
    padding: '24px',
  },
  introText: {
    fontSize: '16px',
    color: '#4b5563',
    marginTop: 0,
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
    width: '100%',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
    width: '100%',
    backgroundColor: 'white',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
    width: '100%',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '16px',
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    opacity: (props) => props.disabled ? 0.7 : 1,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  },
  successMessage: {
    fontSize: '16px',
    color: '#4b5563',
    margin: '0 0 24px 0',
    lineHeight: 1.5,
    maxWidth: '500px',
  },
  redirectMessage: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
} 