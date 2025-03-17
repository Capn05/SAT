-- Create the paused_tests table to store test progress
CREATE TABLE IF NOT EXISTS paused_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_test_id INTEGER NOT NULL REFERENCES practice_tests(id) ON DELETE CASCADE,
  test_module_id INTEGER NOT NULL REFERENCES test_modules(id) ON DELETE CASCADE,
  current_question INTEGER NOT NULL,
  time_remaining INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  flagged_questions JSONB NOT NULL DEFAULT '[]',
  paused_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Add a unique constraint to ensure a user can only have one paused test per module
  UNIQUE (user_id, practice_test_id, test_module_id)
);

-- Add permissions for authenticated users
ALTER TABLE paused_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own paused tests"
  ON paused_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paused tests"
  ON paused_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paused tests"
  ON paused_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paused tests"
  ON paused_tests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 