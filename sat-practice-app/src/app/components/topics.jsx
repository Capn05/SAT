'use client';
import { useEffect, useState } from 'react';
import { 
  BookOpen, Calculator, FlaskRoundIcon as FlaskRoundIcon, PenTool, Brain, 
  FunctionSquare, PieChart, Shapes, BarChart, FileText, Lightbulb, 
  NetworkIcon as Network, ArrowRight, Sigma, Infinity, Ruler, 
  Percent, Divide, LineChart, Circle, Box
} from "lucide-react";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import DifficultyModal from './DifficultyModal';

const categoryIcons = {
  // Math Categories
  'Algebra': Calculator,
  'Advanced Math': FunctionSquare,
  'Problem Solving': Brain,
  'Problem-Solving and Data Analysis': BarChart,
  'Geometry and Trigonometry': Shapes,
  
  // Math Subcategories
  'Linear Equations': Calculator,
  'Systems of Equations': Network,
  'Quadratic Equations': FunctionSquare,
  'Exponential Functions': PieChart,
  'Geometry & Trigonometry': Shapes,
  'Data Analysis': BarChart,
  
  // Specific Math Topics
  'Equivalent Expressions': Sigma,
  'Nonlinear Equations and Systems': Infinity,
  'Nonlinear Functions': LineChart,
  'Linear Equations in One Variable': Calculator,
  'Linear Equations in Two Variables': Network,
  'Linear Functions': LineChart,
  'Systems of Linear Equations': Network,
  'One-Variable Data': BarChart,
  'Two-Variable Data': PieChart,
  'Probability': Percent,
  'Sample Statistics and Margin of Error': BarChart,
  'Evaluating Statistical Claims': Brain,
  'Percentages': Percent,
  'Ratios': Divide,
  'Rates': Divide,
  'Proportions, and Units': Divide,
  'Lines, Angles, and Triangles': Shapes,
  'Right Triangles and Trigonometry': Shapes,
  'Circles': Circle,
  'Area and Volume': Box,
  
  // Reading Categories
  'Information and Ideas': BookOpen,
  'Craft and Structure': FileText,
  'Expression of Ideas': PenTool,
  'Standard English Conventions': FlaskRoundIcon,
  
  // Reading Subcategories
  'Central Ideas and Details': BookOpen,
  'Command of Evidence (Textual)': FileText,
  'Command of Evidence (Quantitative)': BarChart,
  'Command of Evidence': FileText,
  'Inferences': Lightbulb,
  'Words in Context': PenTool,
  'Text Structure and Purpose': Network,
  'Text, Structure, and Purpose': Network,
  'Cross-Text Connections': Network,
  'Rhetorical Synthesis': PenTool,
  'Transitions': Network,
  'Boundaries': FlaskRoundIcon,
  'Form, Structure, and Sense': Shapes,
  'Linear Inequalities': Calculator,
};

const masteryColors = {
  'Mastered': '#22c55e',
  'On Track': '#65a30d',
  'Needs Practice': '#dc2626',
  'Not Started': '#6b7280',
  'Needs More Attempts': '#f59e0b'
};

function calculateMasteryLevel(accuracy, totalAttempts) {
  if (totalAttempts === 0) {
    return 'Not Started';
  }
  if (totalAttempts < 2) {
    return 'Needs More Attempts';
  }
  if (accuracy >= 90) {
    return 'Mastered';
  }
  if (accuracy >= 70) {
    return 'On Track';
  }
  return 'Needs Practice';
}

async function fetchSkillPerformance() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.error('No session found');
      throw new Error('No session found');
    }

    console.log('Fetching performance for user:', session.user.id);

    // Get all questions with their domain and subcategory information
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        subject_id,
        domain_id,
        domains!inner (
          id,
          domain_name
        ),
        subcategory_id,
        subcategories!inner (
          id,
          subcategory_name
        )
      `)
      .eq('subject_id', '1'); // 1 is for Math

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return [];
    }

    // Get user's skill analytics
    const { data: skillAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('subject_id', 1);

    if (analyticsError) {
      console.error('Error fetching skill analytics:', analyticsError);
      return [];
    }

    // Group questions by domain and subcategory
    const categoryQuestions = questions.reduce((acc, q) => {
      const key = `${q.domains.domain_name}-${q.subcategories.subcategory_name}`;
      if (!acc[key]) {
        acc[key] = {
          subject_id: q.subject_id,
          domain_name: q.domains.domain_name,
          domain_id: q.domain_id,
          subcategory_name: q.subcategories.subcategory_name,
          subcategory_id: q.subcategory_id,
          questions: new Set()
        };
      }
      acc[key].questions.add(q.id);
      return acc;
    }, {});

    // Calculate performance for each category
    const categoryPerformance = Object.values(categoryQuestions).map(category => {
      // Find analytics for this subcategory
      const analytics = skillAnalytics?.find(a => 
        a.domain_id === category.domain_id && 
        a.subcategory_id === category.subcategory_id
      );

      const totalAttempts = analytics?.total_attempts || 0;
      const correctAnswers = analytics?.correct_attempts || 0;
      const accuracyPercentage = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

      let masteryLevel;
      if (totalAttempts < 5) {
        masteryLevel = 'Needs More Attempts';
      } else if (accuracyPercentage >= 90) {
        masteryLevel = 'Mastered';
      } else if (accuracyPercentage >= 70) {
        masteryLevel = 'On Track';
      } else {
        masteryLevel = 'Needs Practice';
      }

      return {
        subject: 'Math',
        main_category: category.domain_name,
        subcategory: category.subcategory_name,
        total_attempts: totalAttempts,
        correct_answers: correctAnswers,
        accuracy_percentage: accuracyPercentage,
        mastery_level: masteryLevel,
        last_attempt_at: analytics?.last_practiced || null
      };
    });

    // Group by main category (domain)
    const groupedByMainCategory = categoryPerformance.reduce((acc, perf) => {
      if (!acc[perf.main_category]) {
        acc[perf.main_category] = [];
      }
      acc[perf.main_category].push(perf);
      return acc;
    }, {});

    // Calculate main category performance
    return Object.entries(groupedByMainCategory).map(([mainCategory, subcategories]) => {
      const totalAccuracy = subcategories.reduce((sum, sub) => sum + sub.accuracy_percentage, 0);
      const averageAccuracy = Math.round(totalAccuracy / subcategories.length);
      const totalAttempts = subcategories.reduce((sum, sub) => sum + sub.total_attempts, 0);
      
      let categoryMastery;
      if (totalAttempts < 5) {
        categoryMastery = 'Needs More Attempts';
      } else if (averageAccuracy >= 90) {
        categoryMastery = 'Mastered';
      } else if (averageAccuracy >= 70) {
        categoryMastery = 'On Track';
      } else {
        categoryMastery = 'Needs Practice';
      }

      return {
        name: mainCategory,
        subject: 'Math',
        icon: categoryIcons[mainCategory],
        accuracy: averageAccuracy,
        mastery: categoryMastery,
        total_attempts: totalAttempts,
        needsPractice: categoryMastery === 'Needs Practice' || 
                      categoryMastery === 'Needs More Attempts' || 
                      categoryMastery === 'Not Started',
        subcategories: subcategories.map(sub => ({
          name: sub.subcategory,
          icon: categoryIcons[sub.subcategory],
          accuracy: sub.accuracy_percentage,
          lastPracticed: sub.last_attempt_at ? 
            new Date(sub.last_attempt_at).toLocaleDateString() : 
            'Never practiced',
          mastery: sub.mastery_level,
          total_attempts: sub.total_attempts,
          needsPractice: sub.mastery_level === 'Needs Practice' || 
                        sub.mastery_level === 'Needs More Attempts' || 
                        sub.mastery_level === 'Not Started'
        }))
      };
    });

  } catch (error) {
    console.error('Error in fetchSkillPerformance:', error);
    return [];
  }
}

export default function TestCategories() {
  const [skillPerformance, setSkillPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadSkillPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        const data = await fetchSkillPerformance();
        
        // Sort categories by those needing most practice
        const sortedCategories = data
          .filter(category => category && category.subcategories && category.subcategories.length > 0)
          .sort((a, b) => {
            // Sort by mastery level priority
            const masteryPriority = {
              'Needs Practice': 0,
              'Needs More Attempts': 1,
              'Not Started': 2,
              'On Track': 3,
              'Mastered': 4
            };
            
            const aPriority = masteryPriority[a.mastery];
            const bPriority = masteryPriority[b.mastery];
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            
            // If same mastery level, sort by accuracy
            return b.accuracy - a.accuracy;
          })
          .slice(1, 3); // Show top 2 categories

        setSkillPerformance(sortedCategories);
      } catch (error) {
        console.error('Error loading skills:', error);
        setError(error.message);
        setSkillPerformance([]);
      } finally {
        setLoading(false);
      }
    };

    loadSkillPerformance();
  }, [router]);

  const handleSkillClick = async (category, subcategory) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      // Instead of navigating directly, show the difficulty modal
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      setShowDifficultyModal(true);
    } catch (error) {
      console.error('Error in handleSkillClick:', error);
      router.push('/login');
    }
  };

  const handleDifficultyModalClose = () => {
    setShowDifficultyModal(false);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  if (loading) {
    return <div style={styles.container}>Loading skills data...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Targeted Practice</h2>
      <div style={styles.categories}>
        {skillPerformance.map((category) => (
          <div key={category.name} style={styles.categorySection}>
            <div style={styles.categoryHeader}>
              <category.icon style={styles.categoryIcon} />
              <h3 style={styles.categoryTitle}>{category.name}</h3>
              <span style={styles.categoryAccuracy}>
                {category.accuracy}% mastery
              </span>
            </div>
            <div style={styles.grid}>
              {category.subcategories.map((skill) => {
                // Add a fallback icon if skill.icon is undefined
                const Icon = skill.icon || Calculator; // Use Calculator as fallback
                const masteryColor = masteryColors[skill.mastery];
                
                return (
                  <div 
                    key={skill.name} 
                    style={{
                      ...styles.card,
                      borderLeft: `3px solid ${masteryColor}`
                    }}
                    onClick={() => handleSkillClick(category.name, skill.name)}
                  >
                    <Icon style={{ ...styles.icon, color: masteryColor }} />
                    <span style={styles.label}>{skill.name}</span>
                    <div style={styles.stats}>
                      <span style={styles.accuracy}>
                        {skill.accuracy}% accuracy
                      </span>
                      <span style={{ ...styles.mastery, color: masteryColor }}>
                        {skill.mastery}
                      </span>
                      <span style={styles.lastPracticed}>
                        Last: {skill.lastPracticed}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <Link href="/skills" style={styles.seeMoreLink}>
        <div style={styles.viewAllButton}>
          <BookOpen style={styles.viewAllIcon} />
          <span style={styles.viewAllText}>View All Skills</span>
          <ArrowRight style={styles.viewAllArrow} />
        </div>
      </Link>

      {/* Add the DifficultyModal component */}
      {showDifficultyModal && (
        <DifficultyModal
          isOpen={showDifficultyModal}
          onClose={handleDifficultyModalClose}
          subject="1" // Assuming Math subject
          title={`Select Difficulty Level for ${selectedSubcategory}`}
          mode="skill"
          category={selectedSubcategory}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "#111827",
  },
  categories: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  categorySection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0",
  },
  categoryIcon: {
    width: "20px",
    height: "20px",
    color: "#4b5563",
  },
  categoryTitle: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#111827",
    flex: 1,
  },
  categoryAccuracy: {
    fontSize: "14px",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  icon: {
    width: "24px",
    height: "24px",
    marginBottom: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: 500,
    marginBottom: "8px",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    width: "100%",
  },
  accuracy: {
    fontSize: "12px",
    color: "#6b7280",
  },
  mastery: {
    fontSize: "12px",
    fontWeight: 500,
  },
  lastPracticed: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  seeMoreLink: {
    textDecoration: "none",
    display: "block",
    marginTop: "24px",
  },
  viewAllButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "12px 20px",
    transition: "all 0.2s ease",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    "&:hover": {
      backgroundColor: "#e5e7eb",
      transform: "translateY(-1px)",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
  },
  viewAllIcon: {
    width: "20px",
    height: "20px",
    color: "#4b5563",
    marginRight: "10px",
  },
  viewAllText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#374151",
    flex: "1",
  },
  viewAllArrow: {
    width: "18px",
    height: "18px",
    color: "#4b5563",
  },
};

