/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tách cache dev khỏi production build để `next build` không làm hỏng CSS
  // của dev server đang chạy.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Nội dung học nằm trong workspace package nên Next cần transpile
  transpilePackages: ["@kanado/content"],
  output: "standalone",
};

export default nextConfig;
