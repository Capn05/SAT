'use client';
import { useEffect, useState } from 'react';
import { 
  BookOpen, Calculator, FlaskRoundIcon as Flask, PenTool, Brain, 
  FunctionSquare, PieChart, Shapes, BarChart, FileText, Lightbulb, 
  NetworkIcon as Network, ArrowRight, Sigma, Infinity, Ruler, 
  Percent, Divide, LineChart, CircleSquare, Box
} from "lucide-react";
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

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
  'Circles': CircleSquare,
  'Area and Volume': Box,
  
  // Reading Categories
  'Information and Ideas': BookOpen,
  'Craft and Structure': FileText,
  'Expression of Ideas': PenTool,
  'Standard English Conventions': Flask,
  
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
  'Boundaries': Flask,
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

    // Get all questions to ensure we have complete category data
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject_id, main_category, subcategory')
      .eq('subject_id', '1'); // 1 is for Math

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return [];
    }

    // Get all user answers
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', session.user.id);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return [];
    }

    // Group questions by category
    const categoryQuestions = questions.reduce((acc, q) => {
      const key = `${q.main_category}-${q.subcategory}`;
      if (!acc[key]) {
        acc[key] = {
          subject_id: q.subject_id,
          main_category: q.main_category,
          subcategory: q.subcategory,
          questions: new Set()
        };
      }
      acc[key].questions.add(q.id);
      return acc;
    }, {});

    // Calculate performance for each category
    const categoryPerformance = Object.values(categoryQuestions).map(category => {
      // Filter answers for this category's questions
      const categoryAnswers = answers.filter(a => 
        category.questions.has(a.question_id)
      );

      // Get unique question attempts
      const uniqueAttempts = new Map();
      categoryAnswers.forEach(answer => {
        if (!uniqueAttempts.has(answer.question_id)) {
          uniqueAttempts.set(answer.question_id, answer.is_correct);
        }
      });

      const totalAttempts = uniqueAttempts.size;
      const correctAnswers = Array.from(uniqueAttempts.values()).filter(isCorrect => isCorrect).length;
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
        main_category: category.main_category,
        subcategory: category.subcategory,
        total_attempts: totalAttempts,
        correct_answers: correctAnswers,
        accuracy_percentage: accuracyPercentage,
        mastery_level: masteryLevel,
        last_attempt_at: categoryAnswers.length > 0 ? 
          Math.max(...categoryAnswers.map(a => new Date(a.answered_at).getTime())) : 
          null
      };
    });

    // Group by main category
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

      const url = `/practice?mode=skill&subject=1&category=${encodeURIComponent(subcategory)}`;
      window.location.href = url;
    } catch (error) {
      console.error('Error in handleSkillClick:', error);
      router.push('/login');
    }
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
      <Link href="/skills" style={styles.seeMoreText}>
        <div style={styles.seeMore}>
          All Skills<ArrowRight style={styles.arrowIcon} />
        </div>
      </Link>
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
  seeMore: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "24px",
    cursor: "pointer",
    color: "#374151",
    fontSize: "14px",
  },
  arrowIcon: {
    marginLeft: "8px",
    width: "16px",
    height: "16px",
  },
  seeMoreText: {
    textDecoration: "none",
  },
};

