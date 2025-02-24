-- Update Math questions with proper categories
UPDATE questions
SET 
  subject = 'Math',
  main_category = CASE
    WHEN question_text LIKE '%equation%' OR question_text LIKE '%solve for%' OR question_text LIKE '%linear%' 
    THEN 'Algebra'
    WHEN question_text LIKE '%quadratic%' OR question_text LIKE '%exponential%' OR question_text LIKE '%function%'
    THEN 'Advanced Math'
    WHEN question_text LIKE '%triangle%' OR question_text LIKE '%circle%' OR question_text LIKE '%geometry%' OR
         question_text LIKE '%graph%' OR question_text LIKE '%data%' OR question_text LIKE '%statistics%'
    THEN 'Problem Solving'
    ELSE 'Algebra' -- Default category for other math questions
  END,
  subcategory = CASE
    -- Algebra subcategories
    WHEN question_text LIKE '%linear%' OR question_text LIKE '%solve for%'
    THEN 'Linear Equations'
    WHEN question_text LIKE '%system%' OR question_text LIKE '%equations%'
    THEN 'Systems of Equations'
    -- Advanced Math subcategories
    WHEN question_text LIKE '%quadratic%'
    THEN 'Quadratic Equations'
    WHEN question_text LIKE '%exponential%' OR question_text LIKE '%function%'
    THEN 'Exponential Functions'
    -- Problem Solving subcategories
    WHEN question_text LIKE '%triangle%' OR question_text LIKE '%circle%' OR question_text LIKE '%geometry%'
    THEN 'Geometry & Trigonometry'
    WHEN question_text LIKE '%graph%' OR question_text LIKE '%data%' OR question_text LIKE '%statistics%'
    THEN 'Data Analysis'
    ELSE 'Linear Equations' -- Default subcategory for other math questions
  END
WHERE subject_id = 1;

-- Update Reading & Writing questions with proper categories
UPDATE questions
SET 
  subject = 'Reading & Writing',
  main_category = CASE
    WHEN question_text LIKE '%main idea%' OR question_text LIKE '%evidence%' OR question_text LIKE '%inference%'
    THEN 'Information and Ideas'
    WHEN question_text LIKE '%word choice%' OR question_text LIKE '%structure%' OR question_text LIKE '%purpose%'
    THEN 'Craft and Structure'
    WHEN question_text LIKE '%synthesis%' OR question_text LIKE '%transition%'
    THEN 'Expression of Ideas'
    WHEN question_text LIKE '%grammar%' OR question_text LIKE '%punctuation%' OR question_text LIKE '%sentence%'
    THEN 'Standard English Conventions'
    ELSE 'Information and Ideas' -- Default category for other reading questions
  END,
  subcategory = CASE
    -- Information and Ideas subcategories
    WHEN question_text LIKE '%main idea%' OR question_text LIKE '%central%'
    THEN 'Central Ideas and Details'
    WHEN question_text LIKE '%evidence%' AND question_text LIKE '%text%'
    THEN 'Command of Evidence (Textual)'
    WHEN question_text LIKE '%evidence%' AND question_text LIKE '%data%'
    THEN 'Command of Evidence (Quantitative)'
    WHEN question_text LIKE '%inference%'
    THEN 'Inferences'
    -- Craft and Structure subcategories
    WHEN question_text LIKE '%word choice%' OR question_text LIKE '%meaning%'
    THEN 'Words in Context'
    WHEN question_text LIKE '%structure%' OR question_text LIKE '%purpose%'
    THEN 'Text Structure and Purpose'
    WHEN question_text LIKE '%connection%' OR question_text LIKE '%compare%'
    THEN 'Cross-Text Connections'
    -- Expression of Ideas subcategories
    WHEN question_text LIKE '%synthesis%'
    THEN 'Rhetorical Synthesis'
    WHEN question_text LIKE '%transition%'
    THEN 'Transitions'
    -- Standard English Conventions subcategories
    WHEN question_text LIKE '%punctuation%' OR question_text LIKE '%sentence boundary%'
    THEN 'Boundaries'
    WHEN question_text LIKE '%grammar%' OR question_text LIKE '%structure%'
    THEN 'Form, Structure, and Sense'
    ELSE 'Central Ideas and Details' -- Default subcategory for other reading questions
  END
WHERE subject_id = 2; 