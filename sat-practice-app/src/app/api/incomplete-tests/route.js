import { supabase } from '../../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
  }

  // Fetch completed tests for the user
  const { data: completedTests, error: completedError } = await supabase
    .from('user_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress');

  if (completedError) {
    return new Response(JSON.stringify({ error: completedError.message }), { status: 500 });
  }

  // Fetch all tests
  const { data: allTests, error: allError } = await supabase
    .from('tests')
    .select('*');

  if (allError) {
    return new Response(JSON.stringify({ error: allError.message }), { status: 500 });
  }

  // Filter out completed tests
  const completedTestIds = completedTests.map(test => test.test_id);
  const incompleteTests = allTests.filter(test => !completedTestIds.includes(test.id));

  return new Response(JSON.stringify(completedTests), { status: 200 });
}
