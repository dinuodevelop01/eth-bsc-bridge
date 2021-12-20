import React from "react";
import { styled } from "goober";

export const Container = styled("div")`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  > * {
    text-align: center;
    > :first-child {
      font-size: 48px;
    }
    > :not(:first-child) {
      color: var(--shade2);
    }
  }
`;

function Missing() {
  const headline = "404";
  const subtitle = "Not found";
  return (
    <Container>
      <div>
        <div>{headline}</div>
        <div>{subtitle}</div>
      </div>
    </Container>
  );
}

export default Missing;
