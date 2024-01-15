/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/checklists",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
