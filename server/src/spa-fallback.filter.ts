import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Catch(NotFoundException)
export class SpaFallbackFilter implements ExceptionFilter {
  private vite: any = null;
  private nanoid: any = null;

  setVite(vite: any, nanoid: any) {
    this.vite = vite;
    this.nanoid = nanoid;
  }

  async catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const url = request.originalUrl || request.url;

    if (url.startsWith('/api/')) {
      response.status(404).json({
        statusCode: 404,
        message: exception.message,
        error: 'Not Found',
      });
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && this.vite) {
      try {
        const rootDir = process.cwd();
        const clientTemplate = path.resolve(rootDir, 'client', 'index.html');
        let template = await fs.promises.readFile(clientTemplate, 'utf-8');
        if (this.nanoid) {
          template = template.replace(
            `src="/src/main.tsx"`,
            `src="/src/main.tsx?v=${this.nanoid()}"`,
          );
        }
        const page = await this.vite.transformIndexHtml(url, template);
        response.status(200).set({ 'Content-Type': 'text/html' }).end(page);
      } catch (e: any) {
        this.vite.ssrFixStacktrace(e);
        console.error(e);
        response.status(500).end(e.message);
      }
    } else {
      const staticPath = path.join(process.cwd(), 'dist/public');
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        response.sendFile(indexPath);
      } else {
        response.status(404).json({
          statusCode: 404,
          message: 'Not Found',
        });
      }
    }
  }
}
