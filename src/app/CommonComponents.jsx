import React from "react";
import { styled } from "goober";

export const CardContainer = styled("div")`
  background: var(--bg-primary);
  border-radius: var(--br-large);
  border: none;
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;

  &.large {
    padding: 40px 80px;
  }

  &.medium {
    padding: 16px 16px;
  }

  &.small {
    padding: 8px 8px;
  }
`;

export const Flex = styled("div")`
  display: flex;
  flex-direction: ${props => props.col ? "column" : "row"}
`

export const Label = (props) => (
  <div className={`typo-label ${props.className}`}>{props.children}</div>
);

export const Descr = (props) => (
  <div className={`typo-secondary ${props.className}`}>{props.children}</div>
);

export const Body = (props) => (
  <div className={`typo-body ${props.className}`}>{props.children}</div>
);

export const Title = (props) => (
  <div className={`typo-title ${props.className}`}>{props.children}</div>
);
