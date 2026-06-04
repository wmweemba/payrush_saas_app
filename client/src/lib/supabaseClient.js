// TEMPORARY STUB — Phase 3 will remove all references to this file.
// All pages still importing this will be migrated to Better Auth + API routes.

const noop = () => {}
const chainable = () => ({
  select: chainable,
  insert: chainable,
  update: chainable,
  upsert: chainable,
  delete: chainable,
  eq: chainable,
  single: () => Promise.resolve({ data: null, error: null }),
  then: (fn) => Promise.resolve({ data: null, error: null }).then(fn),
})

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (cb) => {
      return { data: { subscription: { unsubscribe: noop } } }
    },
  },
  from: chainable,
}
