import React from "react";

function Button(props) {
  const {
    size = "medium", 
    type = "primary",
    className,
    onClick,
    disabled
  } = props;

  return (
    <button
      className={`button-${type} button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {props.children}
    </button>
  );
}

export default Button;
