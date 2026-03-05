// @ts-check
module.exports = {
  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: true,
  },
  use: {
    headless: true,
    baseURL: 'http://localhost:5174',
    viewport: { width: 1280, height: 720 },
  },
};