import withPWA from 'next-pwa';
import type {NextConfig} from 'next';
import runtimeCaching from './public/next-pwa.config.js';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    return config;
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
  fallbacks: {
    document: '/offline',
  },
})(nextConfig);
