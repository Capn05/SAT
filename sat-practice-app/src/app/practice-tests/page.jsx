'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import { CheckCircle, Clock, Award, BookOpen, ArrowRight } from 'lucide-react';

export default function PracticeTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const router = useRouter();
  
  useEffect(() => {
    fetchPracticeTests();
  }, [selectedSubject]);
  
  const fetchPracticeTests = async () => {
    try {
      setLoading(true);
      
      // Construct the API URL with optional subject filter
      let url = '/api/practice-tests';
      if (selectedSubject !== 'all') {
        url += `?subject_id=${selectedSubject}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch practice tests');
      }
      
      const data = await response.json();
      setTests(data);
    } catch (err) {
      console.error('Error fetching practice tests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartTest = (testId) => {
    router.push(`/practice-test/${testId}`);
  };
  
  // Get the time limit based on subject
  const getTimeLimit = (subject) => {
    return subject?.subjects?.subject_name?.includes('Math') ? '35 minutes' : '32 minutes';
  };
  
  // Get the number of questions based on subject
  const getQuestionCount = (subject) => {
    return subject?.subjects?.subject_name?.includes('Math') ? '44 questions' : '54 questions';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Timed SAT Practice Tests" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About Timed SAT Practice Tests</h2>
          <p className="text-gray-600 mb-4">
            Timed practice tests are designed to simulate the real SAT experience. Each test consists of two modules:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                <strong>Module 1</strong> contains a mix of questions with varying difficulty levels.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                <strong>Module 2</strong> is adaptive based on your Module 1 performance - you'll receive either an easier or harder second module.
              </span>
            </li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 font-medium">These practice tests follow the official College Board Digital SAT format and timing guidelines.</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg mt-4">
            <p className="text-emerald-700 font-medium mb-2">About SAT Scoring</p>
            <ul className="list-disc list-inside text-emerald-700 space-y-1">
              <li>The SAT has 2 sections (Reading & Writing, Math), each scored 160–760; total 320–1520.</li>
              <li>Section score = 160 + 600 × (questions correct ÷ total questions), rounded to the nearest 10.</li>
              <li>National Merit Scholarship Index (NMSI) = (2 × Reading & Writing + Math) ÷ 10.</li>
              <li>On this page, you can take sections separately, but only paired completions (e.g., RW 1 + Math 1, RW 2 + Math 2) produce a Total and NMSI.</li>
            </ul>
            <div className="mt-3 text-emerald-800 text-sm">
              <p className="mb-1"><strong>Adaptive routing:</strong> After Module 1, scoring determines your Module 2:</p>
              <ul className="list-disc list-inside">
                <li><strong>Math:</strong> 14+/22 correct routes to the harder Module 2.</li>
                <li><strong>Reading & Writing:</strong> 18+/27 correct routes to the harder Module 2.</li>
              </ul>
              <p className="mt-2">If you’re routed to an easier Module 2, the maximum achievable section results are effectively limited by the question totals (e.g., RW 44/54 ≈ 650; Math 35/44 ≈ 640 under the section formula), so no separate ceiling is applied.</p>
            </div>
          </div>
        </div>
        
        {/* Subject Filter */}
        <div className="mb-6">
          <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Subject
          </label>
          <select
            id="subject-filter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="block w-full md:w-64 rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Subjects</option>
            <option value="1">Math</option>
            <option value="2">Reading & Writing</option>
          </select>
        </div>
        
        {/* Tests Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600">
            <p className="font-medium">Error loading practice tests</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No practice tests available</h3>
            <p className="text-gray-500">
              {selectedSubject === 'all' 
                ? "There are no practice tests in the database yet." 
                : "There are no practice tests for this subject."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div 
                key={test.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                    {test.completed && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-4">
                    {test.subjects?.subject_name || 'Subject not specified'}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{getTimeLimit(test)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{getQuestionCount(test)}</span>
                    </div>
                    {test.completed && (
                      <div className="flex items-center text-sm">
                        <Award className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Previous score: {test.score}%</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleStartTest(test.id)}
                    className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    {test.completed ? 'Retake Test' : 'Start Test'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 