/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side require() of Node built-ins in route handlers
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken', 'nodemailer'],
};

module.exports = nextConfig;
