-- Create enum types for main categories
CREATE TYPE subject_category AS ENUM (
  'Math',
  'Reading & Writing'
);

CREATE TYPE math_category AS ENUM (
  'Algebra',
  'Advanced Math',
  'Problem Solving'
);

CREATE TYPE reading_category AS ENUM (
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions'
);

-- Create enum type for subcategories
CREATE TYPE skill_subcategory AS ENUM (
  -- Math - Algebra
  'Linear Equations',
  'Systems of Equations',
  -- Math - Advanced Math
  'Quadratic Equations',
  'Exponential Functions',
  -- Math - Problem Solving
  'Geometry & Trigonometry',
  'Data Analysis',
  -- Reading - Information and Ideas
  'Central Ideas and Details',
  'Command of Evidence (Textual)',
  'Command of Evidence (Quantitative)',
  'Inferences',
  -- Reading - Craft and Structure
  'Words in Context',
  'Text Structure and Purpose',
  'Cross-Text Connections',
  -- Reading - Expression of Ideas
  'Rhetorical Synthesis',
  'Transitions',
  -- Reading - Standard English Conventions
  'Boundaries',
  'Form, Structure, and Sense'
);

-- Create a table for skill categories
CREATE TABLE IF NOT EXISTS skill_categories (
  id SERIAL PRIMARY KEY,
  subject subject_category NOT NULL,
  main_category TEXT NOT NULL,
  subcategory skill_subcategory NOT NULL,
  UNIQUE (subject, main_category, subcategory)
);

-- Insert the category hierarchy
INSERT INTO skill_categories (subject, main_category, subcategory) VALUES
  -- Math Categories
  ('Math', 'Algebra', 'Linear Equations'),
  ('Math', 'Algebra', 'Systems of Equations'),
  ('Math', 'Advanced Math', 'Quadratic Equations'),
  ('Math', 'Advanced Math', 'Exponential Functions'),
  ('Math', 'Problem Solving', 'Geometry & Trigonometry'),
  ('Math', 'Problem Solving', 'Data Analysis'),
  -- Reading & Writing Categories
  ('Reading & Writing', 'Information and Ideas', 'Central Ideas and Details'),
  ('Reading & Writing', 'Information and Ideas', 'Command of Evidence (Textual)'),
  ('Reading & Writing', 'Information and Ideas', 'Command of Evidence (Quantitative)'),
  ('Reading & Writing', 'Information and Ideas', 'Inferences'),
  ('Reading & Writing', 'Craft and Structure', 'Words in Context'),
  ('Reading & Writing', 'Craft and Structure', 'Text Structure and Purpose'),
  ('Reading & Writing', 'Craft and Structure', 'Cross-Text Connections'),
  ('Reading & Writing', 'Expression of Ideas', 'Rhetorical Synthesis'),
  ('Reading & Writing', 'Expression of Ideas', 'Transitions'),
  ('Reading & Writing', 'Standard English Conventions', 'Boundaries'),
  ('Reading & Writing', 'Standard English Conventions', 'Form, Structure, and Sense')
ON CONFLICT DO NOTHING;

-- Modify questions table to use the new category structure
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS subject subject_category,
  ADD COLUMN IF NOT EXISTS main_category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory skill_subcategory;

-- Create materialized view for skill performance tracking with the new structure
CREATE MATERIALIZED VIEW skill_performance AS
WITH user_skill_stats AS (
  SELECT 
    ua.user_id,
    q.subject,
    q.main_category,
    q.subcategory,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) as correct_answers,
    MAX(ua.created_at) as last_attempt_at
  FROM user_answers ua
  JOIN questions q ON ua.question_id = q.id
  WHERE q.subcategory IS NOT NULL
  GROUP BY ua.user_id, q.subject, q.main_category, q.subcategory
),
user_category_stats AS (
  SELECT
    user_id,
    subject,
    main_category,
    COUNT(*) as total_category_attempts,
    SUM(correct_answers) as total_category_correct
  FROM user_skill_stats
  GROUP BY user_id, subject, main_category
)
SELECT 
  uss.user_id,
  uss.subject,
  uss.main_category,
  uss.subcategory,
  uss.total_attempts,
  uss.correct_answers,
  ROUND((uss.correct_answers::float / NULLIF(uss.total_attempts, 0)) * 100, 2) as accuracy_percentage,
  uss.last_attempt_at,
  ucs.total_category_attempts,
  ucs.total_category_correct,
  ROUND((ucs.total_category_correct::float / NULLIF(ucs.total_category_attempts, 0)) * 100, 2) as category_accuracy,
  CASE 
    WHEN (uss.correct_answers::float / NULLIF(uss.total_attempts, 0)) < 0.7 THEN true
    WHEN uss.total_attempts < 5 THEN true  -- Need more practice if fewer than 5 attempts
    ELSE false
  END as needs_practice,
  CASE
    WHEN (uss.correct_answers::float / NULLIF(uss.total_attempts, 0)) >= 0.9 THEN 'Mastered'
    WHEN (uss.correct_answers::float / NULLIF(uss.total_attempts, 0)) >= 0.7 THEN 'On Track'
    WHEN uss.total_attempts = 0 THEN 'Not Started'
    ELSE 'Needs Practice'
  END as mastery_level
FROM user_skill_stats uss
LEFT JOIN user_category_stats ucs ON 
  uss.user_id = ucs.user_id AND 
  uss.subject = ucs.subject AND 
  uss.main_category = ucs.main_category;

-- Create indexes for better performance
CREATE INDEX idx_skill_performance_user_subject ON skill_performance (user_id, subject);
CREATE INDEX idx_skill_performance_category ON skill_performance (user_id, main_category);
CREATE INDEX idx_skill_performance_subcategory ON skill_performance (user_id, subcategory);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_skill_performance()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY skill_performance;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the materialized view
DROP TRIGGER IF EXISTS refresh_skill_performance_trigger ON user_answers;
CREATE TRIGGER refresh_skill_performance_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_answers
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_skill_performance();

-- Create function to get skill performance for a user
CREATE OR REPLACE FUNCTION get_user_skill_performance(p_user_id uuid)
RETURNS TABLE (
  subject subject_category,
  main_category TEXT,
  subcategory skill_subcategory,
  total_attempts integer,
  correct_answers integer,
  accuracy_percentage numeric,
  last_attempt_at timestamptz,
  category_accuracy numeric,
  needs_practice boolean,
  mastery_level text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.subject,
    sp.main_category,
    sp.subcategory,
    sp.total_attempts,
    sp.correct_answers,
    sp.accuracy_percentage,
    sp.last_attempt_at,
    sp.category_accuracy,
    sp.needs_practice,
    sp.mastery_level
  FROM skill_performance sp
  WHERE sp.user_id = p_user_id
  ORDER BY 
    sp.needs_practice DESC,
    sp.last_attempt_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql; 