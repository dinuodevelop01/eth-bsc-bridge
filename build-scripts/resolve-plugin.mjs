import path from "node:path";

export function rewritePath(str) {
  return path.join(process.cwd(), "src", str.slice(2));
}

// https://esbuild.github.io/plugins/#resolve-callbacks
const resolvePlugin = {
  name: "resolve-root",
  setup(build) {
    // Custom resolver for root path. Example:
    // "@/shared/GlobalStyles.jsx" -> "src/shared/GlobalStyles.jsx"
    build.onResolve({ filter: /^@\/(.*?)\.(mjs|jsx|json)$/ }, (args) => {
      return {
        path: rewritePath(args.path),
      };
    });

    // Enforce usage of root path resolver by checking for "../"
    build.onResolve({ filter: /^\.+\// }, (args) => {
      const warnings = [];
      if (
        !(args.importer.includes("node_modules") || args.kind === "entry-point")
      ) {
        warnings.push({
          text: `Relative paths are discouraged, use root path resolver: @/`,
        });
      }

      return {
        warnings,
        path: undefined,
      };
    });
  },
};

export default resolvePlugin;
