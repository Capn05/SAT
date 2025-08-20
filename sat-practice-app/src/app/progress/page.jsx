'use client';

import { useState, useEffect } from 'react';
import TopBar from "../components/TopBar";
import SubscriptionCheck from '../../components/SubscriptionCheck';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// Wrapped X-axis tick to prevent overlaps and bleed with multi-line centered labels
const WrappedAxisTick = ({ x, y, payload }) => {
  const value = String(payload?.value ?? '');
  const maxCharsPerLine = 16;
  const maxLines = 2;

  const words = value.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + (current ? ' ' : '') + w).length <= maxCharsPerLine) {
      current = current ? current + ' ' + w : w;
    } else {
      lines.push(current);
      current = w;
    }
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#374151" fontSize={12}>
        {lines.map((line, idx) => (
          <tspan key={idx} x={0} dy={idx === 0 ? 12 : 14}>{line}</tspan>
        ))}
      </text>
    </g>
  );
};

export default function ProgressPage() {
  const [progressData, setProgressData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressData();
  }, [timeRange, subject, difficulty]);

  useEffect(() => {
    if (progressData?.domains) {
      setSelectedDomains(progressData.domains);
    }
  }, [progressData?.domains]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('days', timeRange);
      if (subject !== 'all') params.set('subject', subject);
      if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);

      const response = await fetch(`/api/progress?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch progress data');
      const data = await response.json();
      setProgressData(data);
    } catch (err) {
      setError(err.message);
      setProgressData({ dailyData: [], domainData: [], domains: [] });
    } finally {
      setLoading(false);
    }
  };

  const toggleDomain = (domain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  const visibleDomainData = (progressData?.domainData || [])
    .filter(d => selectedDomains.includes(d.domain))
    .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));

  // Compute evenly spaced ticks for the line chart based on the selected range
  const computeLineTicks = (data, range) => {
    if (!data || data.length === 0) return [];
    const dates = data.map(d => d.date);
    if (range === '7') return dates; // label each day
    if (range === '30') return dates.filter((_, i) => i % 3 === 0); // every 3rd day
    if (range === '90') return dates.filter((_, i) => i % 9 === 0); // every 9th day
    // all-time: 10 evenly spaced ticks including first and last
    const desired = 10;
    if (dates.length <= desired) return dates;
    const ticks = [];
    const lastIndex = dates.length - 1;
    for (let i = 0; i < desired; i++) {
      const idx = Math.round((i * lastIndex) / (desired - 1));
      const date = dates[idx];
      if (!ticks.includes(date)) ticks.push(date);
    }
    return ticks;
  };

  const lineTicks = computeLineTicks(progressData?.dailyData || [], timeRange);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <TopBar title="Progress" />
      <SubscriptionCheck>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          {/* Filters */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '10px', 
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                >
                  <option value="all">All Subjects</option>
                  <option value="1">Math</option>
                  <option value="2">Reading & Writing</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                >
                  <option value="all">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Chart: Questions and Correct Over Time */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Activity</h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>{timeRange === 'all' ? 'All Time' : `Last ${timeRange} days`}</p>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    ticks={lineTicks}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Questions Answered" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="correct" name="Correct Answers" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Domain Accuracy with Multi-select */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Domain Accuracy</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>Show domains:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(progressData?.domains || []).map((d) => (
                    <label key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', background: selectedDomains.includes(d) ? '#ecfdf5' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '9999px', padding: '6px 10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDomains.includes(d)} 
                        onChange={() => toggleDomain(d)} 
                        style={{ accentColor: '#10b981' }}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: '420px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibleDomainData} margin={{ top: 28, right: 8, left: 8, bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="domain"
                    stroke="#6b7280"
                    height={56}
                    interval={0}
                    tickLine={false}
                    tick={<WrappedAxisTick />}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="#6b7280" />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="accuracy" fill="#10b981" name="Accuracy" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SubscriptionCheck>
    </div>
  );
}