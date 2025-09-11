import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY, // Server-side only, no dangerouslyAllowBrowser
});

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session for analytics/logging
    const { data: { session } } = await supabase.auth.getSession();
    
    const { messages, questionContext } = await request.json();
    
    // Construct system message with question context
    const systemMessage = {
      role: 'system',
      content: `Your name is Brill. You are a helpful PSAT tutoring assistant. Your answers should be crafted to be understood by a 15 year old kid. Format your responses with clear structure:
      - Use headers (##) for main sections
      - Use bullet points for lists
      - **Bold** important concepts
      - Use line breaks for readability
      - Include examples in \`code\` blocks
      - Use tables when comparing concepts
      
      Context about the current question:
      Question: ${questionContext.questionText}
      User's selected answer: ${questionContext.selectedAnswer}
      All answer choices: ${JSON.stringify(questionContext.options)}
      
      Use markdown for all output. When presenting mathematical equations or formulas, use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$x^2 + y^2 = z^2$$) and single dollar signs for inline math (e.g., $E=mc^2$).`
    };

    // Add image context if present
    const conversationMessages = [systemMessage, ...messages];
    if (questionContext.imageURL) {
      conversationMessages.push({
        role: 'user',
        content: `Additionally, here is an image related to the question: ${questionContext.imageURL}`,
      });
    }

    // Create streaming response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversationMessages,
      stream: true,
      max_tokens: 4000, // Increased token limit to prevent cutoffs
      temperature: 0.7, // Consistent response generation
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          let totalTokens = 0;
          let responseComplete = false;
          let assistantFullResponse = '';
          
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            const finishReason = chunk.choices[0]?.finish_reason;
            
            if (content) {
              totalTokens += content.split(' ').length; // Rough token estimation
              assistantFullResponse += content;
              // Send data in Server-Sent Events format
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            
            // Check if response was completed naturally
            if (finishReason) {
              responseComplete = true;
              console.log(`Response completed with reason: ${finishReason}, estimated tokens: ${totalTokens}`);
              
              if (finishReason === 'length') {
                console.warn('Response was truncated due to token limit. Consider increasing max_tokens.');
              }
            }
          }
          
          if (!responseComplete) {
            console.warn('Response stream ended without completion signal - possible network timeout or interruption');
          }

          // Persist the conversational turn (user prompt + assistant response)
          try {
            const lastUserMessage = Array.isArray(messages)
              ? [...messages].reverse().find(m => m?.role === 'user' && typeof m?.content === 'string')
              : null;
            const promptText = lastUserMessage?.content || null;
            const questionId = questionContext?.questionId ?? null;

            if (session?.user && promptText && assistantFullResponse) {
              const insertRes = await supabase
                .from('ai_chat_turns')
                .insert({
                  user_id: session.user.id,
                  question_id: questionId,
                  prompt_text: promptText,
                  response_text: assistantFullResponse,
                });
              if (insertRes.error) {
                console.error('Failed to insert ai_chat_turn:', insertRes.error);
              }
            } else {
              if (!session?.user) console.warn('Skipping chat turn insert: no authenticated user');
              if (!promptText) console.warn('Skipping chat turn insert: missing promptText');
              if (!assistantFullResponse) console.warn('Skipping chat turn insert: missing assistant response');
            }
          } catch (persistErr) {
            console.error('Error persisting ai_chat_turn:', persistErr);
          }
          
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          // Send error information to client for debugging
          const errorData = `data: ${JSON.stringify({ 
            error: 'Streaming interrupted', 
            message: error.message 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 