import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // แก้ปัญหา face-api.js ใน browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      }
    }
    
    return config
  },
  // เพิ่ม external domains สำหรับ face-api models
  images: {
    domains: ['raw.githubusercontent.com']
  }
}

export default nextConfig