const scriptSrcDevOnly =
  process.env.NODE_ENV === "development" ? "'unsafe-eval' 'unsafe-inline'" : "";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${scriptSrcDevOnly};
    style-src 'self';
    img-src 'self';
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
