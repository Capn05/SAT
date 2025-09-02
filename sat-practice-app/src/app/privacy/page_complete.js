'use client';

import styles from './privacy.module.css';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* Back to Home Button */}
      <div className={styles.backButtonContainer}>
        <div className={styles.backButtonInner}>
          <button 
            onClick={() => window.location.href = '/'}
            className={styles.backButton}
          >
            <svg className={styles.backButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.contentContainer}>
          <div className={styles.contentCard}>
            {/* Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>
                Brill Tutor Privacy Policy
              </h1>
              <p className={styles.subtitle}>
                <strong>Last Updated:</strong> September 1, 2025<br />
                <strong>Effective Date:</strong> September 1, 2025
              </p>
            </div>

            <div className={styles.content}>
              <hr className={styles.separator} />

              {/* Table of Contents */}
              <div className={styles.tableOfContents}>
                <h2 className={styles.sectionTitle}>Table of Contents</h2>
                <ol>
                  <li><a href="#introduction">Introduction</a></li>
                  <li><a href="#information-we-collect">Information We Collect</a></li>
                  <li><a href="#how-we-use-your-information">How We Use Your Information</a></li>
                  <li><a href="#data-ownership-and-your-rights">Data Ownership and Your Rights</a></li>
                  <li><a href="#information-sharing-and-third-parties">Information Sharing and Third Parties</a></li>
                  <li><a href="#data-security-and-protection">Data Security and Protection</a></li>
                  <li><a href="#data-retention-and-deletion">Data Retention and Deletion</a></li>
                  <li><a href="#cookies-and-tracking-technologies">Cookies and Tracking Technologies</a></li>
                  <li><a href="#advertising-policy">Advertising Policy</a></li>
                  <li><a href="#childrens-privacy-coppa-compliance">Children's Privacy (COPPA Compliance)</a></li>
                  <li><a href="#educational-records-ferpa-compliance">Educational Records (FERPA Compliance)</a></li>
                  <li><a href="#international-data-transfers-gdpr-compliance">International Data Transfers (GDPR Compliance)</a></li>
                  <li><a href="#accessibility">Accessibility</a></li>
                  <li><a href="#changes-to-this-privacy-policy">Changes to This Privacy Policy</a></li>
                  <li><a href="#contact-information">Contact Information</a></li>
                </ol>
              </div>

              <hr className={styles.separator} />

              {/* 1. Introduction */}
              <section id="introduction" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Introduction</h2>
                <p className={styles.sectionText}>
                  Welcome to Brill Tutor, an AI-powered standardized test preparation platform. This Privacy Policy explains how Brill Tutor ("we," "our," or "us") collects, uses, protects, and shares information when you use our standardized test preparation service (the "Service").
                </p>
                <p className={styles.sectionText}>
                  <strong>We are committed to protecting your privacy and ensuring you own and control your educational data.</strong> This policy describes our practices in clear, understandable language and explains your rights regarding your information.
                </p>
                <p className={styles.sectionText}>Our Service provides:</p>
                <ul className={styles.bulletList}>
                  <li>2,000+ standardized test practice questions across Math and Reading & Writing</li>
                  <li>15+ full-length adaptive practice exams</li>
                  <li>AI tutor assistance with personalized hints and explanations</li>
                  <li>Performance analytics and progress tracking</li>
                  <li>Targeted skills practice and quick practice modes</li>
                </ul>
              </section>

              {/* Footer */}
              <div className={styles.footer}>
                <p className={styles.sectionText}>
                  <strong>© 2025 Brill Tutor, Inc. All Rights Reserved.</strong>
                </p>
                <p className={styles.sectionText}>
                  This Privacy Policy is effective as of September 1, 2025. For questions about this policy or our privacy practices, please contact us at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
