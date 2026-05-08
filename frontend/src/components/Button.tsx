import React from "react";
import "./Button.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
