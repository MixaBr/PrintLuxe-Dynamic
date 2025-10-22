const allowedOrigin = '9000-firebase-studio26082025-1760212682543.cluster-beimwvuktjcu6sechxlysokr36.cloudworkstations.dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/',
      },
      {
        protocol: 'https',
        hostname: 'ygozbvzcwbyeykhiotwt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: allowedOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },

  // ✅ ИСПРАВЛЕНИЕ: allowedDevOrigins теперь на верхнем уровне
  allowedDevOrigins: [allowedOrigin],

  // experimental теперь пустой, если больше нет других экспериментальных флагов
  // Если у вас были другие экспериментальные флаги, оставьте experimental объект с ними.
  // Например:
  // experimental: {
  //   someOtherExperimentalFlag: true,
  // },
};

module.exports = nextConfig;
