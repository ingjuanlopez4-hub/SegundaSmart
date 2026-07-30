/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
