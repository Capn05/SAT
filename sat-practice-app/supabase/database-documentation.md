# SAT Prep App Database Documentation

This document provides a comprehensive overview of the SAT Prep App database structure, including all tables, their columns, and the read/write operations for each feature.

## Important Migration Notes

1. **Table Rename**: The `categories` table has been replaced by a table called `domains`. Any references to `categories` should be updated to use `domains`.

2. **ID Changes**: The IDs for `subjects`, `domains`, and `subcategories` have all been reassigned during the migration. If any IDs were hardcoded in the application, these references need to be updated to match the new IDs.

3. **Difficulty Format**: The `difficulty` field is stored as TEXT in all tables, not INTEGER (e.g., 'easy', 'medium', 'hard').

## Database Schema

### Core Content Tables

**Note**: These tables replace the previous structure. The `categories` table has been replaced by `domains`, and all IDs have been reassigned.

#### subjects
Stores the main SAT subjects.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| subject_name | TEXT | Name of the subject (Math, Reading & Writing) |

#### domains
Stores the domains (categories) within each subject.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| subject_id | INTEGER | Foreign key to subjects.id |
| domain_name | TEXT | Name of the domain |

#### subcategories
Stores specific skills within each domain.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| domain_id | INTEGER | Foreign key to domains.id |
| subcategory_name | TEXT | Name of the subcategory/skill |

#### questions
Stores all SAT practice questions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| question_text | TEXT | Content of the question |
| image_url | TEXT | URL to any image associated with the question (can be NULL) |
| difficulty | TEXT | Difficulty level of the question ('easy', 'medium', 'hard') |
| test_module_id | INTEGER | Foreign key to test_modules.id (can be NULL if not part of a test) |
| subject_id | INTEGER | Foreign key to subjects.id |
| domain_id | INTEGER | Foreign key to domains.id |
| subcategory_id | INTEGER | Foreign key to subcategories.id |

#### options
Stores answer choices for each question.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| question_id | INTEGER | Foreign key to questions.id |
| value | TEXT | Value identifier for the option |
| label | TEXT | Display text for the option |
| is_correct | BOOLEAN | Whether this option is the correct answer |

### Practice Test Structure

**Note**: These are new tables that weren't in the previous database structure.

#### practice_tests
Defines complete practice tests for a specific subject.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| subject_id | INTEGER | Foreign key to subjects.id |
| name | TEXT | Name of the practice test |

#### test_modules
Defines modules within practice tests.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| practice_test_id | INTEGER | Foreign key to practice_tests.id |
| module_number | INTEGER | Module number (1 or 2) |
| is_harder | BOOLEAN | NULL for module 1, TRUE/FALSE for module 2 (indicating difficulty) |

### User Activity Tracking

**Note**: These replace any previous user tracking tables and use Supabase Auth's UUID for user identification.

#### user_answers
Records every question answered by a user.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | UUID | Foreign key to auth.users.id |
| question_id | INTEGER | Foreign key to questions.id |
| selected_option_id | INTEGER | Foreign key to options.id |
| is_correct | BOOLEAN | Whether the user's answer was correct |
| practice_type | TEXT | Type of practice ('quick', 'test', 'skills') |
| answered_at | TIMESTAMP | When the question was answered |
| test_id | INTEGER | Foreign key to practice_tests.id (NULL for quick/skills practice) |

#### user_skill_analytics
Aggregated performance metrics by skill area.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | UUID | Foreign key to auth.users.id |
| subject_id | INTEGER | Foreign key to subjects.id |
| domain_id | INTEGER | Foreign key to domains.id |
| subcategory_id | INTEGER | Foreign key to subcategories.id |
| total_attempts | INTEGER | Total number of questions attempted in this subcategory |
| correct_attempts | INTEGER | Number of correct answers in this subcategory |
| last_practiced | TIMESTAMP | When the user last practiced this subcategory |
| mastery_level | TEXT | Calculated proficiency ('needs_work', 'improving', 'proficient', 'mastered') |

#### user_test_analytics
Tracks completed practice test performance.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | UUID | Foreign key to auth.users.id |
| practice_test_id | INTEGER | Foreign key to practice_tests.id |
| taken_at | TIMESTAMP | When the test was taken |
| module1_score | REAL | Score percentage for module 1 |
| module2_score | REAL | Score percentage for module 2 |
| used_harder_module | BOOLEAN | Whether module 2 was the harder version |
| total_score | REAL | Overall test score percentage |

## Operations by Feature

### 1. Quick Practice

**Description**: User studies a random set of 15 questions for either of the 2 subjects based on selected difficulty.

#### Read Operations:
```sql
-- Fetch 15 random questions for a specific subject and difficulty
SELECT q.*, s.subject_name, d.domain_name, sc.subcategory_name
FROM questions q
JOIN subjects s ON q.subject_id = s.id
JOIN domains d ON q.domain_id = d.id
JOIN subcategories sc ON q.subcategory_id = sc.id
WHERE q.subject_id = $subject_id AND q.difficulty = $difficulty_text -- 'easy', 'medium', or 'hard'
ORDER BY RANDOM() 
LIMIT 15;

-- For each question, fetch its options
SELECT * FROM options
WHERE question_id IN ($question_ids);
```

#### Write Operations:
```sql
-- Record each user answer
INSERT INTO user_answers (
  user_id, 
  question_id, 
  selected_option_id, 
  is_correct, 
  practice_type,
  test_id
) VALUES (
  $user_id, 
  $question_id, 
  $selected_option_id, 
  $is_correct, 
  'quick',
  NULL
);

-- Update user_skill_analytics (upsert pattern)
INSERT INTO user_skill_analytics (
  user_id, 
  subject_id, 
  domain_id, 
  subcategory_id, 
  total_attempts, 
  correct_attempts, 
  last_practiced,
  mastery_level
) VALUES (
  $user_id, 
  $subject_id, 
  $domain_id, 
  $subcategory_id, 
  1, 
  $is_correct::int, 
  CURRENT_TIMESTAMP,
  $mastery_level
)
ON CONFLICT (user_id, subcategory_id) 
DO UPDATE SET
  total_attempts = user_skill_analytics.total_attempts + 1,
  correct_attempts = user_skill_analytics.correct_attempts + $is_correct::int,
  last_practiced = CURRENT_TIMESTAMP,
  mastery_level = $mastery_level;
```

### 2. Timed Practice Tests

**Description**: User takes a complete practice test with two modules. Module 1 is a mix of question difficulties, and based on performance, the user is routed to one of two possible tests for Module 2.

#### Read Operations:
```sql
-- Get available practice tests for a subject
SELECT * FROM practice_tests
WHERE subject_id = $subject_id;

-- Get Module 1 for a specific practice test
SELECT tm.id AS module_id
FROM test_modules tm
WHERE tm.practice_test_id = $practice_test_id 
  AND tm.module_number = 1;

-- Get questions for Module 1
SELECT q.*, s.subject_name, d.domain_name, sc.subcategory_name
FROM questions q
JOIN subjects s ON q.subject_id = s.id
JOIN domains d ON q.domain_id = d.id
JOIN subcategories sc ON q.subcategory_id = sc.id
WHERE q.test_module_id = $module_id
ORDER BY q.id;

-- Get options for Module 1 questions
SELECT * FROM options
WHERE question_id IN ($question_ids);

-- Based on Module 1 performance, get the appropriate Module 2
SELECT tm.id AS module_id
FROM test_modules tm
WHERE tm.practice_test_id = $practice_test_id 
  AND tm.module_number = 2
  AND tm.is_harder = $is_harder; -- TRUE for harder module, FALSE for easier module

-- Get questions for Module 2
SELECT q.*, s.subject_name, d.domain_name, sc.subcategory_name
FROM questions q
JOIN subjects s ON q.subject_id = s.id
JOIN domains d ON q.domain_id = d.id
JOIN subcategories sc ON q.subcategory_id = sc.id
WHERE q.test_module_id = $module_id
ORDER BY q.id;

-- Get options for Module 2 questions
SELECT * FROM options
WHERE question_id IN ($question_ids);
```

#### Write Operations:
```sql
-- Record each user answer during the test
INSERT INTO user_answers (
  user_id, 
  question_id, 
  selected_option_id, 
  is_correct, 
  practice_type,
  test_id
) VALUES (
  $user_id, 
  $question_id, 
  $selected_option_id, 
  $is_correct, 
  'test',
  $practice_test_id
);

-- At completion, record test analytics
INSERT INTO user_test_analytics (
  user_id,
  practice_test_id,
  module1_score,
  module2_score,
  used_harder_module,
  total_score
) VALUES (
  $user_id,
  $practice_test_id,
  $module1_score,
  $module2_score,
  $used_harder_module,
  $total_score
);

-- Update user_skill_analytics for each question (same upsert as in Quick Practice)
-- This should be done for each question answered
INSERT INTO user_skill_analytics (...) 
VALUES (...) 
ON CONFLICT (user_id, subcategory_id) 
DO UPDATE SET ...;
```

### 3. Targeted Skills Practice

**Description**: User studies a random set of 15 questions for any subcategory among all domains of both subjects.

#### Read Operations:
```sql
-- Fetch 15 random questions for a specific subcategory
SELECT q.*, s.subject_name, d.domain_name, sc.subcategory_name
FROM questions q
JOIN subjects s ON q.subject_id = s.id
JOIN domains d ON q.domain_id = d.id
JOIN subcategories sc ON q.subcategory_id = sc.id
WHERE q.subcategory_id = $subcategory_id
ORDER BY RANDOM() 
LIMIT 15;

-- For each question, fetch its options
SELECT * FROM options
WHERE question_id IN ($question_ids);
```

#### Write Operations:
```sql
-- Record each user answer
INSERT INTO user_answers (
  user_id, 
  question_id, 
  selected_option_id, 
  is_correct, 
  practice_type,
  test_id
) VALUES (
  $user_id, 
  $question_id, 
  $selected_option_id, 
  $is_correct, 
  'skills',
  NULL
);

-- Update user_skill_analytics (same upsert pattern as before)
INSERT INTO user_skill_analytics (...) 
VALUES (...) 
ON CONFLICT (user_id, subcategory_id) 
DO UPDATE SET ...;
```

### 4. Dashboard & Analytics

**Description**: Display user performance metrics across subjects, domains, and subcategories.

#### Read Operations:
```sql
-- Get overall subject performance
SELECT 
  s.id, 
  s.subject_name,
  COUNT(ua.id) AS total_questions,
  SUM(ua.is_correct::int) AS correct_answers,
  ROUND((SUM(ua.is_correct::int) * 100.0 / COUNT(ua.id)), 1) AS accuracy_percentage
FROM subjects s
LEFT JOIN user_answers ua ON ua.question_id IN (
  SELECT id FROM questions WHERE subject_id = s.id
) AND ua.user_id = $user_id
GROUP BY s.id, s.subject_name;

-- Get domain performance within a subject
SELECT 
  d.id, 
  d.domain_name,
  COUNT(ua.id) AS total_questions,
  SUM(ua.is_correct::int) AS correct_answers,
  ROUND((SUM(ua.is_correct::int) * 100.0 / NULLIF(COUNT(ua.id), 0)), 1) AS accuracy_percentage
FROM domains d
LEFT JOIN user_answers ua ON ua.question_id IN (
  SELECT id FROM questions WHERE domain_id = d.id
) AND ua.user_id = $user_id
WHERE d.subject_id = $subject_id
GROUP BY d.id, d.domain_name;

-- Get subcategory performance within a domain
SELECT 
  sc.id, 
  sc.subcategory_name,
  usa.total_attempts,
  usa.correct_attempts,
  ROUND((usa.correct_attempts * 100.0 / NULLIF(usa.total_attempts, 0)), 1) AS accuracy_percentage,
  usa.mastery_level,
  usa.last_practiced
FROM subcategories sc
LEFT JOIN user_skill_analytics usa ON usa.subcategory_id = sc.id AND usa.user_id = $user_id
WHERE sc.domain_id = $domain_id
ORDER BY sc.subcategory_name;

-- Get recent test performance
SELECT 
  pt.name,
  uta.module1_score,
  uta.module2_score,
  uta.total_score,
  uta.used_harder_module,
  uta.taken_at
FROM user_test_analytics uta
JOIN practice_tests pt ON uta.practice_test_id = pt.id
WHERE uta.user_id = $user_id
ORDER BY uta.taken_at DESC
LIMIT 5;
```

## Implementation Notes

### Calculating Mastery Level

The `mastery_level` in the `user_skill_analytics` table should be calculated based on accuracy percentage:

- 'needs_work': < 60% correct
- 'improving': 60-79% correct
- 'proficient': 80-89% correct
- 'mastered': 90%+ correct

### Module 2 Routing Logic

The decision for routing to easier or harder Module 2 should be based on Module 1 performance:

- Score < 70%: Route to easier Module 2 (is_harder = FALSE)
- Score ≥ 70%: Route to harder Module 2 (is_harder = TRUE)

### Practice Test Time Limits

While not stored in the database, these should be enforced in the application:

- For Reading & Writing: 32 minutes, 27 questions per module
- For Math: 35 minutes, 22 questions per module

### User Authentication

The app uses Supabase Auth, which provides:

- `auth.users` table for user management
- JWT tokens for session management
- Row-level security (RLS) policies

All user_id values in the database are UUID references to auth.users table.
