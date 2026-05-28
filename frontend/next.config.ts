import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-expect-error - allowedDevOrigins might not be in the types yet
  allowedDevOrigins: ['192.168.0.118', '172.20.10.3', '0.0.0.0', 'localhost'],
};

export default nextConfig;
