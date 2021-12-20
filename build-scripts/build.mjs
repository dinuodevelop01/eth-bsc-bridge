import esbuild from "esbuild";
import resolvePlugin from "./resolve-plugin.mjs";
import wasmPlugin from "./wasm-plugin.mjs";
import svgPlugin from "./svg-plugin.mjs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import dotenv from "dotenv";

const start = Date.now();
const args = process.argv.slice(2);
const IS_DEV = args.includes("--dev");
const OUT_DIR = "www/js";
const DEV_PORT = 3001;

const envVars = dotenv.config().parsed;
const translatedVars = Object.keys(envVars).reduce((acc, k) => {
  acc[`process.env.${k}`] = `"${envVars[k]}"`;
  return acc;
}, {});

const buildOptions = {
  entryPoints: ["src/entry.mjs", "src/root.mjs"],
  bundle: true,
  splitting: true,
  outdir: OUT_DIR,
  inject: ["src/util/global-shims.mjs"],
  define: {
    "process.env.NODE_ENV": IS_DEV ? '"development"' : '"production"',
    ...translatedVars
  },
  format: "esm",
  // platform: "node",
  minify: !IS_DEV,
  plugins: [resolvePlugin, wasmPlugin, svgPlugin],
  // external: ["electron"]
  // sourcemap: !IS_DEV,
};

// DO NOT REMOVE - This is to enforce:
// - a flattened directory structure.
// - naming conventions.
const WHITELIST_DIRECTORIES = new Set([
  "__main__",
  "app",
  "routes",
  "shared",
  "util",
  "vendor",
  "contracts"
]);

for (const dirname of WHITELIST_DIRECTORIES) {
  if (dirname.toLowerCase() !== dirname) {
    throw new Error(`Uppercase not allowed in directory name (${dirname}).`);
  }
}

const naughtyRegExp = /lol|tft|valorant|fortnite|csgo/i;
const checkStrings = async () => {
  for (const dirname of ["shared", "util"]) {
    const listing = await fs.readdir(`src/${dirname}`, {
      withFileTypes: true,
    });
    await Promise.all(
      listing.map(async (dirent) => {
        const content = await fs.readFile(
          `src/${dirname}/${dirent.name}`,
          "utf8"
        );
        if (content.match(naughtyRegExp))
          throw new Error(
            `The file ${dirent.name} may not contain game-specific code in ${dirname}.`
          );
      })
    );
  }
};

const checkStep = async () => {
  await checkStrings();
  const listing = await fs.readdir("src/", { withFileTypes: true });
  const dirs = Array.prototype.filter.call(listing, (dirent) =>
    dirent.isDirectory()
  );
  for (const dir of dirs) {
    if (!WHITELIST_DIRECTORIES.has(dir.name))
      throw new Error(`Directory "${dir.name}" is not whitelisted.`);

    const subListing = await fs.readdir(`src/${dir.name}`, {
      withFileTypes: true,
    });
    const subDirs = Array.prototype.filter.call(subListing, (dirent) =>
      dirent.isDirectory()
    );
    if (subDirs.length)
      throw new Error("Deeply nested directories not allowed.");
    const subFiles = Array.prototype.filter.call(subListing, (dirent) =>
      dirent.isFile()
    );
    for (const file of subFiles) {
      const { name } = file;
      const ext = path.extname(name);

      if (name.startsWith("index"))
        throw new Error(
          `"index" is invalid because imports must refer to a filename not a directory.`
        );

      switch (ext) {
        case ".jsx": {
          const firstChar = name.charAt(0);
          if (!name.startsWith("use") && firstChar.toUpperCase() !== firstChar)
            throw new Error(
              `JSX filename "${name}" must start with capital letter, and contain ComponentName, OR start with use.`
            );
          const dotMatch = name.match(/\.(.*)?\./);
          if (dotMatch && dotMatch[1] !== "style")
            throw new Error(
              `JSX filename "${name}" can only contain ".style".`
            );
          break;
        }
        case ".mjs": {
          if (name.startsWith("__")) continue;
          if (name.toLowerCase() !== name)
            throw new Error(
              `MJS filename "${name}" must-be-dasherized and may not contain UPPERCASE.`
            );
          break;
        }
        case ".js": {
          throw new Error(
            `Invalid "${name}": use either MJS for plain ES module, or JSX if parsing is required.`
          );
          break;
        }
      }
    }
  }
};

const scanStep = async () => {
  // Read routes first using a shitty RegExp instead of AST traversal!
  const routeFiles = await fs.readdir("src/routes");
  const routes = [];
  for (const fileName of routeFiles) {
    const content = await fs.readFile(`src/routes/${fileName}`, "utf8");
    const matches = content.matchAll(/component: "(.*?)"/g);
    for (const match of matches) {
      const [, componentPath] = match;
      routes.push(`src/${componentPath}`);
    }
  }
  buildOptions.entryPoints.push(...routes);
};

const buildStep = async () => {
  await fs.rm(OUT_DIR, { force: true, recursive: true });
  // const {
  //   default: { languages },
  // } = await import("../src/i18n/__init.mjs");
  // buildOptions.entryPoints.push(
  //   ...languages.map((language) => `src/i18n/__resources.${language}.mjs`)
  // );
  return esbuild.build(buildOptions);
};

const serveStep = () =>
  esbuild
    .serve(
      {
        servedir: "www",
      },
      buildOptions
    )
    .then((result) => {
      const { host: hostname, port } = result;
      const devServer = http.createServer((req, res) => {
        const { url, method, headers } = req;
        // Rewrite most paths in the dev server to the index :)
        const path = /^\/(js|assets)\//.test(url) ? url : "/";

        const options = {
          hostname,
          port,
          path,
          method,
          headers,
        };

        // Forward each incoming request to esbuild
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });

        // Forward the body of the request to esbuild
        req.pipe(proxyReq, { end: true });
      });

      devServer.listen(DEV_PORT, () => {
        console.log(`listening on ${hostname}:${DEV_PORT}...`);
      });
    });

const steps = [
  checkStep,
  scanStep,
  buildStep,
  () => console.log(`done in ${Date.now() - start}ms`),
];

if (IS_DEV) {
  steps.splice(steps.indexOf(buildStep), 1, serveStep);
}

(async () => {
  for (const step of steps) {
    try {
      if (typeof step === "function") await step();
    } catch (e) {
      console.error(e);
      break;
      process.exit(1);
    }
  }
})();
