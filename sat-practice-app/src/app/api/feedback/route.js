import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Handler to get user's feedback history
export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }
    
    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const statusFilter = searchParams.get('status'); // 'resolved' or 'unresolved'
    const feedbackType = searchParams.get('type'); // filter by feedback_type
    
    // Build the query
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    // Apply filters if provided
    if (statusFilter === 'resolved') {
      query = query.eq('resolved', true);
    } else if (statusFilter === 'unresolved') {
      query = query.eq('resolved', false);
    }
    
    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }
    
    // Execute the query
    const { data: feedbackItems, error: feedbackError, count } = await query;
    
    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback data' }, 
        { status: 500 }
      );
    }
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      console.error('Error getting count:', countError);
    }
    
    return NextResponse.json({
      feedback: feedbackItems,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

// Handler to submit new feedback
export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }
    
    // Parse the request body
    const requestData = await request.json();
    const { feedbackType, message } = requestData;
    
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' }, 
        { status: 400 }
      );
    }
    
    // Store feedback in a 'feedback' table
    // You may need to create this table in Supabase
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        user_email: user.email,
        feedback_type: feedbackType,
        message: message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to save feedback' }, 
        { status: 500 }
      );
    }
    
    // Optional: Send email notification
    // This would require additional setup with an email service

    return NextResponse.json({ 
      success: true,
      feedback
    }, { 
      status: 200 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 