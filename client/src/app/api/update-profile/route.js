import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations if available, otherwise anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request) {
  try {
    const { email, name, businessName } = await request.json()
    
    console.log('Updating profile for:', { email, name, businessName })

    // Update profile using email to identify user
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ 
        name: name,
        business_name: businessName 
      })
      .eq('id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get all profiles to debug
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    return Response.json({ 
      profiles: profiles || [],
      error: error?.message || null
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}