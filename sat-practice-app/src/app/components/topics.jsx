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
  'Improving': '#65a30d',
  'Needs Work': '#dc2626',
  'Needs More Attempts': '#f59e0b',
  'Not Started': '#6b7280'
};

// Add styles object
const styles = {
  container: {
    padding: '1rem',
    maxWidth: '100%',
    margin: '0 auto'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    fontFamily: '"Myriad Pro", Arial, sans-serif'
  },
  categories: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  categoryIcon: {
    color: '#4b5563'
  },
  categoryTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
    fontFamily: '"Myriad Pro", Arial, sans-serif'
  },
  categoryAccuracy: {
    marginLeft: 'auto',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '0.75rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)'
    }
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  skillName: {
    fontWeight: '500',
    fontSize: '0.9rem',
    fontFamily: '"Myriad Pro", Arial, sans-serif'
  },
  skillStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem'
  },
  statLabel: {
    color: '#6b7280'
  },
  statValue: {
    fontWeight: '500'
  },
  skillFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '0.5rem',
    borderTop: '1px solid #f3f4f6'
  },
  practiceText: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#4f46e5'
  },
  seeMoreLink: {
    textDecoration: 'none',
    display: 'block',
    marginTop: '2rem'
  },
  viewAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    padding: '0.75rem 1.5rem',
    width: 'fit-content',
    margin: '0 auto',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e5e7eb'
    }
  },
  viewAllIcon: {
    color: '#4b5563'
  },
  viewAllText: {
    fontWeight: '500',
    color: '#4b5563',
    fontFamily: '"Myriad Pro", Arial, sans-serif'
  },
  viewAllArrow: {
    color: '#4b5563'
  }
};

function calculateMasteryLevel(accuracy, totalAttempts) {
  if (totalAttempts === 0) {
    return 'Not Started';
  }
  if (totalAttempts < 5) {
    return 'Needs More Attempts';
  }
  if (accuracy >= 85) {
    return 'Mastered';
  }
  if (accuracy >= 60) {
    return 'Improving';
  }
  return 'Needs Work';
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

      // Apply our updated mastery level calculation
      const masteryLevel = calculateMasteryLevel(accuracyPercentage, totalAttempts);

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
      
      // Apply our updated mastery level calculation to the main category
      const categoryMastery = calculateMasteryLevel(averageAccuracy, totalAttempts);

      return {
        name: mainCategory,
        subject: 'Math',
        icon: categoryIcons[mainCategory],
        accuracy: averageAccuracy,
        mastery: categoryMastery,
        total_attempts: totalAttempts,
        needsPractice: categoryMastery === 'Needs Work' || categoryMastery === 'Improving',
        subcategories: subcategories.map(sub => ({
          name: sub.subcategory,
          icon: categoryIcons[sub.subcategory],
          accuracy: sub.accuracy_percentage,
          lastPracticed: sub.last_attempt_at ? 
            new Date(sub.last_attempt_at).toLocaleDateString() : 
            'Never practiced',
          mastery: sub.mastery_level,
          total_attempts: sub.total_attempts,
          needsPractice: sub.mastery_level === 'Needs Work' || sub.mastery_level === 'Improving'
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
              'Needs Work': 0,
              'Improving': 1,
              'Proficient': 2,
              'Mastered': 3,
              'Not Started': 4
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
                
                // Add tooltip text based on mastery level
                let tooltipText = '';
                if (skill.mastery === 'Not Started') {
                  tooltipText = 'You have not practiced this skill yet.';
                } else if (skill.mastery === 'Needs More Attempts') {
                  tooltipText = 'You need to attempt at least 5 questions in this skill to get a true mastery level.';
                } else if (skill.mastery === 'Needs Work') {
                  tooltipText = 'Your accuracy is below 60%. Keep practicing to improve this skill.';
                } else if (skill.mastery === 'Improving') {
                  tooltipText = 'Your accuracy is between 60-85%. You\'re making good progress with this skill.';
                } else if (skill.mastery === 'Mastered') {
                  tooltipText = 'Great job! You\'ve mastered this skill with 85% or higher accuracy.';
                }
                
                return (
                  <div 
                    key={skill.name} 
                    style={{
                      ...styles.card,
                      borderLeft: `3px solid ${masteryColor}`
                    }}
                    onClick={() => handleSkillClick(category.name, skill.name)}
                    title={tooltipText}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.iconContainer}>
                        <Icon style={{ color: masteryColor }} />
                      </div>
                      <span style={styles.skillName}>{skill.name}</span>
                    </div>
                    <div style={styles.skillStats}>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>Accuracy:</span>
                        <span style={styles.statValue}>{skill.accuracy}%</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>Last Practice:</span>
                        <span style={styles.statValue}>{skill.lastPracticed}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>Status:</span>
                        <span style={{
                          ...styles.statValue,
                          color: masteryColor,
                          fontWeight: 600
                        }}>
                          {skill.mastery}
                        </span>
                      </div>
                    </div>
                    <div style={styles.skillFooter}>
                      <span style={styles.practiceText}>Practice Now</span>
                      <ArrowRight size={16} />
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
          title={`Select Difficulty Level for ${selectedCategory} - ${selectedSubcategory}`}
          mode="skill"
          category={selectedSubcategory}
        />
      )}
    </div>
  );
}