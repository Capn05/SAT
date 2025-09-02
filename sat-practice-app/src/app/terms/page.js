'use client';

export default function TermsOfUsePage() {
  return (
    <>
      {/* Back to Home Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-emerald-600 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* Terms of Use Content */}
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-12">
            {/* Terms of Use Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Terms of Use
              </h1>
              <p className="text-lg text-gray-600">
                Last Updated: September 1, 2025 • Effective Date: September 1, 2025
              </p>
            </div>

            {/* Terms of Use Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                
                {/* Acceptance of Terms */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed">
                    By accessing or using Brill Tutor's standardized test preparation platform (the "Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use our Service.
                  </p>
                  
                  <div className="bg-blue-50 p-6 rounded-lg mt-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Who These Terms Apply To</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• <strong>Individual Users:</strong> Students and parents who create personal accounts</li>
                      <li>• <strong>Educational Institutions:</strong> Schools and districts that provide access to students</li>
                      <li>• <strong>Minors:</strong> Users under 18 must have parental consent or school authorization</li>
                    </ul>
                  </div>
                </section>

                {/* Description of Service */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Brill Tutor is an AI-powered standardized test preparation platform designed to help students improve their standardized test scores through personalized practice and instruction.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-3">Core Features</h3>
                      <ul className="text-emerald-800 space-y-2">
                        <li>• <strong>2,000+ Practice Questions:</strong> Covering Math and Reading & Writing sections</li>
                        <li>• <strong>15+ Full-Length Practice Tests:</strong> Adaptive exams that mirror the real standardized test experience</li>
                        <li>• <strong>AI Tutor "Brill":</strong> Personalized hints, explanations, and study guidance</li>
                        <li>• <strong>Performance Analytics:</strong> Detailed progress tracking and weakness identification</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">Educational Purpose</h3>
                      <p className="text-purple-800 mb-3">Our Service is designed exclusively for:</p>
                      <ul className="text-purple-800 space-y-2">
                        <li>• Standardized test preparation and study</li>
                        <li>• Educational skill development</li>
                        <li>• Academic progress tracking</li>
                        <li>• Learning enhancement through AI assistance</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Subscription Plans */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Plans and Billing</h2>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">Monthly Plan</h4>
                      <p className="text-yellow-800 text-sm">Month-to-month subscription with monthly billing</p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Quarterly Plan</h4>
                      <p className="text-green-800 text-sm">Three-month subscription with quarterly billing</p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Enterprise Deals</h4>
                      <p className="text-blue-800 text-sm">Contact us for more information</p>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-3">Free Trial Terms</h3>
                    <ul className="text-indigo-800 space-y-2">
                      <li>• <strong>Duration:</strong> 7-day free trial for new users</li>
                      <li>• <strong>Full Access:</strong> Complete access to all features during trial</li>
                      <li>• <strong>Cancellation:</strong> Cancel anytime during trial to avoid charges</li>
                      <li>• <strong>Conversion:</strong> Automatically converts to paid plan if not canceled</li>
                    </ul>
                  </div>
                </section>

                {/* User Conduct */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Conduct and Prohibited Uses</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceptable Use</h3>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-green-800 mb-3">You agree to use the Service only for:</p>
                      <ul className="text-green-800 space-y-2">
                        <li>• Personal standardized test preparation and study</li>
                        <li>• Educational purposes as intended</li>
                        <li>• Lawful activities in compliance with applicable laws</li>
                        <li>• Activities that do not harm other users or our Service</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-400 p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">Prohibited Activities</h3>
                    <p className="text-red-800 mb-3">You may NOT:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Academic Integrity Violations</h4>
                        <ul className="text-red-800 text-sm space-y-1">
                          <li>• Use the Service during actual standardized test examinations</li>
                          <li>• Create or distribute answer keys or shortcuts</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Technical Violations</h4>
                        <ul className="text-red-800 text-sm space-y-1">
                          <li>• Attempt to hack, breach, or compromise our security</li>
                          <li>• Use automated tools, bots, or scrapers to access content</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* AI Tutor Features */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Tutor Features and Limitations</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">AI Tutor Capabilities</h3>
                      <p className="text-blue-800 mb-3">Our AI tutor "Brill" can:</p>
                      <ul className="text-blue-800 space-y-2">
                        <li>• <strong>Provide Hints:</strong> Offer guidance without giving direct answers</li>
                        <li>• <strong>Explain Solutions:</strong> Break down problem-solving approaches</li>
                        <li>• <strong>Identify Patterns:</strong> Help you understand common question types</li>
                        <li>• <strong>Personalize Learning:</strong> Adapt responses to your skill level</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-orange-900 mb-3">AI Limitations</h3>
                      <p className="text-orange-800 mb-3">Please understand that our AI tutor:</p>
                      <ul className="text-orange-800 space-y-2">
                        <li>• <strong>May Make Errors:</strong> AI-generated content can be inaccurate</li>
                        <li>• <strong>Provides Guidance Only:</strong> Not a substitute for human instruction</li>
                        <li>• <strong>Has Knowledge Limits:</strong> May not know about very recent changes</li>
                        <li>• <strong>Requires Verification:</strong> Always double-check important information</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property Rights</h2>
                  
                  <div className="bg-purple-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Our Intellectual Property</h3>
                    <p className="text-purple-800 mb-3">Brill Tutor owns all rights to:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-purple-800 space-y-2">
                        <li>• <strong>Practice Questions:</strong> Original questions created by our educational team</li>
                        <li>• <strong>AI Tutor Technology:</strong> Proprietary algorithms and responses</li>
                      </ul>
                      <ul className="text-purple-800 space-y-2">
                        <li>• <strong>Platform Software:</strong> All code, design, and functionality</li>
                        <li>• <strong>Educational Content:</strong> Explanations, analytics, and study materials</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Your License to Use Content</h3>
                    <p className="text-green-800 mb-3">We grant you a limited, personal, non-exclusive license to:</p>
                    <ul className="text-green-800 space-y-2">
                      <li>• Access and use our Service for standardized test preparation</li>
                      <li>• View and interact with our educational content</li>
                      <li>• Print practice questions for personal study (not for redistribution)</li>
                      <li>• Use our AI tutor for learning assistance</li>
                    </ul>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
                  
                  <div className="bg-yellow-100 border-2 border-yellow-300 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">Educational Results Disclaimer</h3>
                    <ul className="text-yellow-800 space-y-2">
                      <li>• <strong>No Score Guarantees:</strong> We cannot guarantee standardized test score improvements</li>
                      <li>• <strong>Individual Results Vary:</strong> Effectiveness depends on many factors</li>
                      <li>• <strong>Supplemental Tool:</strong> Our Service should supplement other study methods</li>
                      <li>• <strong>Professional Advice:</strong> Consult educators for personalized guidance</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-400 p-6 mt-6">
                    <p className="text-red-900 font-semibold">
                      Brill Tutor is an educational preparation service. We provide practice materials and study tools but cannot guarantee specific outcomes or standardized test score improvements.
                    </p>
                  </div>
                </section>

                {/* Data and Privacy */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy and Data Protection</h2>
                  
                  <div className="bg-emerald-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-3">Key Privacy Commitments</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-emerald-800 space-y-2">
                        <li>• <strong>Data Ownership:</strong> You own your educational data</li>
                        <li>• <strong>Limited Collection:</strong> We collect only what's necessary for our Service</li>
                      </ul>
                      <ul className="text-emerald-800 space-y-2">
                        <li>• <strong>No Advertising:</strong> We don't use your data for advertising or sell it to others</li>
                        <li>• <strong>Strong Security:</strong> Industry-leading encryption and protection measures</li>
                      </ul>
                    </div>
                    
                    <div className="mt-4 p-4 bg-emerald-100 rounded">
                      <p className="text-emerald-900 font-medium">
                        For active accounts, we retain your data as necessary to provide our Service. When you delete your account, we remove your data within 60 days of deletion. Some data may be retained longer if required by law or legal obligations. You maintain control over your data and can request data deletion at any time by contacting us.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                  
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">General Support</h4>
                        <p className="text-gray-700 text-sm">
                          <strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a><br />
                          <strong>Response Time:</strong> Within 24 hours
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Legal Questions</h4>
                        <p className="text-gray-700 text-sm">
                          <strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a><br />
                          <strong>For questions about these Terms</strong><br />
                          <strong>Response Time:</strong> Within 5 business days
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Privacy Questions</h4>
                        <p className="text-gray-700 text-sm">
                          <strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a><br />
                          <strong>For privacy and data questions</strong><br />
                          <strong>Response Time:</strong> Within 48 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Footer */}
                <section className="border-t pt-8 mt-8">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-4">
                      <strong>© 2025 Brill Tutor, Inc. All Rights Reserved.</strong>
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      These Terms of Use are effective as of September 1, 2025. For questions about these Terms or our Service, please contact us at <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a>
                    </p>
                    <p className="text-emerald-600 font-medium">
                      Thank you for choosing Brill Tutor for your standardized test preparation!
                    </p>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
