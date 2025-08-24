/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production deployment
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
  
  // Security headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'"
          },
        ],
      },
    ];
  },
  
  // API configuration
  async rewrites() {
    // 生产环境中，前端静态文件和后端API在同一服务器同一端口
    // 通过服务器路由配置，不需要重写 API 路径
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Using same server for frontend and backend');
      return []; // 生产环境不需要 rewrites
    }
    
    // 开发环境仍然需要代理到后端服务
    const devApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`Development mode: API URL: ${devApiUrl}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${devApiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
