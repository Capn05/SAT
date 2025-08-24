'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TopBar from "../components/TopBar";
import SubscriptionCheck from '../../components/SubscriptionCheck';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';
import { renderMathContent, processTableFormat } from '../components/MathRenderer';

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
  const [expandedRowId, setExpandedRowId] = useState(null);

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

  const md = useMemo(() => new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }).use(markdownItKatex), []);

  const history = useMemo(() => progressData?.answerHistory || [], [progressData?.answerHistory]);

  const toggleExpand = (rowId) => {
    setExpandedRowId(prev => (prev === rowId ? null : rowId));
  };

  const renderContent = (text, subjectId) => {
    if (!text) return { __html: '' };
    if (subjectId === 1) {
      return { __html: renderMathContent(text) };
    }
    return { __html: md.render(processTableFormat(text)) };
  };

  const getDifficultyStyles = (diff) => {
    const base = { fontSize: '12px', fontWeight: 600, borderRadius: '9999px', padding: '2px 8px' };
    if (diff === 'Easy') return { ...base, color: '#065f46', background: '#ecfdf5', border: '1px solid #d1fae5' };
    if (diff === 'Medium') return { ...base, color: '#7c2d12', background: '#fff7ed', border: '1px solid #ffedd5' };
    if (diff === 'Hard') return { ...base, color: '#991b1b', background: '#fef2f2', border: '1px solid #fee2e2' };
    return { ...base, color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb' };
  };

  const getDomainStyles = (name) => {
    const palettes = [
      { text: '#991b1b', bg: '#fee2e2', border: '#fecaca' }, // red
      { text: '#9a3412', bg: '#ffedd5', border: '#fed7aa' }, // orange
      { text: '#854d0e', bg: '#fef3c7', border: '#fde68a' }, // amber/yellow
      { text: '#166534', bg: '#dcfce7', border: '#bbf7d0' }, // green
      { text: '#1e3a8a', bg: '#dbeafe', border: '#bfdbfe' }, // blue
      { text: '#4338ca', bg: '#e0e7ff', border: '#c7d2fe' }, // indigo
      { text: '#6b21a8', bg: '#f3e8ff', border: '#e9d5ff' }, // violet
      { text: '#9d174d', bg: '#ffe4e6', border: '#fecdd3' }, // pink/rose
      { text: '#0f766e', bg: '#ccfbf1', border: '#99f6e4' }, // teal
      { text: '#3f6212', bg: '#ecfccb', border: '#d9f99d' }, // lime
      { text: '#7c2d12', bg: '#ffedd5', border: '#fed7aa' }, // orange-dark
      { text: '#0c4a6e', bg: '#e0f2fe', border: '#bae6fd' }, // sky
    ];
    const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const p = palettes[hash % palettes.length];
    return { fontSize: '12px', fontWeight: 600, color: p.text, background: p.bg, border: `1px solid ${p.border}`, borderRadius: '9999px', padding: '2px 8px', display: 'inline-block', lineHeight: 1.3 };
  };

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
        {/* Answer History Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '28px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginLeft: '72px', marginRight: '72px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Answer History</h2>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{history.length} total</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '900px', display: 'grid', gridTemplateColumns: 'minmax(120px, 1.1fr) minmax(140px, 1.2fr) minmax(180px, 1.6fr) minmax(110px, 0.9fr) minmax(110px, 0.8fr) minmax(180px, 1.4fr)', gap: '0' }}>
              {['Subject', 'Domain', 'Subcategory', 'Difficulty', 'Correct', 'Answered At'].map((h) => (
                <div key={h} style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>{h}</div>
              ))}

              {history.map((row) => (
                <React.Fragment key={`row-${row.id}`}>
                  <div key={`btn-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '9999px', background: row.subject_id === 1 ? '#2563eb' : '#9333ea' }}></span>
                      <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>{row.subject}</span>
                    </div>
                  </div>
                  <div key={`domain-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    {row.domain ? (
                      <span style={getDomainStyles(row.domain)}>{row.domain}</span>
                    ) : '-'}
                  </div>
                  <div key={`subcat-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>{row.subcategory || '-'}</div>
                  <div key={`diff-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    {row.difficulty ? (<span style={getDifficultyStyles(row.difficulty)}>{row.difficulty}</span>) : '-'}
                  </div>
                  <div key={`correct-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: row.is_correct ? '#065f46' : '#991b1b', background: row.is_correct ? '#ecfdf5' : '#fef2f2', border: `1px solid ${row.is_correct ? '#d1fae5' : '#fee2e2'}`, borderRadius: '9999px', padding: '2px 8px' }}>
                      {row.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div key={`time-${row.id}`} onClick={() => toggleExpand(row.id)} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>
                    {new Date(row.answered_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {expandedRowId === row.id && (
                    <div key={`exp-${row.id}`} style={{ gridColumn: '1 / -1', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                      <div style={{ padding: '16px' }}>
                        {row.image_url && (
                          <div style={{ marginBottom: '12px' }}>
                            <img src={row.image_url} alt="Question image" style={{ maxWidth: '100%', height: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        )}
                        <div className={`question-text-container`} style={{ fontSize: '16px', color: '#111827', marginBottom: '12px' }} dangerouslySetInnerHTML={renderContent(row.question_text, row.subject_id)} />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '8px' }}>
                          {row.options.map((opt) => {
                            const isSelected = opt.id === row.selected_option_id;
                            const isCorrect = !!opt.is_correct;
                            const bg = isCorrect ? '#ecfdf5' : isSelected ? '#fef2f2' : 'white';
                            const border = isCorrect ? '#a7f3d0' : isSelected ? '#fecaca' : '#e5e7eb';
                            return (
                              <div key={opt.id} style={{ border: `1px solid ${border}`, background: bg, borderRadius: '8px', padding: '10px 12px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                                  <div style={{ fontWeight: 700, width: '22px', fontSize: '13px' }}>{opt.value}</div>
                                  <div className="option-text" style={{ flex: 1, fontSize: '13px' }} dangerouslySetInnerHTML={renderContent(opt.label, row.subject_id)} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </SubscriptionCheck>
    </div>
  );
}