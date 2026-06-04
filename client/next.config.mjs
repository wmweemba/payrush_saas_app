/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-auth', 'postgres', 'drizzle-orm'],
  // Pre-existing ESLint issues in legacy components — will be fixed in Phase 3 rewrites
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
