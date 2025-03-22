-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'subscription', 'feature', 'bug', 'content')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_type_idx ON feedback(feedback_type);
CREATE INDEX feedback_created_at_idx ON feedback(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback" 
  ON feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only create feedback for themselves
CREATE POLICY "Users can insert their own feedback" 
  ON feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can't update or delete feedback
CREATE POLICY "Users cannot update feedback" 
  ON feedback 
  FOR UPDATE 
  USING (false);

CREATE POLICY "Users cannot delete feedback" 
  ON feedback 
  FOR DELETE 
  USING (false);

-- Admins can view all feedback
-- Uncomment and customize this if you add an admin role system
-- CREATE POLICY "Admins can view all feedback" 
--   ON feedback 
--   FOR SELECT 
--   USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create a function to notify when new feedback is submitted (if you want email notifications)
CREATE OR REPLACE FUNCTION notify_feedback_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- You could integrate with a service like Supabase Edge Functions to send notifications
  -- Or use pg_notify for internal notification systems
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the notification function
CREATE TRIGGER on_feedback_submitted
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_submission(); 