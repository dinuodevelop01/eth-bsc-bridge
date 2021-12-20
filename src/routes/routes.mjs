import { isCatchAll } from "@/routes/constants.mjs";
import appRoutes from "@/routes/app.mjs";
import { initBridge } from "@/app/actions.mjs";

const defaultRoute = {
  path: /.*/,
  [isCatchAll]: true,
  async fetchData() {
    // init something
    initBridge();
  },
};

const routes = [defaultRoute, ...appRoutes];

export default routes;
