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

              <hr className={styles.separator} />

              {/* 2. Information We Collect */}
              <section id="information-we-collect" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
                <p className={styles.sectionText}>
                  We limit our data collection to what is necessary to provide you with an excellent standardized test preparation experience. Here's exactly what we collect:
                </p>

                <h3 className={styles.sectionSubtitle}>Account Information</h3>
                <p className={styles.sectionText}>When you create an account, we collect:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email Address:</strong> Used for account access and communication</li>
                  <li><strong>Password:</strong> Encrypted and securely stored</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Data and Performance Information</h3>
                <p className={styles.sectionText}>To provide personalized standardized test preparation, we collect:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Practice Session Data:</strong> Your answers to practice questions, response times, and completion status</li>
                  <li><strong>Performance Analytics:</strong> Accuracy rates, strengths/weaknesses analysis, and progress over time</li>
                  <li><strong>Study Preferences:</strong> Difficulty level selections, subject focus areas, and practice modes used</li>
                  <li><strong>AI Tutor Interactions:</strong> Questions asked to our AI tutor and explanations provided (to improve service quality)</li>
                  <li><strong>Test Results:</strong> Scores from practice exams and module performance data</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Usage and Technical Information</h3>
                <p className={styles.sectionText}>To ensure our service works properly, we automatically collect:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Usage Patterns:</strong> Features used, time spent on platform, navigation paths</li>
                  <li><strong>Session Data:</strong> Login times, duration of study sessions</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Payment Information (via Stripe)</h3>
                <p className={styles.sectionText}>For subscription management:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Billing Information:</strong> Processed securely through Stripe (we never store full payment card details)</li>
                  <li><strong>Subscription Status:</strong> Plan type, billing cycle, subscription status</li>
                  <li><strong>Transaction History:</strong> Payment confirmations and billing records</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Communications and Feedback</h3>
                <p className={styles.sectionText}>When you contact us:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Support Inquiries:</strong> Questions, technical issues, and our responses</li>
                  <li><strong>Feedback:</strong> Suggestions, bug reports, and feature requests</li>
                  <li><strong>Email Communications:</strong> Our responses to your inquiries</li>
                </ul>
              </section>

              {/* 3. How We Use Your Information */}
              <section id="how-we-use-your-information" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
                <p className={styles.sectionText}>
                  We use your information solely to provide, improve, and personalize your standardized test preparation experience:
                </p>

                <h3 className={styles.sectionSubtitle}>Service Delivery</h3>
                <ul className={styles.bulletList}>
                  <li>Provide access to practice questions, tests, and AI tutor</li>
                  <li>Generate personalized performance analytics and study recommendations</li>
                  <li>Save your progress and allow you to resume practice sessions</li>
                  <li>Deliver adaptive practice tests based on your performance level</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Account Management</h3>
                <ul className={styles.bulletList}>
                  <li>Create and maintain your user account</li>
                  <li>Process subscription payments and manage billing</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send important service notifications and updates</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Service Improvement</h3>
                <ul className={styles.bulletList}>
                  <li>Analyze usage patterns to improve question quality and difficulty calibration</li>
                  <li>Enhance AI tutor responses based on successful explanations</li>
                  <li>Identify and fix technical issues</li>
                  <li>Develop new features based on user needs</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Legal and Safety</h3>
                <ul className={styles.bulletList}>
                  <li>Comply with applicable laws and educational privacy regulations</li>
                  <li>Protect against fraud, abuse, and security threats</li>
                  <li>Enforce our Terms of Service</li>
                </ul>

                <p className={styles.sectionText}>
                  <strong>We do NOT use your educational data for advertising, marketing to third parties, or any commercial purposes beyond providing you with standardized test preparation services.</strong>
                </p>
              </section>

              <hr className={styles.separator} />

              {/* 4. Data Ownership and Your Rights */}
              <section id="data-ownership-and-your-rights" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Data Ownership and Your Rights</h2>
                <p className={styles.sectionText}>
                  <strong>You own your educational data.</strong> We are simply the custodian of your information while providing our service.
                </p>

                <h3 className={styles.sectionSubtitle}>Your Data Rights</h3>
                <p className={styles.sectionText}>You have the right to:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Access:</strong> View all information we have about you</li>
                  <li><strong>Correct:</strong> Update or fix any inaccurate information</li>
                  <li><strong>Export:</strong> Request a Download your data in a portable format</li>
                  <li><strong>Delete:</strong> Request complete removal of your account and data</li>
                  <li><strong>Restrict Processing:</strong> Limit how we use your information</li>
                  <li><strong>Object:</strong> Opt out of certain data processing activities</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>How to Exercise Your Rights</h3>
                <ul className={styles.bulletList}>
                  <li><strong>In-App:</strong> Use Account Settings to view, edit, or delete your information</li>
                  <li><strong>Email Us:</strong> Contact <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a> for assistance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Response Time</h3>
                <p className={styles.sectionText}>
                  We will respond to your requests within 30 days (or sooner as required by applicable law).
                </p>
              </section>

              <hr className={styles.separator} />

              {/* 5. Information Sharing and Third Parties */}
              <section id="information-sharing-and-third-parties" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Information Sharing and Third Parties</h2>
                <p className={styles.sectionText}>
                  We use a minimal number of carefully selected third-party service providers to operate our platform. <strong>We never sell, rent, or share your personal information for advertising or marketing purposes.</strong>
                </p>

                <h3 className={styles.sectionSubtitle}>Our Current Third-Party Service Providers</h3>

                <div className={styles.indentedSection}>
                  <h4 className={styles.sectionSubtitle}>Supabase (Authentication and Database)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>What we share:</strong> Account information, practice data, performance analytics</li>
                    <li><strong>Why:</strong> User authentication, secure data storage, and platform functionality</li>
                    <li><strong>Data Protection:</strong> Enterprise-grade security, SOC 2 Type II certified</li>
                    <li><strong>Location:</strong> Data processed in the United States</li>
                    <li><strong>Agreement:</strong> Bound by Data Processing Agreement with strict data use limitations</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Stripe (Payment Processing)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>What we share:</strong> Billing information, subscription status</li>
                    <li><strong>Why:</strong> Secure payment processing and subscription management</li>
                    <li><strong>Data Protection:</strong> PCI DSS Level 1 certified, industry-leading security</li>
                    <li><strong>Location:</strong> Data processed in the United States and European Union</li>
                    <li><strong>Agreement:</strong> Bound by Stripe's Data Processing Agreement</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>OpenAI (AI Tutor Functionality)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>What we share:</strong> Practice questions and your questions to the AI tutor (without identifying information)</li>
                    <li><strong>Why:</strong> Power our AI tutor's hints and explanations</li>
                    <li><strong>Data Protection:</strong> No personal information shared; questions anonymized</li>
                    <li><strong>Agreement:</strong> Bound by Data Processing Agreement prohibiting use for AI training</li>
                  </ul>
                </div>

                <h3 className={styles.sectionSubtitle}>Third-Party Data Use Restrictions</h3>
                <p className={styles.sectionText}>All our service providers must:</p>
                <ul className={styles.bulletList}>
                  <li>Use your information only to provide services to us</li>
                  <li>Meet or exceed our security and privacy standards</li>
                  <li>Delete your information when services are terminated</li>
                  <li>Notify us immediately of any data breaches</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Changes to Third Parties</h3>
                <p className={styles.sectionText}>
                  We will provide you with at least <strong>15 days advance notice</strong> of any changes to our third-party service providers. You can subscribe to updates by emailing us at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a>
                </p>

                <h3 className={styles.sectionSubtitle}>User Control Over Third-Party Sharing</h3>
                <p className={styles.sectionText}>You can opt out of non-essential third-party data sharing by:</p>
                <ul className={styles.bulletList}>
                  <li>Contacting us at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a> for options</li>
                </ul>
              </section>

              {/* 6. Data Security and Protection */}
              <section id="data-security-and-protection" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Data Security and Protection</h2>
                <p className={styles.sectionText}>
                  We implement comprehensive security measures to protect your information:
                </p>

                <h3 className={styles.sectionSubtitle}>Encryption</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Data in Transit:</strong> All data transmission uses TLS 1.3 encryption (minimum TLS 1.2)</li>
                  <li><strong>Data at Rest:</strong> All personally identifiable information is encrypted using AES-256 encryption</li>
                  <li><strong>Practice Content:</strong> All your questions, answers, and performance data are encrypted</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Authentication Security</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Password Protection:</strong> Supabase Auth stores passwords hashed with bcrypt and a random salt</li>
                  <li><strong>Strong Password Requirements:</strong> Configurable min length and required characters; recommends ≥8 chars</li>
                  <li><strong>Multi-Factor Authentication (MFA):</strong> Available via email-based verification codes</li>
                  <li><strong>Session Management:</strong> Secure session tokens with automatic timeout</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Infrastructure Security</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Access Controls:</strong> Restricted employee access on need-to-know basis</li>
                  <li><strong>Data Centers:</strong> Industry-standard, access-controlled facilities</li>
                  <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
                  <li><strong>Backups:</strong> Encrypted, redundant, geographically distributed backups</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Regular Security Assessments</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Third-Party Audits:</strong> Independent security assessments</li>
                  <li><strong>Vulnerability Management:</strong> Continuous monitoring and rapid patch deployment</li>
                  <li><strong>Employee Training:</strong> Regular security and privacy training for all staff</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Breach Response</h3>
                <p className={styles.sectionText}>In the unlikely event of a data breach:</p>
                <ul className={styles.bulletList}>
                  <li>We will notify affected users within 72 hours as required by law</li>
                  <li>We will provide clear information about what happened and steps we're taking</li>
                  <li>We will offer free credit monitoring services if financial information is involved</li>
                  <li>We will conduct a thorough investigation and implement additional safeguards</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 7. Data Retention and Deletion */}
              <section id="data-retention-and-deletion" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Data Retention and Deletion</h2>
                <p className={styles.sectionText}>
                  We believe you should control how long your data is stored.
                </p>

                <h3 className={styles.sectionSubtitle}>Retention Periods</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Account Data:</strong> Maintained while your account is active</li>
                  <li><strong>Practice Data:</strong> Retained to provide ongoing performance analytics</li>
                  <li><strong>Inactive Accounts:</strong> Automatically deleted after 3 years of inactivity</li>
                  <li><strong>Support Communications:</strong> Retained for 2 years for service improvement</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Complete Data Deletion</h3>
                <p className={styles.sectionText}>When you request account deletion or we delete inactive accounts:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Deletion:</strong> All your data is deleted within <strong>60 days</strong> of the request</li>
                  <li><strong>Legal Holds:</strong> Data may be retained longer if required by law or legal proceedings</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Partial Data Retention (Limited Cases)</h3>
                <p className={styles.sectionText}>We may retain anonymized, aggregated data that cannot identify you for:</p>
                <ul className={styles.bulletList}>
                  <li>Improving question difficulty and quality</li>
                  <li>Understanding learning pattern trends</li>
                  <li>Meeting legal or regulatory requirements</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>How to Delete Your Account</h3>
                <ol className={styles.numberedList}>
                  <li><strong>Email:</strong> Send deletion request to <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Confirmation:</strong> We'll confirm deletion within 7 days</li>
                </ol>
              </section>

              <hr className={styles.separator} />

              {/* 8. Cookies and Tracking Technologies */}
              <section id="cookies-and-tracking-technologies" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Cookies and Tracking Technologies</h2>
                <p className={styles.sectionText}>
                  We use cookies and similar technologies to provide and improve our service.
                </p>

                <h3 className={styles.sectionSubtitle}>Types of Cookies We Use</h3>

                <div className={styles.indentedSection}>
                  <h4 className={styles.sectionSubtitle}>Essential Cookies (Required)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>Authentication:</strong> Keep you logged in securely</li>
                    <li><strong>Preferences:</strong> Remember your study settings and difficulty preferences</li>
                    <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Functional Cookies (Optional)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>Performance:</strong> Remember your progress and continue where you left off</li>
                    <li><strong>Customization:</strong> Personalize your experience and recommendations</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Analytics Cookies (Optional)</h4>
                  <ul className={styles.bulletList}>
                    <li><strong>Usage Analytics:</strong> Understand how you use our platform (aggregated data only)</li>
                    <li><strong>Performance Monitoring:</strong> Identify and fix technical issues</li>
                  </ul>
                </div>

                <h3 className={styles.sectionSubtitle}>Third-Party Cookies</h3>
                <p className={styles.sectionText}><strong>We do not use third-party cookies for advertising or tracking.</strong> We may use analytics services that set cookies, but:</p>
                <ul className={styles.bulletList}>
                  <li>Data is aggregated and anonymized</li>
                  <li>No personal information is shared</li>
                  <li>You can opt out through your browser settings</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Cookie Control</h3>
                <p className={styles.sectionText}>You can control cookies through:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Browser Settings:</strong> Disable or delete cookies</li>
                  <li><strong>Opt-Out Links:</strong> Available in Account Settings</li>
                  <li><strong>Cookie Banner:</strong> Manage preferences on first visit</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Do Not Track</h3>
                <p className={styles.sectionText}>
                  We respect "Do Not Track" browser signals and will not track users who have enabled this setting.
                </p>
              </section>

              <hr className={styles.separator} />

              {/* 9. Advertising Policy */}
              <section id="advertising-policy" className={styles.section}>
                <h2 className={styles.sectionTitle}>9. Advertising Policy</h2>
                <p className={styles.sectionText}>
                  <strong>Brill Tutor does not display advertisements.</strong>
                </p>

                <h3 className={styles.sectionSubtitle}>No Advertising Commitment</h3>
                <ul className={styles.bulletList}>
                  <li><strong>No Third-Party Ads:</strong> We do not allow third-party advertisers or data brokers to collect information from our service</li>
                  <li><strong>No Targeted Advertising:</strong> We do not use your information to target advertisements</li>
                  <li><strong>No Ad Tracking:</strong> We do not use web beacons, pixels, or other tracking technologies for advertising purposes</li>
                  <li><strong>No Data Broker Sharing:</strong> We never share your information with advertising networks or data brokers</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Marketing Communications</h3>
                <p className={styles.sectionText}>We may send you information about:</p>
                <ul className={styles.bulletList}>
                  <li>New features and service improvements</li>
                  <li>Educational content and standardized test preparation tips</li>
                  <li>Important account and billing notifications</li>
                </ul>

                <p className={styles.sectionText}>You can opt out of marketing communications at any time through:</p>
                <ul className={styles.bulletList}>
                  <li>Email unsubscribe links</li>
                  <li>Contacting <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                </ul>
              </section>

              {/* 10. Children's Privacy (COPPA Compliance) */}
              <section id="childrens-privacy-coppa-compliance" className={styles.section}>
                <h2 className={styles.sectionTitle}>10. Children's Privacy (COPPA Compliance)</h2>
                <p className={styles.sectionText}>
                  We are committed to protecting children's privacy and comply with the Children's Online Privacy Protection Act (COPPA).
                </p>

                <h3 className={styles.sectionSubtitle}>Age Requirements</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Minimum Age:</strong> Users must be at least 13 years old</li>
                  <li><strong>Parental Consent:</strong> Users under 18 should have parental or school permission to use our service</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Collection from Children Under 13</h3>
                <p className={styles.sectionText}>We do not knowingly collect personal information from children under 13. If we discover we have collected such information:</p>
                <ul className={styles.bulletList}>
                  <li>We will delete it immediately</li>
                  <li>We will not use it for any purpose</li>
                  <li>We will implement additional safeguards to prevent future collection</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Parental Rights</h3>
                <p className={styles.sectionText}>Parents of users under 18 have the right to:</p>
                <ul className={styles.bulletList}>
                  <li>Review their child's information</li>
                  <li>Request deletion of their child's account</li>
                  <li>Opt out of certain data collection practices</li>
                  <li>Contact us about their child's privacy</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>School-Authorized Use</h3>
                <p className={styles.sectionText}>When schools provide access to students:</p>
                <ul className={styles.bulletList}>
                  <li>We act as a service provider to the school</li>
                  <li>Schools maintain control over student data</li>
                  <li>We follow school district privacy policies</li>
                  <li>Student data is used only for educational purposes</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 11. Educational Records (FERPA Compliance) */}
              <section id="educational-records-ferpa-compliance" className={styles.section}>
                <h2 className={styles.sectionTitle}>11. Educational Records (FERPA Compliance)</h2>
                <p className={styles.sectionText}>
                  When used in educational settings, Brill Tutor complies with the Family Educational Rights and Privacy Act (FERPA).
                </p>

                <h3 className={styles.sectionSubtitle}>School Official Designation</h3>
                <p className={styles.sectionText}>
                  When providing services to schools, we act as a "school official" with legitimate educational interests in student records.
                </p>

                <h3 className={styles.sectionSubtitle}>FERPA-Protected Information</h3>
                <p className={styles.sectionText}>Educational records may include:</p>
                <ul className={styles.bulletList}>
                  <li>Student practice performance and progress</li>
                  <li>Learning analytics and recommendations</li>
                  <li>Assignment completion and scores</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Use Restrictions</h3>
                <p className={styles.sectionText}>FERPA-covered student information is used only for:</p>
                <ul className={styles.bulletList}>
                  <li>Providing standardized test preparation services</li>
                  <li>Generating progress reports for educators</li>
                  <li>Improving educational outcomes</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Sharing Limitations</h3>
                <p className={styles.sectionText}>We do not share FERPA-protected information except:</p>
                <ul className={styles.bulletList}>
                  <li>With the authorizing school or district</li>
                  <li>As directed by the educational institution</li>
                  <li>As required by law or court order</li>
                  <li>In anonymized, aggregate form for service improvement</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 12. International Data Transfers (GDPR Compliance) */}
              <section id="international-data-transfers-gdpr-compliance" className={styles.section}>
                <h2 className={styles.sectionTitle}>12. International Data Transfers (GDPR Compliance)</h2>
                <p className={styles.sectionText}>
                  We comply with the General Data Protection Regulation (GDPR) and other international privacy laws.
                </p>

                <h3 className={styles.sectionSubtitle}>Legal Basis for Processing</h3>
                <p className={styles.sectionText}>We process your information based on:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Contract:</strong> To provide you with our standardized test preparation service</li>
                  <li><strong>Legitimate Interest:</strong> To improve our service and prevent fraud</li>
                  <li><strong>Consent:</strong> For optional features like analytics cookies</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>International Transfers</h3>
                <p className={styles.sectionText}>If you're located outside the United States:</p>
                <ul className={styles.bulletList}>
                  <li>Your data may be transferred to and processed in the United States</li>
                  <li>We use Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  <li>We ensure equivalent protection for your information</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>EU Resident Rights</h3>
                <p className={styles.sectionText}>If you're an EU resident, you have additional rights including:</p>
                <ul className={styles.bulletList}>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to lodge complaints with supervisory authorities</li>
                  <li>Right to withdraw consent at any time</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Protection Officer</h3>
                <p className={styles.sectionText}>For GDPR-related inquiries, contact our Data Protection Officer:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Response time:</strong> Within 30 days</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 13. Accessibility */}
              <section id="accessibility" className={styles.section}>
                <h2 className={styles.sectionTitle}>13. Accessibility</h2>
                <p className={styles.sectionText}>
                  We are committed to making our service accessible to all users.
                </p>

                <h3 className={styles.sectionSubtitle}>Accessibility Standards</h3>
                <ul className={styles.bulletList}>
                  <li><strong>WCAG 2.1 AA Compliance:</strong> We strive to meet Web Content Accessibility Guidelines</li>
                  <li><strong>Screen Reader Support:</strong> Compatible with assistive technologies</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Ongoing Improvements</h3>
                <ul className={styles.bulletList}>
                  <li>Regular accessibility audits and testing</li>
                  <li>User feedback integration for accessibility improvements</li>
                  <li>Staff training on accessibility best practices</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Accessibility Support</h3>
                <p className={styles.sectionText}>For accessibility assistance or to report barriers:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li>We will respond within 48 hours</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 14. Changes to This Privacy Policy */}
              <section id="changes-to-this-privacy-policy" className={styles.section}>
                <h2 className={styles.sectionTitle}>14. Changes to This Privacy Policy</h2>
                <p className={styles.sectionText}>
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements.
                </p>

                <h3 className={styles.sectionSubtitle}>How We Handle Changes</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Advance Notice:</strong> We will provide at least 30 days notice of material changes</li>
                  <li><strong>No Retroactive Changes:</strong> Changes will not apply retroactively to data collected under previous policies</li>
                  <li><strong>Student Data Protection:</strong> Changes affecting student data require prior notice and choice</li>
                  <li><strong>Clear Communication:</strong> We will explain changes in plain language</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Notification Methods</h3>
                <p className={styles.sectionText}>We will notify you of changes through:</p>
                <ul className={styles.bulletList}>
                  <li>Email to your registered address</li>
                  <li>Prominent notice on our website</li>
                  <li>In-app notification when you next log in</li>
                  <li>Updates to this page with revision date</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Policy History</h3>
                <ul className={styles.bulletList}>
                  <li>Previous versions of this policy are available by emailing <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li>You can view what changed between versions</li>
                  <li>All changes include effective dates and rationale</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Your Options</h3>
                <p className={styles.sectionText}>If you disagree with policy changes:</p>
                <ul className={styles.bulletList}>
                  <li>You can download your data before changes take effect</li>
                  <li>You can delete your account if you no longer wish to use our service</li>
                  <li>You can contact us to discuss your concerns</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 15. Contact Information */}
              <section id="contact-information" className={styles.section}>
                <h2 className={styles.sectionTitle}>15. Contact Information</h2>
                <p className={styles.sectionText}>
                  We're here to help with any privacy questions or concerns.
                </p>

                <h3 className={styles.sectionSubtitle}>Privacy Contact</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Response Time:</strong> Within 48 hours for privacy inquiries</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>General Contact</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Support Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Protection Officer</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>For GDPR and international privacy matters</strong></li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Emergency Contact</h3>
                <p className={styles.sectionText}>For urgent security or privacy issues:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Available 24/7 for critical issues</strong></li>
                </ul>
              </section>

              <hr className={styles.separator} />

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
