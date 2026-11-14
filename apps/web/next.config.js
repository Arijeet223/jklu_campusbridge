/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@livekit/components-react', 'livekit-client', 'framer-motion'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    // Only rewrite to remote backend if explicitly configured with an external URL
    const remoteUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CAMPUSBRIDGE_BACKEND_URL
    if (remoteUrl && !remoteUrl.includes('localhost') && !remoteUrl.includes('127.0.0.1')) {
      const cleanBase = remoteUrl.replace(/\/+$/, '')
      return [
        {
          source: '/api/backend/:path*',
          destination: `${cleanBase}/:path*`,
        },
      ]
    }
    // In serverless / Vercel default, all /api/ routes are handled natively by Next.js route handlers
    return []
  },
}

module.exports = nextConfig
