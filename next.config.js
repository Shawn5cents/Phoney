/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transpilePackages: ['ws', '@google-cloud/speech'],
  experimental: {
    serverComponentsExternalPackages: ['ws', '@google-cloud/speech'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    return config;
  },
  // Required for WebSocket support
  webSocketServer: {
    type: 'ws',
  }
}

module.exports = nextConfig;
