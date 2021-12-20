# App Architecture

This is the `__main__` folder, which contains the [modules that are deep](https://medium.com/@lovelydog/4-notes-modules-should-be-deep-ba5671c4288c).

## `app-state.mjs`

This is the global state management module. Kind of like Redux, but it uses [Valtio](https://github.com/pmndrs/valtio) under the hood and it is built specifically for our use case.

Redux was getting very verbose and dispatching individual actions was taking a non-trivial amount of time due to the sheer number of reducers from before. This results in janky UI with poor runtime performance. We also need good offline state, and open-source solutions for Redux were lacking.

**This should be the global source of truth across the app for all data**. There should not be any competing libraries such as `react-query`, `apollo`, etc. which also store fetched data in their own stores. Data lifetimes are managed within our own app, we should NOT outsource managing the lifetimes of our own data.

### Segregated read and write

The module exports a read state, which is just the Proxy object provided by Valtio. As the name implies, it should only be used to read from using `useSnapshot` hook.

Writing to `readState` is done from `writeState`, but this is not intended to be public API. Writing anything to state should be done via actions (functions that update state), much like Redux.

`writeState` is a Proxy itself, which not only updates `readState`, but is also the entry point for persisting data in IndexedDB.

## `db.mjs`

This module is not intended to be used by developers directly, it handles the IndexedDB integration and maintains the expiry record to keep track of the lifetime of each object in storage.

## `data-model.mjs`

All data coming from external sources **must be validated** for type safety. You may be wondering why not TypeScript? Because that works at build time, we need _runtime_ type safety. The problem that this solves is the most common error in our app, when a property access is attempted on `undefined` where an object was expected, or a method is called on a type that doesn't exist, such as `string.toUpperCase()`.

## `get-data.mjs`

**This is the primary method of fetching data in the app**. It is a convenience method that combines:

- Optimizing requests so that data we already have in app state is not re-fetched, without explicit opt-in.
- Error handling for both REST and GQL.
- Enforcing data validation.
- It is its own action that updates `writeState`.

## `router.mjs`

This is a standalone URL routing module, written in vanilla JS, using hooks for React integration. It loads modules via dynamic import for each route. There were no open-source projects that fulfilled these requirements:

- Use dynamic import. `React.lazy` does officially support this, but at the time of writing, there are quirks with how it deals with SSR. `loadable` does not use official API by React team nor dynamic import.
- Inter-operation with vanilla JS. This is important because we want to have a Promise that resolves when the component and its data is loaded.

### Data fetching must be driven by URL

Data loading _must be handled in the route_. There is a common anti-pattern where data is fetched from a component, and then rewrites the URL after the fact. THIS IS WRONG. It should be the other way around, where the query string or route in the URL is updated, which causes the data to be fetched.

## `App.jsx`

Nothing too interesting here, this is just the top level component, which renders itself into the DOM.
