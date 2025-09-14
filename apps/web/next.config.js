/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 14, no need for experimental flag
  transpilePackages: ['@ventprom/core', '@ventprom/parsers'],
};

module.exports = nextConfig;







