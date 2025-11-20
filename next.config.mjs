/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
    swcMinify: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fra.cloud.appwrite.io',
                port: '',
                pathname: '/v1/storage/buckets/**'
            },
        ],
        unoptimized: true
    }
};

export default config;