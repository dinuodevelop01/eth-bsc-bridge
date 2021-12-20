import React from "react";
import ReactDOM from "react-dom";
import { setup } from "goober";
import { useRouteComponent, initialRoutePromise } from "@/__main__/router.mjs";
import { Container, Content } from "@/__main__/App.style.jsx";
import { IS_NODE } from "@/util/dev.mjs";
import useThemeStyle from "@/util/use-theme-style.mjs";
import GlobalStyles from "@/app/GlobalStyles.jsx";
import ErrorBoundary from "@/app/ErrorBoundary.jsx";
import Tooltip from "@/shared/tooltip.mjs";
import { Web3Provider } from "@/app/Web3Provider.jsx";

if (!IS_NODE) {
  Tooltip.init();
}

// This seems to be required by goober.
setup(React.createElement);

const ShowRoute = () => {
  const RouteComponent = useRouteComponent();

  return (
    <Content>
      <ErrorBoundary>
        <RouteComponent />
      </ErrorBoundary>
    </Content>
  );
};

const App = () => {
  useThemeStyle();  

  return (
    <React.StrictMode>
      <GlobalStyles />
      <Container>
        <Web3Provider>
          <ShowRoute />
        </Web3Provider>
      </Container>
    </React.StrictMode>
  );
};

// Render the app.
export const appInstance = <App />;
if (!IS_NODE) {
  const appContainer = document.querySelector("#app");
  (async () => {
    try {
      await initialRoutePromise;
    } catch (error) {
      console.error("INITIAL ROUTE ERROR", error);
    }
    ReactDOM.render(appInstance, appContainer);
  })();
}

export default App;
