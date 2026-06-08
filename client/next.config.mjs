/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-auth', 'postgres', 'drizzle-orm'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
