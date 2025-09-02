'use client';

export default function PrivacyPolicyPage() {
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

      {/* Privacy Policy Content */}
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-12">
            {/* Privacy Policy Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600">
                Last Updated: September 1, 2025 • Effective Date: September 1, 2025
              </p>
            </div>

            {/* Privacy Policy Content */}
            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to Brill Tutor, an AI-powered standardized test preparation platform. This Privacy Policy explains how Brill Tutor ("we," "our," or "us") collects, uses, protects, and shares information when you use our standardized test preparation service (the "Service").
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    <strong>We are committed to protecting your privacy and ensuring you own and control your educational data.</strong> This policy describes our practices in clear, understandable language and explains your rights regarding your information.
                  </p>
                  
                  <div className="bg-emerald-50 p-6 rounded-lg mt-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-3">Our Service Provides:</h3>
                    <ul className="text-emerald-800 space-y-2">
                      <li>• 2,000+ standardized test practice questions across Math and Reading & Writing</li>
                      <li>• 15+ full-length adaptive practice exams</li>
                      <li>• AI tutor assistance with personalized hints and explanations</li>
                      <li>• Performance analytics and progress tracking</li>
                      <li>• Targeted skills practice and quick practice modes</li>
                    </ul>
                  </div>
                </section>

                {/* Information We Collect */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    We limit our data collection to what is necessary to provide you with an excellent standardized test preparation experience. Here's exactly what we collect:
                  </p>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Account Information</h3>
                      <p className="text-blue-800">When you create an account, we collect:</p>
                      <ul className="text-blue-800 mt-2 space-y-1">
                        <li>• <strong>Email Address:</strong> Used for account access and communication</li>
                        <li>• <strong>Password:</strong> Encrypted and securely stored</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">Educational Data and Performance Information</h3>
                      <p className="text-purple-800">To provide personalized standardized test preparation, we collect:</p>
                      <ul className="text-purple-800 mt-2 space-y-1">
                        <li>• <strong>Practice Session Data:</strong> Your answers, response times, and completion status</li>
                        <li>• <strong>Performance Analytics:</strong> Accuracy rates, strengths/weaknesses analysis, and progress over time</li>
                        <li>• <strong>Study Preferences:</strong> Difficulty level selections, subject focus areas, and practice modes used</li>
                        <li>• <strong>AI Tutor Interactions:</strong> Questions asked to our AI tutor and explanations provided</li>
                        <li>• <strong>Test Results:</strong> Scores from practice exams and module performance data</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">Usage and Technical Information</h3>
                      <p className="text-green-800">To ensure our service works properly, we automatically collect:</p>
                      <ul className="text-green-800 mt-2 space-y-1">
                        <li>• <strong>Usage Patterns:</strong> Features used, time spent on platform, navigation paths</li>
                        <li>• <strong>Session Data:</strong> Login times, duration of study sessions</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* How We Use Your Information */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <p className="text-yellow-900 text-lg font-medium mb-4">
                      We use your information solely to provide, improve, and personalize your standardized test preparation experience:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-yellow-900">Service Delivery</h4>
                        <ul className="text-yellow-800 text-sm mt-2 space-y-1">
                          <li>• Provide access to practice questions, tests, and AI tutor</li>
                          <li>• Generate personalized performance analytics</li>
                          <li>• Save your progress and resume sessions</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-900">Account Management</h4>
                        <ul className="text-yellow-800 text-sm mt-2 space-y-1">
                          <li>• Create and maintain your user account</li>
                          <li>• Process subscription payments</li>
                          <li>• Provide customer support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border-l-4 border-red-400 p-6 mt-6">
                    <p className="text-red-900 font-semibold">
                      We do NOT use your educational data for advertising, marketing to third parties, or any commercial purposes beyond providing you with standardized test preparation services.
                    </p>
                  </div>
                </section>

                {/* Data Ownership and Your Rights */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Ownership and Your Rights</h2>
                  <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-lg">
                    <p className="text-emerald-900 text-xl font-bold mb-4">
                      You own your educational data. We are simply the custodian of your information while providing our service.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-emerald-900 mb-3">Your Data Rights</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-emerald-800 space-y-2">
                        <li>• <strong>Access:</strong> View all information we have about you</li>
                        <li>• <strong>Correct:</strong> Update or fix any inaccurate information</li>
                        <li>• <strong>Export:</strong> Request and download your data in a portable format</li>
                      </ul>
                      <ul className="text-emerald-800 space-y-2">
                        <li>• <strong>Delete:</strong> Request complete removal of your account and data</li>
                        <li>• <strong>Restrict Processing:</strong> Limit how we use your information</li>
                        <li>• <strong>Object:</strong> Opt out of certain data processing activities</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security and Protection</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    We implement comprehensive security measures to protect your information:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-2">Encryption</h4>
                      <ul className="text-indigo-800 text-sm space-y-1">
                        <li>• TLS 1.3 encryption for data in transit</li>
                        <li>• AES-256 encryption for data at rest</li>
                        <li>• All practice content encrypted</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Authentication</h4>
                      <ul className="text-purple-800 text-sm space-y-1">
                        <li>• Passwords hashed with bcrypt</li>
                        <li>• Multi-Factor Authentication available</li>
                        <li>• Secure session management</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Infrastructure</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• Restricted employee access</li>
                        <li>• 24/7 security monitoring</li>
                        <li>• Encrypted, distributed backups</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* No Advertising Policy */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Advertising Policy</h2>
                  <div className="bg-green-100 border-2 border-green-300 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-green-900 mb-4">Brill Tutor does not display advertisements.</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-green-800 space-y-2">
                        <li>• <strong>No Third-Party Ads:</strong> We don't allow advertisers or data brokers</li>
                        <li>• <strong>No Targeted Advertising:</strong> We don't target ads based on your data</li>
                      </ul>
                      <ul className="text-green-800 space-y-2">
                        <li>• <strong>No Ad Tracking:</strong> We don't use tracking technologies for ads</li>
                        <li>• <strong>No Data Broker Sharing:</strong> We never share data with advertising networks</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    We're here to help with any privacy questions or concerns.
                  </p>
                  
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Privacy Contact</h4>
                        <p className="text-gray-700">
                          <strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a><br />
                          <strong>Response Time:</strong> Within 48 hours for privacy inquiries
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Emergency Contact</h4>
                        <p className="text-gray-700">
                          For urgent security or privacy issues:<br />
                          <strong>Email:</strong> <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a><br />
                          <strong>Available:</strong> 24/7 for critical issues
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
                    <p className="text-gray-600 text-sm">
                      This Privacy Policy is effective as of September 1, 2025. For questions about this policy or our privacy practices, please contact us at <a href="mailto:brillai.tutor@gmail.com" className="text-emerald-600 hover:text-emerald-700">brillai.tutor@gmail.com</a>
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
