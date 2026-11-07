/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@livekit/components-react', 'livekit-client', 'framer-motion'],
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8000/:path*',
      },
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/v1/:path*',
      },
      {
        source: '/v1/:path*',
        destination: 'http://localhost:8000/v1/:path*',
      },
    ]
  },
}

module.exports = nextConfig
