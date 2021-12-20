# Initial Decisions

### File naming

There should be only 2 extensions: `.mjs` for ES modules, and `.jsx` for JSX parsing. I would like to keep the folder structure as flat as possible, only 1 level deep, to encourage re-use.

### esbuild

We are opting out of using snowpack, vite, or other build tools that add another layer on top of esbuild. esbuild itself is already a very capable and complex tool. and the configuration complexity of the tools on top may obstruct us more than help us especially when we need something custom.

### Dynamic import

Instead of using React loadable, we will use ES dynamic import. There are a few reasons:

- Dynamic import to do code splitting is well supported by esbuild, and _will_ be well supported by future tools.
- Generic to the programming language (JavaScript), not locked down to one framework (React). It is portable knowledge.

To support code splitting by dynamic import, existing solutions are lacking. We want to split by route, and to do this requires implementing our own router. I think there are pros and cons to this approach. react-router is well supported production ready software with a large community, but does not fit with dynamic imports.

### Persistent state

Instead of using redux or react-query, we will use [valtio](https://github.com/pmndrs/valtio) and [indexeddb](https://github.com/fortunejs/fortune-indexeddb). High level goals:

- State should be persistent by default. indexeddb is the only option for persistent more than a trivial amount of data, since localStorage has a 5mb quota.
- Least Recently Used (LRU) caching by default, _except_ for data that we want to "pin" (such as static data, own user info). Being able to automatically discard info beyond a certain quota is very important for memory management, to keep RAM and disk usage to a minimum.
- low boilerplate. redux forces devs to write reducers, actions, transducers, confusers, etc. react-query has a large API surface area and forces devs to use hooks which aren't accessible or testable outside of react.
