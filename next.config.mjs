/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Externalize @ngrok/ngrok to avoid webpack bundling native modules
    serverComponentsExternalPackages: ["@ngrok/ngrok"],
  },
};

export default nextConfig;
