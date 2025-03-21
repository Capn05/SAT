'use client';

import { useEffect } from 'react';
import StripePayment from '../../components/StripePayment';

export default function PricingPage() {
  useEffect(() => {
    // Check if user came from a redirect after login with a selected plan
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan) {
      // Clear the selected plan from local storage
      localStorage.removeItem('selectedPlan');
      
      // Find the button for the selected plan and click it
      const planButton = document.getElementById(`${selectedPlan}-plan-button`);
      if (planButton) {
        planButton.click();
      }
    }
  }, []);

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent <span className="text-green-500">Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Full access to all features with either plan. Choose what works for your preparation timeline.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover-lift">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Monthly Plan</h3>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">Flexible</span>
                </div>
                
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">$29</span>
                    <span className="ml-2 text-gray-500 font-medium">/month</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Cancel anytime</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">2,000+ SAT practice questions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">15+ full-length adaptive practice exams</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">AI tutor with hints and explanations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Performance analytics dashboard</span>
                  </li>
                </ul>
                
                <StripePayment
                  id="monthly-plan-button"
                  planType="monthly"
                  buttonText="Start Monthly Plan"
                  className="block w-full bg-white border-2 border-green-500 text-green-500 text-center py-4 px-6 rounded-xl text-lg font-medium hover:bg-green-50 transition-colors duration-200"
                />
              </div>
            </div>
            
            {/* 3-Month Plan - Featured Plan */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md relative transform hover:scale-[1.01] transition-all duration-300 hover-lift">
              {/* Best value tag */}
              <div className="absolute top-0 right-0">
                <div className="bg-green-500 text-white px-6 py-1 transform rotate-45 translate-x-5 translate-y-3 text-sm font-semibold">
                  SAVE 14%
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">3-Month Plan</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">BEST VALUE</span>
                </div>
                
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">$24</span>
                    <span className="ml-2 text-gray-500 font-medium">/month</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <p className="text-gray-500 text-sm">$72 billed every 3 months</p>
                    <span className="ml-2 line-through text-gray-400 text-xs">$174</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">2,000+ SAT practice questions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">15+ full-length adaptive practice exams</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">AI tutor with hints and explanations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Performance analytics dashboard</span>
                  </li>
                </ul>
                
                <StripePayment
                  id="quarterly-plan-button"
                  planType="quarterly"
                  buttonText="Save With 3-Month Plan"
                  className="block w-full bg-green-500 text-white text-center py-4 px-6 rounded-xl text-lg font-medium hover:bg-green-600 transition-colors duration-200 shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 