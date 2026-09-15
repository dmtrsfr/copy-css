const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");

const outdir = path.join(__dirname, "dist");
fs.mkdirSync(outdir, { recursive: true });

// static assets copied as-is into dist/
for (const file of ["manifest.json"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outdir, file));
}
fs.mkdirSync(path.join(outdir, "icons"), { recursive: true });
for (const file of fs.readdirSync(path.join(__dirname, "icons"))) {
  fs.copyFileSync(path.join(__dirname, "icons", file), path.join(outdir, "icons", file));
}

const common = {
  bundle: true,
  outdir,
  target: "chrome110",
  sourcemap: true,
};

const configs = [
  { ...common, entryPoints: { background: "src/background.ts" }, format: "esm" },
  { ...common, entryPoints: { content: "src/content.ts" }, format: "iife" },
];

async function run() {
  if (watch) {
    const ctxs = await Promise.all(configs.map((c) => esbuild.context(c)));
    await Promise.all(ctxs.map((ctx) => ctx.watch()));
    console.log("Watching for changes...");
  } else {
    await Promise.all(configs.map((c) => esbuild.build(c)));
    console.log("Build complete.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
