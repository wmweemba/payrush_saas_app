# Profile Creation Debug Guide

## Issue: Profile Creation Failing with Empty Error Object

### Common Causes and Solutions:

1. **RLS (Row Level Security) Policies**
   - The profiles table might have RLS policies that prevent insertion
   - Check if authenticated users can insert into profiles table

2. **Database Constraints**
   - Primary key constraint violation (user might already exist)
   - Foreign key constraint issues
   - Required field constraints

3. **Authentication Context**
   - User session might not be properly established
   - RLS policies might not recognize the authenticated user

### Debugging Steps:

1. **Check Supabase Console:**
   - Go to Table Editor → profiles
   - Check RLS policies are enabled and configured correctly
   - Ensure authenticated users have INSERT permissions

2. **SQL Query to Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Test Profile Creation Manually:**
   ```sql
   INSERT INTO profiles (id, name, business_name) 
   VALUES ('your-user-id', 'Test User', 'Test Business');
   ```

### Enhanced Error Handling Added:

- More detailed error logging with all error properties
- Fallback to upsert if insert fails
- Default profile creation as last resort
- Better console logging for debugging

### Expected Console Output:
```
Fetching profile for user: [user-id]
Profile query result: { profileData: null, profileError: { code: 'PGRST116' } }
Creating new profile for user: [user-id]
Profile created successfully: { id: '...', name: '...', business_name: '...' }
```

If you still see "Failed to create profile: {}", check:
1. Supabase RLS policies
2. Database connection
3. User authentication state
4. Table schema and constraints