import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get answers from both tables
    const [officialResponse, practiceResponse] = await Promise.all([
      supabase
        .from('official_user_answers')
        .select('is_correct')
        .eq('user_id', userId),
      supabase
        .from('user_answers')
        .select('is_correct')
        .eq('user_id', userId)
    ]);

    if (officialResponse.error) {
      console.error('Error fetching official answers:', officialResponse.error);
      return NextResponse.json(
        { error: officialResponse.error.message },
        { status: 500 }
      );
    }

    if (practiceResponse.error) {
      console.error('Error fetching practice answers:', practiceResponse.error);
      return NextResponse.json(
        { error: practiceResponse.error.message },
        { status: 500 }
      );
    }

    // Combine answers from both tables
    const allAnswers = [
      ...(officialResponse.data || []),
      ...(practiceResponse.data || [])
    ];

    // Calculate combined stats
    const questionsAnswered = allAnswers.length;
    const correctAnswers = allAnswers.filter(a => a.is_correct).length;
    const accuracyPercentage = questionsAnswered > 0 
      ? (correctAnswers / questionsAnswered) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        questionsAnswered,
        correctAnswers,
        accuracyPercentage
      }
    });

  } catch (error) {
    console.error('Error in user stats route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 