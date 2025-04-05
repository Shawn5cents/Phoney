/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transpilePackages: [],
  experimental: {
    serverComponentsExternalPackages: [],
  },
}
