/** @type {import('next').NextConfig} */
const nextConfig = {
    // Deshabilitar error de Suspense con useSearchParams en build
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
};

module.exports = nextConfig;
