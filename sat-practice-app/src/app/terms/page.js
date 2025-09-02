'use client';

import styles from './terms.module.css';

export default function TermsOfUsePage() {
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

      {/* Terms of Use Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.contentContainer}>
          <div className={styles.contentCard}>
            {/* Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>
                Brill Tutor Terms of Use
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
                  <li><a href="#acceptance-of-terms">Acceptance of Terms</a></li>
                  <li><a href="#description-of-service">Description of Service</a></li>
                  <li><a href="#eligibility-and-account-registration">Eligibility and Account Registration</a></li>
                  <li><a href="#subscription-plans-and-billing">Subscription Plans and Billing</a></li>
                  <li><a href="#user-conduct-and-prohibited-uses">User Conduct and Prohibited Uses</a></li>
                  <li><a href="#educational-content-and-accuracy">Educational Content and Accuracy</a></li>
                  <li><a href="#intellectual-property-rights">Intellectual Property Rights</a></li>
                  <li><a href="#privacy-and-data-protection">Privacy and Data Protection</a></li>
                  <li><a href="#ai-tutor-features-and-limitations">AI Tutor Features and Limitations</a></li>
                  <li><a href="#service-availability-and-technical-requirements">Service Availability and Technical Requirements</a></li>
                  <li><a href="#limitation-of-liability">Limitation of Liability</a></li>
                  <li><a href="#indemnification">Indemnification</a></li>
                  <li><a href="#termination-of-service">Termination of Service</a></li>
                  <li><a href="#changes-to-these-terms">Changes to These Terms</a></li>
                  <li><a href="#governing-law-and-dispute-resolution">Governing Law and Dispute Resolution</a></li>
                  <li><a href="#contact-information">Contact Information</a></li>
                </ol>
              </div>

              <hr className={styles.separator} />

              {/* 1. Acceptance of Terms */}
              <section id="acceptance-of-terms" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
                <p className={styles.sectionText}>
                  By accessing or using Brill Tutor's standardized test preparation platform (the "Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use our Service.
                </p>

                <h3 className={styles.sectionSubtitle}>Who These Terms Apply To</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Individual Users:</strong> Students and parents who create personal accounts</li>
                  <li><strong>Educational Institutions:</strong> Schools and districts that provide access to students</li>
                  <li><strong>Minors:</strong> Users under 18 must have parental consent or school authorization</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Agreement to Terms</h3>
                <p className={styles.sectionText}>Your use of the Service constitutes acceptance of:</p>
                <ul className={styles.bulletList}>
                  <li>These Terms of Use</li>
                  <li>Our Privacy Policy (incorporated by reference)</li>
                  <li>Any additional policies referenced herein</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Updates to Agreement</h3>
                <p className={styles.sectionText}>
                  We may modify these Terms as described in Section 14. Continued use of the Service after changes constitutes acceptance of new Terms.
                </p>
              </section>

              {/* 2. Description of Service */}
              <section id="description-of-service" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Description of Service</h2>
                <p className={styles.sectionText}>
                  Brill Tutor is an AI-powered standardized test preparation platform designed to help students improve their standardized test scores through personalized practice and instruction.
                </p>

                <h3 className={styles.sectionSubtitle}>Core Features</h3>
                <ul className={styles.bulletList}>
                  <li><strong>2,000+ Practice Questions:</strong> Covering Math and Reading & Writing sections</li>
                  <li><strong>15+ Full-Length Practice Tests:</strong> Adaptive exams that mirror the real standardized test experience</li>
                  <li><strong>AI Tutor "Brill":</strong> Personalized hints, explanations, and study guidance</li>
                  <li><strong>Performance Analytics:</strong> Detailed progress tracking and weakness identification</li>
                  <li><strong>Multiple Practice Modes:</strong>
                    <ul className={styles.bulletList}>
                      <li>Quick Practice (random questions of preferred difficulty)</li>
                      <li>Skills Practice (targeted by topic)</li>
                      <li>Timed Practice Tests (full exam simulation)</li>
                    </ul>
                  </li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Purpose</h3>
                <p className={styles.sectionText}>Our Service is designed exclusively for:</p>
                <ul className={styles.bulletList}>
                  <li>Standardized test preparation and study</li>
                  <li>Educational skill development</li>
                  <li>Academic progress tracking</li>
                  <li>Learning enhancement through AI assistance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Service Limitations</h3>
                <p className={styles.sectionText}>Please note that our Service:</p>
                <ul className={styles.bulletList}>
                  <li>Provides practice materials but is not affiliated with College Board</li>
                  <li>Cannot guarantee specific standardized test score improvements</li>
                  <li>Is not a substitute for professional educational advice</li>
                </ul>
              </section>

              {/* 3. Eligibility and Account Registration */}
              <section id="eligibility-and-account-registration" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Eligibility and Account Registration</h2>

                <h3 className={styles.sectionSubtitle}>Age and Eligibility Requirements</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Minimum Age:</strong> 13 years old (COPPA compliance)</li>
                  <li><strong>Under 18:</strong> Must have parental consent or school authorization</li>
                  <li><strong>Accuracy:</strong> You must provide accurate, current information during registration</li>
                  <li><strong>One Account:</strong> Each user may maintain only one active account</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Account Responsibilities</h3>
                <p className={styles.sectionText}>You are responsible for:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Security:</strong> Maintaining confidentiality of your login credentials</li>
                  <li><strong>Accuracy:</strong> Keeping your account information current and accurate</li>
                  <li><strong>Activity:</strong> All activity that occurs under your account</li>
                  <li><strong>Compliance:</strong> Using the Service in accordance with these Terms</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Account Verification</h3>
                <p className={styles.sectionText}>We may require verification of:</p>
                <ul className={styles.bulletList}>
                  <li>Email address through confirmation links</li>
                  <li>Identity for billing and security purposes</li>
                  <li>Parental consent for users under 18</li>
                  <li>School authorization for student accounts</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Prohibited Account Actions</h3>
                <p className={styles.sectionText}>You may not:</p>
                <ul className={styles.bulletList}>
                  <li>Create multiple accounts to circumvent restrictions</li>
                  <li>Share your account with others</li>
                  <li>Use automated tools to create accounts</li>
                  <li>Provide false information during registration</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 4. Subscription Plans and Billing */}
              <section id="subscription-plans-and-billing" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Subscription Plans and Billing</h2>

                <h3 className={styles.sectionSubtitle}>Subscription Options</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Monthly Plan:</strong> Month-to-month subscription with monthly billing</li>
                  <li><strong>Quarterly Plan:</strong> Three-month subscription with quarterly billing</li>
                  <li><strong>Enterprise Deals:</strong> Contact us for more info</li>
                  <li><strong>Free Trial:</strong> Limited-time free access to full features (new users only)</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Billing and Payment</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Payment Processing:</strong> Handled securely through Stripe</li>
                  <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless canceled</li>
                  <li><strong>Price Changes:</strong> We will provide 30 days notice of any price increases</li>
                  <li><strong>Taxes:</strong> You are responsible for applicable taxes</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Free Trial Terms</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Duration:</strong> 7-day free trial for new users</li>
                  <li><strong>Full Access:</strong> Complete access to all features during trial</li>
                  <li><strong>Cancellation:</strong> Cancel anytime during trial to avoid charges</li>
                  <li><strong>Conversion:</strong> Automatically converts to paid plan if not canceled</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Cancellation and Refunds</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Cancellation:</strong> Cancel anytime through Account Settings or by contacting support</li>
                  <li><strong>Access Period:</strong> Maintain access through current billing period after cancellation</li>
                  <li><strong>Refund Policy:</strong>
                    <ul className={styles.bulletList}>
                      <li>No refunds for partial months</li>
                      <li>Refunds may be provided at our discretion for technical issues</li>
                      <li>Educational institutions may have different refund terms</li>
                    </ul>
                  </li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Payment Failures</h3>
                <p className={styles.sectionText}>If payment fails:</p>
                <ul className={styles.bulletList}>
                  <li>We will attempt to process payment multiple times</li>
                  <li>Your account may be suspended after 7 days</li>
                  <li>You will receive email notifications about payment issues</li>
                  <li>Account will be deleted after 30 days of non-payment</li>
                </ul>
              </section>

              {/* 5. User Conduct and Prohibited Uses */}
              <section id="user-conduct-and-prohibited-uses" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. User Conduct and Prohibited Uses</h2>

                <h3 className={styles.sectionSubtitle}>Acceptable Use</h3>
                <p className={styles.sectionText}>You agree to use the Service only for:</p>
                <ul className={styles.bulletList}>
                  <li>Personal standardized test preparation and study</li>
                  <li>Educational purposes as intended</li>
                  <li>Lawful activities in compliance with applicable laws</li>
                  <li>Activities that do not harm other users or our Service</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Prohibited Activities</h3>
                <p className={styles.sectionText}>You may NOT:</p>

                <div className={styles.indentedSection}>
                  <h4 className={styles.sectionSubtitle}>Academic Integrity Violations</h4>
                  <ul className={styles.bulletList}>
                    <li>Use the Service during actual standardized test examinations</li>
                    <li>Create or distribute answer keys or shortcuts</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Technical Violations</h4>
                  <ul className={styles.bulletList}>
                    <li>Attempt to hack, breach, or compromise our security</li>
                    <li>Use automated tools, bots, or scrapers to access content</li>
                    <li>Reverse engineer or decompile our software</li>
                    <li>Interfere with other users' access to the Service</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Content Violations</h4>
                  <ul className={styles.bulletList}>
                    <li>Upload malicious software or harmful content</li>
                    <li>Share inappropriate, offensive, or illegal material</li>
                    <li>Violate intellectual property rights</li>
                    <li>Impersonate others or provide false information</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Commercial Violations</h4>
                  <ul className={styles.bulletList}>
                    <li>Resell, redistribute, or commercialize our content</li>
                    <li>Use the Service for competing educational businesses</li>
                    <li>Extract content for commercial purposes</li>
                    <li>Violate our intellectual property rights</li>
                  </ul>
                </div>

                <h3 className={styles.sectionSubtitle}>Consequences of Violations</h3>
                <p className={styles.sectionText}>Violation of these Terms may result in:</p>
                <ul className={styles.bulletList}>
                  <li>Warning and account restriction</li>
                  <li>Temporary or permanent account suspension</li>
                  <li>Legal action for serious violations</li>
                  <li>Termination without refund</li>
                </ul>
              </section>

              {/* 6. Educational Content and Accuracy */}
              <section id="educational-content-and-accuracy" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Educational Content and Accuracy</h2>

                <h3 className={styles.sectionSubtitle}>Content Standards</h3>
                <p className={styles.sectionText}>We strive to provide:</p>
                <ul className={styles.bulletList}>
                  <li><strong>High-Quality Questions:</strong> Modeled after official standardized test format and content</li>
                  <li><strong>Accurate Explanations:</strong> Detailed solutions and learning guidance</li>
                  <li><strong>Current Standards:</strong> Updated to reflect current standardized test requirements</li>
                  <li><strong>Comprehensive Coverage:</strong> All tested topics and skill areas</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>No Guarantee of Accuracy</h3>
                <p className={styles.sectionText}>While we work to ensure accuracy:</p>
                <ul className={styles.bulletList}>
                  <li>Content may contain errors or become outdated</li>
                  <li>We are not liable for any inaccuracies</li>
                  <li>Users should verify information with official sources</li>
                  <li>Practice scores may not predict actual standardized test performance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Score Improvement Disclaimer</h3>
                <p className={styles.sectionText}>
                  <strong>We do not guarantee standardized test score improvements.</strong> Results depend on:
                </p>
                <ul className={styles.bulletList}>
                  <li>Individual student effort and study habits</li>
                  <li>Starting skill level and academic background</li>
                  <li>Amount and consistency of practice</li>
                  <li>Use of additional study resources</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Official Standardized Test Information</h3>
                <ul className={styles.bulletList}>
                  <li>We are not affiliated with College Board</li>
                  <li>Official standardized test information should be obtained from collegeboard.org</li>
                  <li>Our Service provides practice, not official testing</li>
                  <li>Registration for actual standardized test exams must be done through College Board</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 7. Intellectual Property Rights */}
              <section id="intellectual-property-rights" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Intellectual Property Rights</h2>

                <h3 className={styles.sectionSubtitle}>Our Intellectual Property</h3>
                <p className={styles.sectionText}>Brill Tutor owns all rights to:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Practice Questions:</strong> Original questions created by our educational team</li>
                  <li><strong>AI Tutor Technology:</strong> Proprietary algorithms and responses</li>
                  <li><strong>Platform Software:</strong> All code, design, and functionality</li>
                  <li><strong>Educational Content:</strong> Explanations, analytics, and study materials</li>
                  <li><strong>Trademarks:</strong> "Brill Tutor," logos, and brand elements</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Your License to Use Content</h3>
                <p className={styles.sectionText}>We grant you a limited, personal, non-exclusive license to:</p>
                <ul className={styles.bulletList}>
                  <li>Access and use our Service for standardized test preparation</li>
                  <li>View and interact with our educational content</li>
                  <li>Print practice questions for personal study (not for redistribution)</li>
                  <li>Use our AI tutor for learning assistance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Restrictions on Use</h3>
                <p className={styles.sectionText}>You may NOT:</p>
                <ul className={styles.bulletList}>
                  <li>Copy, reproduce, or distribute our content</li>
                  <li>Create derivative works based on our materials</li>
                  <li>Remove copyright or proprietary notices</li>
                  <li>Use our content for commercial purposes</li>
                  <li>Share login credentials to allow others access</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>User-Generated Content</h3>
                <p className={styles.sectionText}>If you provide feedback, suggestions, or content:</p>
                <ul className={styles.bulletList}>
                  <li>You grant us permission to use it to improve our Service</li>
                  <li>We may incorporate your ideas without compensation</li>
                  <li>You retain ownership of any personal information</li>
                  <li>We will credit contributions when appropriate</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Copyright Infringement</h3>
                <p className={styles.sectionText}>If you believe our Service infringes your copyright:</p>
                <ul className={styles.bulletList}>
                  <li>Send a DMCA notice to <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li>Include all required information per DMCA guidelines</li>
                  <li>We will respond promptly to valid infringement claims</li>
                  <li>Repeat infringers will have accounts terminated</li>
                </ul>
              </section>

              {/* 8. Privacy and Data Protection */}
              <section id="privacy-and-data-protection" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Privacy and Data Protection</h2>

                <h3 className={styles.sectionSubtitle}>Privacy Policy Integration</h3>
                <p className={styles.sectionText}>Your privacy is governed by our comprehensive Privacy Policy, which:</p>
                <ul className={styles.bulletList}>
                  <li>Explains what information we collect and how we use it</li>
                  <li>Describes your rights and controls over your data</li>
                  <li>Details our security measures and data protection practices</li>
                  <li>Provides contact information for privacy-related questions</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Key Privacy Commitments</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Data Ownership:</strong> You own your educational data</li>
                  <li><strong>Limited Collection:</strong> We collect only what's necessary for our Service</li>
                  <li><strong>No Advertising:</strong> We don't use your data for advertising or sell it to others</li>
                  <li><strong>Strong Security:</strong> Industry-leading encryption and protection measures</li>
                  <li><strong>Regulatory Compliance:</strong> COPPA, FERPA, and GDPR compliant</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Privacy</h3>
                <p className={styles.sectionText}>For school-based users:</p>
                <ul className={styles.bulletList}>
                  <li>We act as a service provider to educational institutions</li>
                  <li>Student data is used only for educational purposes</li>
                  <li>Schools maintain control over student information</li>
                  <li>FERPA protections apply to educational records</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Retention and Deletion</h3>
                <p className={styles.sectionText}>
                  For active accounts, we retain your data as necessary to provide our Service. When you delete your account, we remove your data within 60 days of deletion. Some data may be retained longer if required by law or legal obligations. You maintain control over your data and can request data deletion at any time by contacting us.
                </p>
              </section>

              <hr className={styles.separator} />

              {/* 9. AI Tutor Features and Limitations */}
              <section id="ai-tutor-features-and-limitations" className={styles.section}>
                <h2 className={styles.sectionTitle}>9. AI Tutor Features and Limitations</h2>

                <h3 className={styles.sectionSubtitle}>AI Tutor Capabilities</h3>
                <p className={styles.sectionText}>Our AI tutor "Brill" can:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Provide Hints:</strong> Offer guidance without giving direct answers</li>
                  <li><strong>Explain Solutions:</strong> Break down problem-solving approaches</li>
                  <li><strong>Identify Patterns:</strong> Help you understand common question types</li>
                  <li><strong>Personalize Learning:</strong> Adapt responses to your skill level</li>
                  <li><strong>Answer Questions:</strong> Respond to general standardized test preparation inquiries</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>AI Limitations and Disclaimers</h3>
                <p className={styles.sectionText}>Please understand that our AI tutor:</p>
                <ul className={styles.bulletList}>
                  <li><strong>May Make Errors:</strong> AI-generated content can be inaccurate</li>
                  <li><strong>Provides Guidance Only:</strong> Not a substitute for human instruction</li>
                  <li><strong>Has Knowledge Limits:</strong> May not know about very recent changes</li>
                  <li><strong>Requires Verification:</strong> Always double-check important information</li>
                  <li><strong>Is Continuously Improving:</strong> Responses improve over time with updates</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Responsible AI Use</h3>
                <ul className={styles.bulletList}>
                  <li>Use AI assistance as a learning tool, not a shortcut</li>
                  <li>Verify important information with official sources</li>
                  <li>Don't rely solely on AI for test preparation</li>
                  <li>Report errors or inappropriate responses to help us improve</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>AI Data Usage</h3>
                <p className={styles.sectionText}>When you interact with our AI tutor:</p>
                <ul className={styles.bulletList}>
                  <li>Conversations may be analyzed to improve responses</li>
                  <li>Personal information is not shared with AI providers</li>
                  <li>Questions are anonymized before processing</li>
                  <li>You can opt out of AI features in Account Settings</li>
                </ul>
              </section>

              {/* 10. Service Availability and Technical Requirements */}
              <section id="service-availability-and-technical-requirements" className={styles.section}>
                <h2 className={styles.sectionTitle}>10. Service Availability and Technical Requirements</h2>

                <h3 className={styles.sectionSubtitle}>Service Availability</h3>
                <p className={styles.sectionText}>We strive to provide:</p>
                <ul className={styles.bulletList}>
                  <li><strong>24/7 Access:</strong> Service available around the clock</li>
                  <li><strong>High Uptime:</strong> Target 99.5% availability</li>
                  <li><strong>Global Access:</strong> Available worldwide with internet connection</li>
                  <li><strong>Mobile Compatibility:</strong> Works on phones, tablets, and computers</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Planned Maintenance</h3>
                <ul className={styles.bulletList}>
                  <li>Scheduled maintenance will be announced in advance</li>
                  <li>Updates may require brief service interruptions</li>
                  <li>Critical security updates may be applied immediately</li>
                  <li>We will minimize disruption to your study schedule</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Technical Requirements</h3>
                <p className={styles.sectionText}>To use our Service effectively, you need:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Internet Connection:</strong> Stable broadband connection recommended</li>
                  <li><strong>Modern Browser:</strong> Chrome, Firefox, Safari, or Edge (recent versions)</li>
                  <li><strong>JavaScript Enabled:</strong> Required for interactive features</li>
                  <li><strong>Cookies Enabled:</strong> Necessary for account functionality</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Technical Support</h3>
                <p className={styles.sectionText}>If you experience technical issues:</p>
                <ul className={styles.bulletList}>
                  <li>Contact <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a> for assistance</li>
                  <li>We aim to respond to support requests within 24 hours</li>
                  <li>Emergency issues receive priority response</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Service Interruptions</h3>
                <p className={styles.sectionText}>We are not liable for:</p>
                <ul className={styles.bulletList}>
                  <li>Internet service provider outages</li>
                  <li>Third-party service disruptions</li>
                  <li>Force majeure events beyond our control</li>
                  <li>Planned maintenance during announced windows</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 11. Limitation of Liability */}
              <section id="limitation-of-liability" className={styles.section}>
                <h2 className={styles.sectionTitle}>11. Limitation of Liability</h2>

                <h3 className={styles.sectionSubtitle}>Educational Service Nature</h3>
                <p className={styles.sectionText}>
                  Brill Tutor is an educational preparation service. We provide practice materials and study tools but cannot guarantee specific outcomes or standardized test score improvements.
                </p>

                <h3 className={styles.sectionSubtitle}>Limitation of Damages</h3>
                <p className={styles.sectionText}>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>

                <div className={styles.indentedSection}>
                  <h4 className={styles.sectionSubtitle}>No Consequential Damages</h4>
                  <p className={styles.sectionText}>We are not liable for:</p>
                  <ul className={styles.bulletList}>
                    <li>Lost profits or business opportunities</li>
                    <li>Emotional distress or disappointment</li>
                    <li>Missed educational opportunities</li>
                    <li>Consequential or punitive damages</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Maximum Liability</h4>
                  <p className={styles.sectionText}>Our total liability to you is limited to:</p>
                  <ul className={styles.bulletList}>
                    <li>The amount you paid for the Service in the 12 months before the claim</li>
                    <li>$100, whichever is greater</li>
                    <li>Direct damages only (not indirect or consequential)</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Exclusions</h4>
                  <p className={styles.sectionText}>We are not liable for damages caused by:</p>
                  <ul className={styles.bulletList}>
                    <li>Your violation of these Terms</li>
                    <li>Third-party actions or services</li>
                    <li>Events beyond our reasonable control</li>
                    <li>Your failure to follow instructions or recommendations</li>
                  </ul>
                </div>

                <h3 className={styles.sectionSubtitle}>Educational Results Disclaimer</h3>
                <ul className={styles.bulletList}>
                  <li><strong>No Score Guarantees:</strong> We cannot guarantee standardized test score improvements</li>
                  <li><strong>Individual Results Vary:</strong> Effectiveness depends on many factors</li>
                  <li><strong>Supplemental Tool:</strong> Our Service should supplement other study methods</li>
                  <li><strong>Professional Advice:</strong> Consult educators for personalized guidance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Service Accuracy</h3>
                <p className={styles.sectionText}>While we strive for accuracy:</p>
                <ul className={styles.bulletList}>
                  <li>Content may contain errors or become outdated</li>
                  <li>Practice scores may not predict actual performance</li>
                  <li>AI responses may be incorrect or incomplete</li>
                  <li>Users should verify information with official sources</li>
                </ul>
              </section>

              {/* 12. Indemnification */}
              <section id="indemnification" className={styles.section}>
                <h2 className={styles.sectionTitle}>12. Indemnification</h2>

                <h3 className={styles.sectionSubtitle}>Your Indemnification Obligations</h3>
                <p className={styles.sectionText}>
                  You agree to defend, indemnify, and hold harmless Brill Tutor, its officers, directors, employees, and agents from any claims, damages, or expenses arising from:
                </p>
                <ul className={styles.bulletList}>
                  <li><strong>Your Violation:</strong> Breach of these Terms or applicable laws</li>
                  <li><strong>Your Content:</strong> Any content you submit or share through the Service</li>
                  <li><strong>Your Conduct:</strong> Improper use of the Service or harm to other users</li>
                  <li><strong>Third-Party Claims:</strong> Claims by others based on your actions</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Scope of Indemnification</h3>
                <p className={styles.sectionText}>This includes:</p>
                <ul className={styles.bulletList}>
                  <li>Legal fees and court costs</li>
                  <li>Settlement amounts and judgments</li>
                  <li>Regulatory fines or penalties</li>
                  <li>Other reasonable expenses</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Cooperation</h3>
                <p className={styles.sectionText}>If a claim arises:</p>
                <ul className={styles.bulletList}>
                  <li>We will notify you promptly</li>
                  <li>You will cooperate fully in the defense</li>
                  <li>We reserve the right to assume control of defense</li>
                  <li>You will not settle without our written consent</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Exceptions</h3>
                <p className={styles.sectionText}>You are not required to indemnify us for:</p>
                <ul className={styles.bulletList}>
                  <li>Our gross negligence or willful misconduct</li>
                  <li>Claims arising from our violation of these Terms</li>
                  <li>Issues caused by our Service defects or failures</li>
                  <li>Matters covered by our insurance</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 13. Termination of Service */}
              <section id="termination-of-service" className={styles.section}>
                <h2 className={styles.sectionTitle}>13. Termination of Service</h2>

                <h3 className={styles.sectionSubtitle}>Termination by You</h3>
                <p className={styles.sectionText}>You may terminate your account at any time by:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email Request:</strong> Contact <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Cancellation:</strong> Cancel subscription to stop billing (account remains active until period end)</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Termination by Us</h3>
                <p className={styles.sectionText}>We may terminate your account if:</p>
                <ul className={styles.bulletList}>
                  <li>You violate these Terms or our policies</li>
                  <li>You engage in prohibited activities</li>
                  <li>Your account remains inactive for over 3 years</li>
                  <li>We discontinue the Service (with reasonable notice)</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Effect of Termination</h3>
                <p className={styles.sectionText}>Upon termination:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Access Ends:</strong> You lose access to the Service</li>
                  <li><strong>Data Deletion:</strong> Your data will be deleted within 60 days</li>
                  <li><strong>Billing Stops:</strong> No future charges (no refunds for unused periods)</li>
                  <li><strong>Survival:</strong> Certain Terms survive termination (intellectual property, limitation of liability)</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Data Export Before Termination</h3>
                <p className={styles.sectionText}>Before terminating your account:</p>
                <ul className={styles.bulletList}>
                  <li>Export your progress data using Account Settings</li>
                  <li>Download any content you wish to keep</li>
                  <li>Save important analytics or reports</li>
                  <li>Request data export assistance if needed</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Institution Termination</h3>
                <p className={styles.sectionText}>For school-based accounts:</p>
                <ul className={styles.bulletList}>
                  <li>Schools can terminate student access at any time</li>
                  <li>Student data is handled according to school district policies</li>
                  <li>Individual students cannot override school termination</li>
                  <li>Data may be transferred back to the school upon request</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* 14. Changes to These Terms */}
              <section id="changes-to-these-terms" className={styles.section}>
                <h2 className={styles.sectionTitle}>14. Changes to These Terms</h2>

                <h3 className={styles.sectionSubtitle}>How We Update Terms</h3>
                <p className={styles.sectionText}>We may modify these Terms to:</p>
                <ul className={styles.bulletList}>
                  <li>Reflect changes in our Service or features</li>
                  <li>Comply with new laws or regulations</li>
                  <li>Improve clarity or address user feedback</li>
                  <li>Update contact information or business details</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Notice of Changes</h3>
                <p className={styles.sectionText}>We will provide notice of material changes through:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email Notification:</strong> Sent to your registered email address</li>
                  <li><strong>In-App Notice:</strong> Prominent notification when you log in</li>
                  <li><strong>Website Posting:</strong> Updated Terms posted at brilltutor.com</li>
                  <li><strong>Advance Notice:</strong> At least 30 days for material changes</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Your Options</h3>
                <p className={styles.sectionText}>If you don't agree with changes:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Export Data:</strong> Download your information before changes take effect</li>
                  <li><strong>Cancel Service:</strong> Terminate your account before changes apply</li>
                  <li><strong>Contact Us:</strong> Discuss specific concerns at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Continue Use:</strong> Using the Service after changes means acceptance</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Data Protection</h3>
                <p className={styles.sectionText}>For changes affecting student data or educational records:</p>
                <ul className={styles.bulletList}>
                  <li>Schools will receive advance notice and choice options</li>
                  <li>Changes will not apply retroactively to existing educational data</li>
                  <li>Students and parents can opt out of new data uses</li>
                  <li>We will provide clear explanations of changes</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Terms History</h3>
                <ul className={styles.bulletList}>
                  <li>Previous versions available at brilltutor.com/terms-history</li>
                  <li>Change log shows what was modified and when</li>
                  <li>Effective dates clearly marked for each version</li>
                  <li>You can review changes before they take effect</li>
                </ul>
              </section>

              {/* 15. Governing Law and Dispute Resolution */}
              <section id="governing-law-and-dispute-resolution" className={styles.section}>
                <h2 className={styles.sectionTitle}>15. Governing Law and Dispute Resolution</h2>

                <h3 className={styles.sectionSubtitle}>Governing Law</h3>
                <p className={styles.sectionText}>These Terms are governed by:</p>
                <ul className={styles.bulletList}>
                  <li><strong>State Law:</strong> Laws of the State of California</li>
                  <li><strong>Federal Law:</strong> Applicable United States federal laws</li>
                  <li><strong>Jurisdiction:</strong> California state and federal courts</li>
                  <li><strong>Conflicts:</strong> California law controls regardless of conflict of laws principles</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Dispute Resolution Process</h3>

                <div className={styles.indentedSection}>
                  <h4 className={styles.sectionSubtitle}>Step 1: Direct Communication</h4>
                  <p className={styles.sectionText}>Before formal proceedings:</p>
                  <ul className={styles.bulletList}>
                    <li>Contact us at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a> to discuss the issue</li>
                    <li>We will work in good faith to resolve disputes</li>
                    <li>Most issues can be resolved through direct communication</li>
                    <li>We aim to respond to disputes within 10 business days</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Step 2: Mediation</h4>
                  <p className={styles.sectionText}>If direct communication doesn't resolve the issue:</p>
                  <ul className={styles.bulletList}>
                    <li>Either party may request mediation</li>
                    <li>We will use a mutually agreed upon mediator</li>
                    <li>Mediation costs will be shared equally</li>
                    <li>Mediation is non-binding but encouraged</li>
                  </ul>

                  <h4 className={styles.sectionSubtitle}>Step 3: Binding Arbitration</h4>
                  <p className={styles.sectionText}>For disputes not resolved through mediation:</p>
                  <ul className={styles.bulletList}>
                    <li>Binding arbitration through the American Arbitration Association</li>
                    <li>One arbitrator selected using AAA rules</li>
                    <li>Arbitration conducted in San Francisco, California</li>
                    <li>Arbitrator's decision is final and binding</li>
                  </ul>
                </div>

                <h3 className={styles.sectionSubtitle}>Exceptions to Arbitration</h3>
                <p className={styles.sectionText}>The following disputes are NOT subject to arbitration:</p>
                <ul className={styles.bulletList}>
                  <li>Intellectual property infringement claims</li>
                  <li>Claims for injunctive relief</li>
                  <li>Small claims court matters (under $10,000)</li>
                  <li>Disputes involving minors (may require court approval)</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Class Action Waiver</h3>
                <ul className={styles.bulletList}>
                  <li>You agree not to participate in class action lawsuits against us</li>
                  <li>You agree not to join multiple claims in arbitration</li>
                  <li>Each dispute must be resolved individually</li>
                  <li>This waiver does not apply where prohibited by law</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Educational Institution Rights</h3>
                <p className={styles.sectionText}>
                  Schools and educational institutions may have different dispute resolution rights under their service agreements.
                </p>
              </section>

              <hr className={styles.separator} />

              {/* 16. Contact Information */}
              <section id="contact-information" className={styles.section}>
                <h2 className={styles.sectionTitle}>16. Contact Information</h2>

                <h3 className={styles.sectionSubtitle}>General Support</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Response Time:</strong> Within 24 hours</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Legal and Terms Questions</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>For questions about these Terms</strong></li>
                  <li><strong>Response Time:</strong> Within 5 business days</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Privacy Questions</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Data Protection Officer:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>For privacy and data questions</strong></li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Accessibility Support</h3>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Response Time:</strong> Within 48 hours</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Emergency Contact</h3>
                <p className={styles.sectionText}>For urgent security issues:</p>
                <ul className={styles.bulletList}>
                  <li><strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a></li>
                  <li><strong>Available:</strong> 24/7 for critical issues</li>
                </ul>
              </section>

              <hr className={styles.separator} />

              {/* Additional Information */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Additional Information</h2>

                <h3 className={styles.sectionSubtitle}>Severability</h3>
                <p className={styles.sectionText}>If any part of these Terms is found unenforceable:</p>
                <ul className={styles.bulletList}>
                  <li>The remaining Terms remain in full effect</li>
                  <li>Unenforceable portions will be modified to be enforceable</li>
                  <li>The overall intent of the Terms will be preserved</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Entire Agreement</h3>
                <p className={styles.sectionText}>These Terms, together with our Privacy Policy, constitute:</p>
                <ul className={styles.bulletList}>
                  <li>The complete agreement between you and Brill Tutor</li>
                  <li>Replacement of any previous agreements or understandings</li>
                  <li>The governing document for your use of the Service</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>No Waiver</h3>
                <p className={styles.sectionText}>Our failure to enforce any Term does not:</p>
                <ul className={styles.bulletList}>
                  <li>Waive our right to enforce it later</li>
                  <li>Create new rights or obligations</li>
                  <li>Modify these Terms in any way</li>
                </ul>

                <h3 className={styles.sectionSubtitle}>Assignment</h3>
                <ul className={styles.bulletList}>
                  <li>You cannot transfer your rights under these Terms</li>
                  <li>We may assign our rights to affiliates or successors</li>
                  <li>Any attempted assignment by you is void</li>
                  <li>Assignment does not change your rights under these Terms</li>
                </ul>
              </section>

              <hr className={styles.separator} />
              
              <div className={styles.footer}>
                <p className={styles.sectionText}>
                  <strong>© 2025 Brill Tutor, Inc. All Rights Reserved.</strong>
                </p>
                <p className={styles.sectionText}>
                  These Terms of Use are effective as of September 1, 2025. For questions about these Terms or our Service, please contact us at <a href="mailto:brillai.tutor@gmail.com" className={styles.contactEmail}>brillai.tutor@gmail.com</a>.
                </p>
                <p className={styles.sectionText}>
                  Thank you for choosing Brill Tutor for your standardized test preparation!
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
