import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppConfigController {
  @Get('config')
  getConfig() {
    // Collect all APP_* env vars for K8s ConfigMap flexibility
    const appVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('APP_') && value !== undefined) {
        appVars[key] = value;
      }
    }

    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      apiBaseUrl: process.env.APP_API_BASE_URL || '/api',
      ...appVars,
    };
  }
}
