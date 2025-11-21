/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['swiper'],
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/bcrypt'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pawelperfect.pl',
        port: '',
        pathname: '/wp-content/uploads/**',
      }
    ],
  },
};

export default nextConfig;
