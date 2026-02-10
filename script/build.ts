import { build as viteBuild } from "vite";
import { rm, writeFile } from "fs/promises";
import { execSync } from "child_process";
import * as path from "path";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building NestJS server...");
  const serverDir = path.resolve("server");
  execSync("npx nest build", { cwd: serverDir, stdio: "inherit" });

  console.log("creating production entry point...");
  const entryContent = `"use strict";
process.env.NODE_ENV = "production";
require("../server/dist/main.js");
`;
  await writeFile("dist/index.cjs", entryContent);

  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
