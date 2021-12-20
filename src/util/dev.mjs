export const IS_DEV =
  typeof window !== "undefined" && window.location.hostname === "localhost";

export const IS_NODE = typeof process !== "undefined";

const cssLabel = `
  color: #e3296d;
  background: #b4d4de;
  border: 1px #729dab solid;
  border-radius: 5px;
  padding: 2px 5px;
  font-family: comic sans ms, comic sans;
`;
const cssText = (method) => `
  color: #4191ab;
  ${method === "warn" ? "font-size: 20px;" : ""}
`;
function devConsole(method) {
  return function dev() {
    if (!IS_DEV) return;
    const args = Array.prototype.slice.call(arguments);
    const [primitives, objs] = args.reduce(
      (a, _) => {
        a[_ === Object(_) ? 1 : 0].push(_);
        return a;
      },
      [[], []]
    );
    console[method](
      `%c[🤡🎪devloper]%c ${primitives.join(" ")}`,
      cssLabel,
      cssText(method),
      ...objs
    );
  };
}

export const devLog = devConsole("log");
export const devWarn = devConsole("warn");
export const devError = devConsole("error");
