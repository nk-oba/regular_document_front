/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AGENTS_URL: process.env.NODE_ENV === 'development' 
      ? process.env.AGENTS_URL
      : 'http://127.0.0.1:8000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/:path*'
          : 'http://agent:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig