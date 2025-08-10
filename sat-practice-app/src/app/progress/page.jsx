'use client';

import { useState, useEffect } from 'react';
import TopBar from "../components/TopBar";
import SubscriptionCheck from '../../components/SubscriptionCheck';

// Import Recharts with needed components
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const StatCard = ({ title, value, subtitle, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-emerald-200 transition-all">
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {trend && (
      <p className={`text-sm mt-2 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
      </p>
    )}
  </div>
);

// Custom tooltip component for the daily accuracy chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {new Date(label).toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p className="text-sm text-emerald-600">
          Accuracy: {data.accuracy.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {data.correct} correct out of {data.total} questions
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for subcategory performance
const SubcategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-1">{data.name}</p>
        <p className="text-xs text-gray-600 mb-2">{data.domain}</p>
        <p className="text-sm text-emerald-600">
          Accuracy: {data.accuracy.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {data.correct} correct out of {data.total} questions
        </p>
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const [progressData, setProgressData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [subject, setSubject] = useState('all');
  const [activeTab, setActiveTab] = useState('accuracy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCorrect: 0,
    accuracyTrend: null,
    correctToday: null
  });

  useEffect(() => {
    fetchProgressData();
  }, [timeRange, subject]);

  useEffect(() => {
    if (progressData?.dailyData) {
      calculateStats(progressData.dailyData);
    }
    if (progressData?.overallStats) {
      setStats(prevStats => ({
        ...prevStats,
        totalQuestions: progressData.overallStats.totalQuestions,
        totalCorrect: progressData.overallStats.totalCorrect
      }));
    }
  }, [progressData]);

  const calculateStats = (dailyData) => {
    if (!dailyData || !dailyData.length) {
      setStats(prevStats => ({
        ...prevStats,
        accuracyTrend: null,
        correctToday: null
      }));
      return;
    }
    
    // Sort data by date (newest first)
    const sortedData = [...dailyData].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's entry and yesterday's entry
    const todayData = sortedData.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });
    
    // Find the most recent day with data and the day before that
    const lastDayWithData = sortedData[0];
    const previousDayWithData = sortedData[1];
    
    // Calculate accuracy trend (if we have at least 2 days of data)
    let accuracyTrend = null;
    if (lastDayWithData && previousDayWithData) {
      accuracyTrend = lastDayWithData.accuracy - previousDayWithData.accuracy;
    }
    
    // Calculate correct answers added today
    let correctToday = null;
    if (todayData && todayData.correct > 0) {
      correctToday = todayData.correct;
    }
    
    setStats(prevStats => ({
      ...prevStats,
      accuracyTrend,
      correctToday
    }));
  };

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/progress?days=${timeRange}${subject !== 'all' ? `&subject=${subject}` : ''}`);
      
      if (!response.ok) throw new Error('Failed to fetch progress data');
      
      const data = await response.json();
      
      // Always use the actual data from the API, even if empty
      setProgressData(data);
    } catch (err) {
      setError(err.message);
      // Instead of using generated data, use empty data
      setProgressData({
        dailyData: [],
        subcategoryData: []
      });
    } finally {
      setLoading(false);
    }
  };

  const overallAccuracy = stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;



  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <TopBar title="Progress Tracking" />
      
      {/* Main Content */}
      <SubscriptionCheck>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Overall Accuracy Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '10px', 
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Overall Accuracy</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{overallAccuracy}%</p>
              {stats.accuracyTrend !== null && (
                <p style={{ 
                  fontSize: '14px', 
                  color: stats.accuracyTrend >= 0 ? '#10b981' : '#ef4444', 
                  marginTop: '8px' 
                }}>
                  {stats.accuracyTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(stats.accuracyTrend))}% from previous day
                </p>
              )}
            </div>
            
            {/* Total Questions Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '10px', 
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Questions</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.totalQuestions}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>questions answered</p>
            </div>
            
            {/* Correct Answers Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '10px', 
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Correct Answers</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.totalCorrect}</p>
              {stats.correctToday && (
                <p style={{ fontSize: '14px', color: '#10b981', marginTop: '8px' }}>
                  ↑ {stats.correctToday} correct answers today!
                </p>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '10px', 
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="180">Last 180 days</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Subjects</option>
                  <option value="1">Math</option>
                  <option value="2">Reading & Writing</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Charts Container */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '10px', 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex' }}>
                <button
                  onClick={() => setActiveTab('accuracy')}
                  style={{ 
                    flex: 1,
                    padding: '16px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: activeTab === 'accuracy' ? '#10b981' : '#6b7280',
                    background: 'none',
                    border: activeTab === 'accuracy' 
                      ? '2px solid transparent' 
                      : 'none',
                    borderBottomColor: activeTab === 'accuracy' ? '#10b981' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Accuracy Trend
                </button>
                <button
                  onClick={() => setActiveTab('subcategories')}
                  style={{ 
                    flex: 1,
                    padding: '16px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: activeTab === 'subcategories' ? '#10b981' : '#6b7280',
                    background: 'none',
                    border: activeTab === 'subcategories' 
                      ? '2px solid transparent' 
                      : 'none',
                    borderBottomColor: activeTab === 'subcategories' ? '#10b981' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Topic Performance
                </button>
              </div>
            </div>
            
            {/* Chart Content */}
            <div style={{ padding: '24px' }}>
              {activeTab === 'accuracy' ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'baseline',
                    marginBottom: '20px'
                  }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Daily Accuracy</h2>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Last {timeRange} days</p>
                  </div>
                  
                  {/* Accuracy Chart */}
                  <div style={{ height: '400px', width: '100%' }}>
                    {progressData?.dailyData && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getMonth()+1}/${d.getDate()}`;
                            }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(value) => `${value}%`}
                            stroke="#6b7280"
                          />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Accuracy']}
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="natural" 
                            dataKey="accuracy" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                            activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'baseline',
                    marginBottom: '20px'
                  }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Topic Performance</h2>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>By subject area</p>
                  </div>
                  
                  {/* Topic Performance Chart */}
                  <div style={{ height: '400px', width: '100%' }}>
                    {progressData?.subcategoryData && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={progressData.subcategoryData} margin={{ bottom: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(value) => `${value}%`}
                            stroke="#6b7280"
                          />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Accuracy']}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="accuracy" 
                            fill="#10b981"
                            name="Accuracy"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SubscriptionCheck>
    </div>
  );
} 