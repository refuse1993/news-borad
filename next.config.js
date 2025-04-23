/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 이미지를 사용하기 위한 도메인 설정
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 모든 도메인에서 이미지를 허용
      },
    ],
  },
}

module.exports = nextConfig