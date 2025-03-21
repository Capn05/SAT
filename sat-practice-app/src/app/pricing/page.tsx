'use client';

import { useEffect } from 'react';
import StripePayment from '../../components/StripePayment';
import styles from './pricing.module.css';

export default function PricingPage() {
  useEffect(() => {
    // Check if user came from a redirect after login with a selected plan
    if (typeof window !== 'undefined') {
      const selectedPlan = localStorage.getItem('selectedPlan');
      console.log('Selected plan from localStorage:', selectedPlan);
      
      if (selectedPlan) {
        // Clear the selected plan from local storage
        localStorage.removeItem('selectedPlan');
        
        // Find the button for the selected plan and click it
        const planButton = document.getElementById(`${selectedPlan}-plan-button`);
        console.log('Found plan button:', planButton);
        
        if (planButton) {
          console.log('Clicking plan button');
          planButton.click();
        }
      }
    }
  }, []);

  return (
    <div className={styles.pricingSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            Simple, Transparent <span className={styles.headerTitleHighlight}>Pricing</span>
          </h2>
          <p className={styles.headerDescription}>
            Full access to all features with either plan. Choose what works for your preparation timeline.
          </p>
        </div>
        
        <div className={styles.pricingGrid}>
          {/* Monthly Plan */}
          <div className={styles.planCard}>
            <div className={styles.planContent}>
              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Monthly Plan</h3>
                <span className={styles.planTag}>Flexible</span>
              </div>
              
              <div className={styles.pricingDetail}>
                <div className={styles.price}>
                  <span className={styles.priceAmount}>$29</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                <p className={styles.priceSubtext}>Cancel anytime</p>
              </div>
              
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>2,000+ SAT practice questions</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>15+ full-length adaptive practice exams</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>AI tutor with hints and explanations</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>Performance analytics dashboard</span>
                </li>
              </ul>
              
              <StripePayment
                id="monthly-plan-button"
                planType="monthly"
                buttonText="Start Monthly Plan"
                className={styles.monthlyButton}
              />
            </div>
          </div>
          
          {/* 3-Month Plan - Featured Plan */}
          <div className={`${styles.planCard} ${styles.featuredPlan}`}>
            {/* Best value tag */}
            <div className={styles.saveTag}>
              <div className={styles.saveTagContent}>
                SAVE 17%
              </div>
            </div>
            
            <div className={styles.planContent}>
              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>3-Month Plan</h3>
                <span className={`${styles.planTag} ${styles.bestValueTag}`}>BEST VALUE</span>
              </div>
              
              <div className={styles.pricingDetail}>
                <div className={styles.price}>
                  <span className={styles.priceAmount}>$24</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                <div className={styles.billingInfo}>
                  <p className={styles.priceSubtext}>$72 billed every 3 months</p>
                  <span className={styles.originalPrice}>$174</span>
                </div>
              </div>
              
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>2,000+ SAT practice questions</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>15+ full-length adaptive practice exams</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>AI tutor with hints and explanations</span>
                </li>
                <li className={styles.featureItem}>
                  <svg className={styles.featureIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className={styles.featureText}>Performance analytics dashboard</span>
                </li>
              </ul>
              
              <StripePayment
                id="quarterly-plan-button"
                planType="quarterly"
                buttonText="Save With 3-Month Plan"
                className={styles.quarterlyButton}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 