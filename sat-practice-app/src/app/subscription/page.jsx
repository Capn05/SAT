"use client"

import { useState, useEffect, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CreditCard, Mail, Phone, ExternalLink, CheckCircle, AlertCircle, X, Send } from 'lucide-react'
import Link from 'next/link'

// Feedback Modal Component
function FeedbackModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    feedbackType: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          feedbackType: 'general',
          message: ''
        });
        
        // Close modal after delay and trigger success handler
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Share Your Feedback</h2>
          <button style={modalStyles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div style={modalStyles.content}>
          {submitStatus === 'success' ? (
            <div style={modalStyles.successMessage}>
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0' }}>Thank You for Your Feedback!</h3>
              <p style={{ margin: '0', color: '#4b5563' }}>
                We appreciate you taking the time to share your thoughts with us.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={modalStyles.form}>
              {submitStatus === 'error' && (
                <div style={modalStyles.errorMessage}>
                  <AlertCircle size={20} />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label} htmlFor="feedbackType">Feedback Type</label>
                <select
                  id="feedbackType"
                  name="feedbackType"
                  value={formData.feedbackType}
                  onChange={handleChange}
                  style={modalStyles.select}
                  required
                >
                  <option value="general">General Feedback</option>
                  <option value="subscription">Subscription Issues</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="content">Content Issues</option>
                </select>
              </div>
              
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label} htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  style={modalStyles.textarea}
                  rows={6}
                  placeholder="Please tell us how we can improve..."
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                style={modalStyles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
                {!isSubmitting && <Send size={16} style={{ marginLeft: '8px' }} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// New CancelSubscriptionModal Component
function CancelSubscriptionModal({ isOpen, onClose, onCancelSubscription }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onCancelSubscription();
        onClose();
      } else {
        setError(data.error || 'Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Cancel Subscription</h2>
          <button style={modalStyles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div style={modalStyles.content}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <AlertCircle size={48} style={{ color: '#f43f5e', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>Are you sure you want to cancel?</h3>
            <p style={{ margin: '0', color: '#4b5563' }}>
              You'll lose access to all premium features when your current billing period ends.
            </p>
          </div>
          
          {error && (
            <div style={modalStyles.errorMessage}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button 
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Keep Subscription
            </button>
            <button 
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                background: '#f43f5e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: isSubmitting ? '0.7' : '1',
              }}
            >
              {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content component that uses client hooks
function SubscriptionContent() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showCancelSuccess, setShowCancelSuccess] = useState(false)
  
  useEffect(() => {
    // Check if user just subscribed
    const justSubscribed = searchParams.get('subscribed') === 'true'
    setShowThankYou(justSubscribed)
    
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        // Fetch subscription data from our API endpoint
        const response = await fetch('/api/subscription')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch subscription data')
        }
        
        const data = await response.json()
        
        if (data.subscription) {
          // Transform the data to match our UI expectations
          const subscriptionData = {
            id: data.subscription.id,
            plan: getPlanName(data.subscription.plan_type),
            status: data.subscription.status,
            startDate: data.subscription.current_period_start || data.subscription.created_at,
            endDate: data.subscription.current_period_end,
            price: formatPrice(data.subscription.plan_type),
            billingCycle: getBillingCycle(data.subscription.plan_type),
            stripeCustomerId: data.subscription.stripe_customer_id,
            stripeSubscriptionId: data.subscription.stripe_subscription_id
          }
          setSubscription(subscriptionData)
        } else {
          // No subscription found
          setSubscription(null)
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error)
        setError(error.message || 'Failed to load subscription information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSubscription()
  }, [supabase, router, searchParams])
  
  // Helper functions to format subscription data
  const getPlanName = (planType) => {
    switch(planType) {
      case 'monthly':
        return 'Monthly Plan'
      case 'quarterly':
        return 'Quarterly Plan'
      case 'yearly':
        return 'Annual Plan'
      default:
        return 'Premium Plan'
    }
  }
  
  const formatPrice = (planType) => {
    switch(planType) {
      case 'monthly':
        return '$29/month'
      case 'quarterly':
        return '$24'
      case 'yearly':
        return '$49.99'
      default:
        return '$49.99'
    }
  }
  
  const getBillingCycle = (planType) => {
    return planType || 'yearly'
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Calculate days remaining
  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0
    
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = Math.abs(end - today)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setShowFeedbackSuccess(true);
    // Auto-hide feedback success message after 5 seconds
    setTimeout(() => {
      setShowFeedbackSuccess(false);
    }, 5000);
  };
  
  const handleSubscriptionCancel = () => {
    // Update subscription status locally
    if (subscription) {
      setSubscription({
        ...subscription,
        status: 'canceled',
        canceledAt: new Date().toISOString()
      });
    }
    
    // Show success message
    setShowCancelSuccess(true);
    
    // Auto-hide cancel success message after 5 seconds
    setTimeout(() => {
      setShowCancelSuccess(false);
    }, 5000);
  };
  
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading subscription information...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <button 
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    )
  }
  
  // If no subscription found
  if (!subscription) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
        </div>
        
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>No Active Subscription</h2>
            </div>
            
            <div style={{
              ...styles.cardContent,
              textAlign: 'center',
              padding: '48px 24px'
            }}>
              <div style={styles.noSubscriptionIcon}>
                <CreditCard size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                You don't have an active subscription
              </h3>
              <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Subscribe to SAT Prep Pro to get full access to all practice questions, tests, and analytics features.
              </p>
              
              <Link href="/pricing">
                <button style={styles.renewButton}>
                  View Subscription Plans <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Subscription Management</h1>
      </div>
      
      {showThankYou && (
        <div style={styles.thankYouBanner}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <span>Thank you for your subscription! Your account has been updated.</span>
          <button 
            style={styles.dismissButton} 
            onClick={() => setShowThankYou(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      
      {showFeedbackSuccess && (
        <div style={styles.thankYouBanner}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <span>Thank you for your feedback! We appreciate your input.</span>
          <button 
            style={styles.dismissButton} 
            onClick={() => setShowFeedbackSuccess(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      
      {showCancelSuccess && (
        <div style={styles.thankYouBanner}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <span>Your subscription has been canceled. You will have access until the end of your billing period.</span>
          <button 
            style={styles.dismissButton} 
            onClick={() => setShowCancelSuccess(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Your Subscription</h2>
          </div>
          
          <div style={styles.cardContent}>
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Current Plan</div>
                <div style={styles.infoValue}>{subscription?.plan}</div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Status</div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: subscription?.status === 'active' ? '#ecfdf5' : 
                                  subscription?.status === 'canceled' ? '#fef2f2' : '#fef3c7',
                  color: subscription?.status === 'active' ? '#10b981' : 
                        subscription?.status === 'canceled' ? '#ef4444' : '#d97706'
                }}>
                  {subscription?.status === 'active' ? 'Active' : 
                   subscription?.status === 'canceled' ? 'Canceled' : 'Inactive'}
                </div>
              </div>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>
                  <Calendar size={16} style={{ marginRight: '6px' }} />
                  Start Date
                </div>
                <div style={styles.infoValue}>
                  {formatDate(subscription?.startDate)}
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>
                  <Calendar size={16} style={{ marginRight: '6px' }} />
                  {subscription?.status === 'canceled' ? 'Access Until' : 'Renewal Date'}
                </div>
                <div style={styles.infoValue}>
                  {formatDate(subscription?.endDate)}
                </div>
              </div>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>
                  <CreditCard size={16} style={{ marginRight: '6px' }} />
                  Billing Cycle
                </div>
                <div style={styles.infoValue}>
                  {subscription?.billingCycle.charAt(0).toUpperCase() + subscription?.billingCycle.slice(1)}
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Price</div>
                <div style={styles.infoValue}>{subscription?.price}</div>
              </div>
            </div>
            
            {subscription?.status === 'active' && (
              <div style={styles.timeRemaining}>
                <div style={styles.progressBarContainer}>
                  <div 
                    style={{
                      ...styles.progressBar,
                      width: `${100 - (calculateDaysRemaining(subscription?.endDate) / 365 * 100)}%`
                    }}
                  ></div>
                </div>
                <div style={styles.timeRemainingText}>
                  {calculateDaysRemaining(subscription?.endDate)} days remaining
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              {subscription?.status === 'active' ? (
                <>
                  <Link href="/pricing" style={{ flex: 1 }}>
                    <button style={styles.renewButton}>
                      Change Plan <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                    </button>
                  </Link>
                  <button 
                    style={styles.cancelButton}
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Subscription
                  </button>
                </>
              ) : (
                <Link href="/pricing" style={{ width: '100%' }}>
                  <button style={styles.renewButton}>
                    {subscription?.status === 'canceled' ? 'Resubscribe' : 'Reactivate Subscription'} <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Need Help?</h2>
          </div>
          
          <div style={styles.cardContent}>
            <p style={styles.helpText}>
              If you have any questions about your subscription or need assistance, 
              our team is ready to provide personalized support to ensure your SAT prep experience is seamless.
            </p>
            
            <div style={styles.contactInfo}>
              <div style={styles.contactItem}>
                <Mail size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Email</div>
                  <a href="mailto:gxalvarado2013@gmail.com" style={styles.contactValue}>
                  gxalvarado2013@gmail.com
                  </a>
                </div>
              </div>
              
              <div style={styles.contactItem}>
                <Phone size={20} style={styles.contactIcon} />
                <div>
                  <div style={styles.contactLabel}>Phone</div>
                  <a href="tel:+1-479-544-4410" style={styles.contactValue}>
                  +1-479-544-4410
                  </a>
                </div>
              </div>
            </div>
            
            <div style={styles.feedbackSection}>
              <h3 style={styles.feedbackTitle}>We Value Your Feedback</h3>
              <p style={styles.feedbackText}>
                Your feedback helps us improve our service. 
                Let us know how we can make SAT Prep Pro better for you.
              </p>
              <button 
                style={styles.secondaryButton} 
                onClick={() => setShowFeedbackModal(true)}
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render feedback modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        onSuccess={handleFeedbackSuccess}
      />
      
      {/* Render cancel subscription modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancelSubscription={handleSubscriptionCancel}
      />
    </div>
  )
}

// Main component with Suspense boundary
export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div>Loading subscription information...</div>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}

// Modal styles
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: '90%',
    maxWidth: '550px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  content: {
    padding: '24px',
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
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  successMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '32px 16px',
  },
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  content: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  infoItem: {
    flex: '1 0 calc(50% - 16px)',
    minWidth: '200px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#111827',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: 500,
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '24px 0',
  },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  timeRemainingText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'right',
  },
  timeRemaining: {
    marginTop: '24px',
    marginBottom: '24px',
  },
  renewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '24px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  contactIcon: {
    color: '#6b7280',
  },
  contactLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '2px',
  },
  contactValue: {
    fontSize: '16px',
    color: '#111827',
    textDecoration: 'none',
  },
  helpText: {
    fontSize: '16px',
    color: '#4b5563',
    margin: '0',
    lineHeight: 1.5,
  },
  feedbackSection: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  feedbackTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  feedbackText: {
    fontSize: '14px',
    color: '#4b5563',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f9fafb',
  },
  loadingSpinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f9fafb',
    padding: '0 24px',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '18px',
    color: '#ef4444',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  thankYouBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '14px',
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    fontSize: '20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#065f46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  noSubscriptionIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 20px',
    backgroundColor: 'white',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
} 