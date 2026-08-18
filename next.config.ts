import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75, 90],
  },
  // Allow cross-origin requests from local network IP in development
  ...(process.env.NODE_ENV === 'development' && {
    // @ts-ignore - allowedDevOrigins is experimental but not in types
    allowedDevOrigins: [
      'localhost',
      '127.0.0.1',
      'localhost:3001',
      '127.0.0.1:3001',
      '192.168.0.230',
      '192.168.0.230:3001',
      '192.168.137.1',
      '192.168.137.1:3001',
    ],
  }),
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    return [
      {
        source: '/api/fila-express/:path*',
        destination: 'http://127.0.0.1:3000/api/fila-express/:path*',
      },
    ];
  },
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
