import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { SpaFallbackFilter } from './spa-fallback.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isDev = process.env.NODE_ENV === 'development';
  const useVite = isDev && !process.env.SKIP_VITE;

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Permissions'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use(express.json());
  app.use(cookieParser());

  const spaFilter = new SpaFallbackFilter();

  // Use process.cwd() for path resolution (works in both dev and bundled production)
  const projectRoot = process.cwd();

  // Check for pre-built federation bundle (Docker / production build)
  const prebuiltFederationDir = path.resolve(projectRoot, 'dist/federation');
  let federationDir: string | null = null;

  if (fs.existsSync(path.join(prebuiltFederationDir, 'assets', 'remoteEntry.js'))) {
    console.log('Using pre-built Module Federation bundle');
    federationDir = prebuiltFederationDir;
  } else {
    // Fall back to dist/public/assets (legacy / non-Docker build layout)
    const legacyFederationPath = path.join(projectRoot, 'dist/public/assets');
    if (fs.existsSync(path.join(legacyFederationPath, 'remoteEntry.js'))) {
      federationDir = path.join(projectRoot, 'dist/public');
    }
  }

  if (federationDir) {
    // Serve federation assets at root so chunks like __federation_expose_*.js resolve correctly
    app.use(express.static(path.join(federationDir, 'assets')));
    app.use('/assets', express.static(path.join(federationDir, 'assets')));
  }

  if (!useVite) {
    const staticPath = path.join(projectRoot, 'dist/public');
    if (fs.existsSync(staticPath)) {
      app.use(express.static(staticPath));
    }
    app.useGlobalFilters(spaFilter);
  } else {
    const httpServer = app.getHttpServer();
    const rootDir = process.cwd();
    const viteConfigPath = path.resolve(rootDir, 'vite.config.ts');

    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const viteModule = await dynamicImport('vite');
    const viteConfigModule = await dynamicImport(viteConfigPath);
    const nanoidModule = await dynamicImport('nanoid');

    const createViteServer = viteModule.createServer || viteModule.default?.createServer;
    const viteConfig = viteConfigModule.default;
    const nanoid = nanoidModule.nanoid || nanoidModule.default?.nanoid;

    console.log('Setting up Vite dev server...');

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      server: {
        middlewareMode: true,
        hmr: { server: httpServer, path: '/vite-hmr' },
        allowedHosts: true,
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);
    spaFilter.setVite(vite, nanoid);
    app.useGlobalFilters(spaFilter);

    console.log('Vite dev server integrated successfully');
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`NestJS server running on port ${port} (${isDev ? 'development' : 'production'} mode)`);
}
bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});
