import { styled } from "goober";

export const Container = styled("div")`
  display: flex;
  min-height: 100vh;

  --left-nav-width-collapsed: var(--sp-20);
  --left-nav-width-expanded: calc(var(--sp-1) * 67);

  --left-nav-padding: var(--sp-3_5);
  --content-header-height: var(--sp-18);
  --nav-tabs-height: var(--sp-11);

  --content-window-width: calc(100vw - var(--left-nav-width-expanded));
  --content-window-height: calc(100vh - var(--content-header-height));
`;

export const Content = styled("div")`
  flex: 1;
  display: flex;
  flex-direction: column;
`;
