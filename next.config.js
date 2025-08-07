/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://agent:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig