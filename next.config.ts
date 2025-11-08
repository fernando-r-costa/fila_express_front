import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Allow cross-origin requests from local network IP in development
  ...(process.env.NODE_ENV === 'development' && {
    // @ts-ignore - allowedDevOrigins is experimental but not in types
    allowedDevOrigins: ['192.168.0.166'],
  }),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
