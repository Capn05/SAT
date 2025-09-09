import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session (for development/testing purposes)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Fetching all subcategories...');

    // Fetch all subcategories with their related data
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select(`
        id,
        subcategory_name,
        domain_id,
        domains(
          id,
          domain_name,
          subject_id,
          subjects(
            id,
            subject_name
          )
        )
      `)
      .order('subcategory_name');

    if (subcategoriesError) {
      console.error('Error fetching subcategories:', subcategoriesError);
      return NextResponse.json({ 
        error: 'Failed to fetch subcategories',
        details: subcategoriesError
      }, { status: 500 });
    }

    if (!subcategories || subcategories.length === 0) {
      return NextResponse.json({ 
        subcategories: [],
        message: 'No subcategories found'
      });
    }

    // Process the data to include hierarchical information
    const processedSubcategories = subcategories
      .map(subcategory => ({
        id: subcategory.id,
        name: subcategory.subcategory_name,
        domainId: subcategory.domain_id,
        domainName: subcategory.domains?.domain_name,
        subjectId: subcategory.domains?.subjects?.id,
        subjectName: subcategory.domains?.subjects?.subject_name,
        // Create a display name with hierarchy
        displayName: `${subcategory.domains?.subjects?.subject_name} > ${subcategory.domains?.domain_name} > ${subcategory.subcategory_name}`
      }))
      .sort((a, b) => {
        // Sort by subject name, then domain name, then subcategory name
        if (a.subjectName !== b.subjectName) {
          return (a.subjectName || '').localeCompare(b.subjectName || '');
        }
        if (a.domainName !== b.domainName) {
          return (a.domainName || '').localeCompare(b.domainName || '');
        }
        return (a.name || '').localeCompare(b.name || '');
      });

    console.log(`Successfully fetched ${processedSubcategories.length} subcategories`);
    
    return NextResponse.json({ 
      subcategories: processedSubcategories,
      count: processedSubcategories.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
