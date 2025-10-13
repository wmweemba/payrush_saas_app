import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations if available, otherwise anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    console.log('Debug profile GET request for email:', email);
    
    if (email) {
      // Get specific user profile by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Auth error:', authError);
        return Response.json({ error: 'Failed to get user data' }, { status: 500 });
      }
      
      const user = authUsers.users.find(u => u.email === email);
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return Response.json({ 
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profile,
        profileError: profileError?.message || null
      });
    }
    
    // Get all profiles to debug
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    return Response.json({ 
      profiles: profiles || [],
      error: error?.message || null,
      count: profiles?.length || 0
    })
  } catch (error) {
    console.error('Debug profile GET error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, email } = await request.json()
    
    if (action === 'refresh-business-name') {
      // Update business name for a specific user
      let businessName = 'My Business'; // fallback
      
      if (email?.includes('@mynexusgroup.com')) {
        businessName = 'My Nexus Group';
      } else if (email?.includes('@')) {
        const domain = email.split('@')[1];
        if (domain) {
          const domainName = domain.split('.')[0];
          businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Business';
        }
      }

      // Find user by email first
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)
      
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ business_name: businessName })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ 
        message: 'Business name updated successfully',
        profile: data,
        newBusinessName: businessName
      })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('POST error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}