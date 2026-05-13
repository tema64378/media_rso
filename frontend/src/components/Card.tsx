import React from "react";
import "./Card.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
  style?: React.CSSProperties;
}

export default function Card({ children, className = "", variant = "default", style }: CardProps) {
  return <div className={`card card-${variant} ${className}`} style={style}>{children}</div>;
}
