import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { build as esbuild } from "esbuild";
import { execSync } from "child_process";
import * as path from "path";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building NestJS server...");
  const serverDir = path.resolve("server");
  execSync("npx nest build", { cwd: serverDir, stdio: "inherit" });

  console.log("bundling server with esbuild...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const serverPkg = JSON.parse(
    await readFile("server/package.json", "utf-8"),
  );

  const allDeps = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(serverPkg.dependencies || {}),
    ...Object.keys(serverPkg.devDependencies || {}),
  ]);

  // Packages to bundle into dist/index.cjs (not externalized)
  const allowlist = new Set(["dotenv"]);

  const externals = [...allDeps].filter((dep) => !allowlist.has(dep));

  // NestJS optional packages must be externalized to avoid runtime errors
  externals.push(
    "@nestjs/websockets",
    "@nestjs/websockets/socket-module",
    "@nestjs/microservices",
    "@nestjs/microservices/microservices-module",
  );

  await esbuild({
    entryPoints: [path.join(serverDir, "dist", "main.js")],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/index.cjs",
    format: "cjs",
    external: externals,
  });

  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
