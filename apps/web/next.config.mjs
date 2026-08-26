/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nội dung học nằm trong workspace package nên Next cần transpile
  transpilePackages: ["@kanado/content"],
  output: "standalone",
};

export default nextConfig;
