// next.config.js is the active config — this file is intentionally minimal
// (Next.js 15+ may pick .mjs; keeping it in sync)
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken', 'nodemailer'],
};

export default nextConfig;
