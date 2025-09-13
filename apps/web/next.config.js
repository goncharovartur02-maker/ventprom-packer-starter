/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@ventprom/core', '@ventprom/parsers'],
};

module.exports = nextConfig;







