

const allowedOrigin = '9000-firebase-studio-1760946131578.cluster-6aufaxcfanfh2quaz7stglulic.cloudworkstations.dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
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

  webpack: (config, { isServer }) => {
    // This alias prevents Webpack from trying to bundle the 'canvas' module.
    // It's a server-side dependency of pdfjs-dist that we don't use, and it causes build errors.
    // We apply it to both server and client builds to be safe.
    config.resolve.alias.canvas = false;
    
    return config;
  },

  allowedDevOrigins: [allowedOrigin],

};

module.exports = nextConfig;
