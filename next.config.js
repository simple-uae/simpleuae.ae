/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken', 'nodemailer', 'pg'],
};
module.exports = nextConfig;
