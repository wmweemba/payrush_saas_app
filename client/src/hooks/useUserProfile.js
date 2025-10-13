import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndProfile() {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
          setError('Failed to load session');
          router.push('/login');
          return;
        }
        
        if (!session?.user) {
          console.log('No valid session found, redirecting to login...');
          router.push('/login');
          return;
        }

        console.log('Valid session found for user:', session.user.id);
        setUser(session.user);
        
        // Store auth token for API requests
        if (session.access_token) {
          localStorage.setItem('authToken', session.access_token);
          localStorage.setItem('token', session.access_token);
        }

        // Fetch user profile
        console.log('Fetching profile for user:', session.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('Profile query result:', { profileData, profileError });

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create a minimal one (this should rarely happen)
          console.log('Creating new profile for user:', session.user.id);
          
          const profileInsertData = {
            id: session.user.id,
            business_name: 'My Business' // Basic fallback only
          };
          
          // Test if name column exists and add it if available
          try {
            const { error: nameTestError } = await supabase
              .from('profiles')
              .select('name')
              .limit(0);
              
            if (!nameTestError) {
              profileInsertData.name = session.user.email?.split('@')[0] || 'User';
            }
          } catch (e) {
            console.log('Name column not available in current schema');
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileInsertData)
            .select()
            .single();

          if (createError) {
            // Try upsert as fallback
            console.log('Insert failed, trying upsert...');
            const { data: upsertProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert(profileInsertData, { onConflict: 'id' })
              .select()
              .single();

            if (upsertError) {
              console.error('Both insert and upsert failed:', { createError, upsertError });
              // Set a default profile to allow the app to continue working
              setProfile({ 
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User', 
                business_name: 'My Business' 
              });
            } else {
              console.log('Profile created via upsert successfully:', upsertProfile);
              setProfile(upsertProfile);
            }
          } else {
            console.log('Profile created via insert successfully:', newProfile);
            setProfile(newProfile);
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Failed to load profile data');
          // Set a fallback profile to allow the app to continue working
          setProfile({ 
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User', 
            business_name: 'My Business' 
          });
        } else {
          console.log('Profile loaded successfully:', profileData);
          setProfile(profileData);
        }

      } catch (err) {
        console.error('Error in fetchUserAndProfile:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          router.push('/login');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Refetch profile when user signs in
          fetchUserAndProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return { user, profile, loading, error };
}