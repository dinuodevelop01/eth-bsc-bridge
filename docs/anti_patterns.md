# Anti-patterns

Here we document what not to do.

## Game-specific code leaking into shared modules

Nothing game-specific should leak into shared modules. Take for example:

```
// League of Legends internal queue IDs
export const QUEUE_TYPES = {
  ...
  420: "RANKED_SOLO",
  430: "NORMAL",
  440: "RANKED_FLEX",
  450: "ARAM",
  ...
}
```

This does NOT go into any shared directory, it MUST be confined to a game-specific directory: `game-lol`.

#### Why is this an anti-pattern?

Developers working on a game should not have to be concerned about unrelated games. This is poor organization and low code quality.

#### Exception: shared functions

Some concepts are the exact same across ALL games. In this case it wouldn't be game-specific, but rather _shared_.

```
// KDA
export function calcKDA(kills, deaths, assists, fraction = 1) {
  return calcRate(kills + assists, deaths, fraction);
}
```

## Index files

Files that just import other files and re-export them:

```js
import FooBar from "./foobar.mjs";
import FooBaz from "./foobaz.mjs";

export { FooBar };
export { FooBaz };
```

#### Why is this an anti-pattern?

- Unnecessary code, just import the file directly.
- Makes code-splitting / tree shaking / bundle analysis [harder to do correctly](https://esbuild.github.io/api/#manual-tree-shaking-annotations).
- Introduces possibility of renaming things for the sake of renaming, i.e. a file may be called `foobar.mjs` but exported as `FooBaz`, causes confusion.
