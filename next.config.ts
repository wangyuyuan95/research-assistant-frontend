import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
function rewritesConfig() {
    return [
        {
            source: '/api/:path*',
            destination: process.env.NEXT_PUBLIC_URL + '/api/:path*'
        },
    ]
}
let nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
      return rewritesConfig()
  },
  webpack: (config) => {
    // This rule prevents issues with pdf.js and canvas
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    // Ensure node native modules are ignored
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    return config;
  },
};

if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
  nextConfig = withSentryConfig(nextConfig, {
    org: 'kortix-ai',
    project: 'suna-nextjs',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}

export default nextConfig;
