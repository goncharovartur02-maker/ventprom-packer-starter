/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 14, no need for experimental flag
  transpilePackages: ['@ventprom/core', '@ventprom/parsers'],
  // Отключаем оптимизацию шрифтов для избежания таймаутов
  optimizeFonts: false,
};

module.exports = nextConfig;







