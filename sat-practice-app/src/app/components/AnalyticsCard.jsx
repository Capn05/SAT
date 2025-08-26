"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart2, TrendingUp, CheckCircle } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Create a stats cache to reduce repeated API calls
const statsCache = {
  data: null,
  lastFetched: 0
};

// Cache stats for 5 minutes
const STATS_CACHE_DURATION = 300000;

export default function AnalyticsCard() {
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracyPercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [dailyData, setDailyData] = useState([])
  const router = useRouter()
  const supabase = createClientComponentClient()
  const fetchInProgress = useRef(false);

  useEffect(() => {
    // Skip if a fetch is already in progress
    if (fetchInProgress.current) return;
    
    const fetchStats = async () => {
      // Return cached stats if recent
      const now = Date.now();
      if (statsCache.data && now - statsCache.lastFetched < STATS_CACHE_DURATION) {
        console.log('Using cached stats data');
        setStats(statsCache.data);
        setLoading(false);
        return;
      }
      
      fetchInProgress.current = true;
      
      try {
        setLoading(true);
        
        // Check if we have a session already cached in localStorage
        const localSession = localStorage.getItem('supabase.auth.token');
        if (!localSession) {
          console.log('No session found in local storage');
          // No session cached, check with the server
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.log('No valid session found');
            return;
          }
          
          console.log('Fetching stats for user:', session.user.id);
          
          const response = await fetch(`/api/user-stats?userId=${session.user.id}`);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data && data.stats) {
            // Cache the stats data
            statsCache.data = data.stats;
            statsCache.lastFetched = Date.now();
            
            setStats(data.stats);
          }
        } else {
          // We already have a session in localStorage, parse it
          const session = JSON.parse(localSession);
          if (session?.user) {
            console.log('Using cached session for user:', session.user.id);
            
            const response = await fetch(`/api/user-stats?userId=${session.user.id}`);
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.stats) {
              // Cache the stats data
              statsCache.data = data.stats;
              statsCache.lastFetched = Date.now();
              
              setStats(data.stats);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Set default values on error
        setStats({
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracyPercentage: 0
        });
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    };

    fetchStats();
  }, [router, supabase]);

  // Fetch last 7 days daily data for line chart (both subjects, all difficulties)
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        setChartLoading(true);
        const tzOffset = new Date().getTimezoneOffset() * -1;
        const resp = await fetch(`/api/progress?days=7&tzOffset=${tzOffset}`);
        if (!resp.ok) throw new Error('Failed to fetch progress');
        const data = await resp.json();
        if (isMounted) setDailyData(data?.dailyData || []);
      } catch (e) {
        console.error('Error fetching 7-day progress:', e);
        if (isMounted) setDailyData([]);
      } finally {
        if (isMounted) setChartLoading(false);
      }
    };
    fetchProgress();
    return () => { isMounted = false };
  }, []);

  const ticks = dailyData.map(d => d.date);

  const handleViewAnalytics = () => {
    router.push('/progress');
  };

  return (
    <div 
      style={styles.container}
      onClick={handleViewAnalytics}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={styles.header}>
        <h2 style={styles.title}>Your Progress (Last 7 days)</h2>
      </div>
      <div style={{ height: 260, width: '100%', marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date"
              ticks={ticks}
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
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

      <button 
        style={styles.viewButton} 
        onClick={handleViewAnalytics}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0d9768';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#10b981';
        }}
      >
        <span>    View Detailed Analytics</span>
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#4b5563",
  },
  stats: {
    display: "flex",
    gap: "24px",
    marginBottom: "24px",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    backgroundColor: "#f3f9f3",
    borderRadius: "8px",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  viewButton: {
    backgroundColor: "#10b981",
    color: "white", 
    padding: "0.5rem 1.25rem",
    borderRadius: "0.375rem",
    fontWeight: 500,
    width: "100%",
    border: "none", 
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.2s ease",
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
}

