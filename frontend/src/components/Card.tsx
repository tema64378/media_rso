import React from "react";
import "./Card.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
}

export default function Card({ children, className = "", variant = "default" }: CardProps) {
  return <div className={`card card-${variant} ${className}`}>{children}</div>;
}
