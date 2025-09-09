
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const subject = searchParams.get('subject');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
  }

  // Fetch completed tests for the user
  const { data: completedTests, error: completedError } = await supabase
    .from('user_tests')
    .select('test_id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (completedError) {
    return new Response(JSON.stringify({ error: completedError.message }), { status: 500 });
  }

  // Fetch all tests
  const { data: allTests, error: allError } = await supabase
    .from('tests')
    .select('*')
    .eq('subject', subject) 


  if (allError) {
    return new Response(JSON.stringify({ error: "hello" }), { status: 500 });
  }

  // Filter out completed tests
  const completedTestIds = completedTests.map(test => test.test_id);
  const incompleteTests = allTests.filter(test => !completedTestIds.includes(test.id));

  return new Response(JSON.stringify(incompleteTests), { status: 200 });
}
