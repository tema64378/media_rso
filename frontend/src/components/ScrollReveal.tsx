import React, { useRef, useState, useEffect, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale" | "none";
  threshold?: number;
  style?: React.CSSProperties;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.1,
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const dirClass = direction === "none" ? "" :
    direction === "left" ? "reveal-left" :
    direction === "right" ? "reveal-right" :
    direction === "scale" ? "reveal-scale" : "reveal";

  return (
    <div
      ref={ref}
      className={`${dirClass} ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

export function ScrollRevealGroup({ children, stagger = 100, ...props }: ScrollRevealProps & { stagger?: number }) {
  const count = React.Children.count(children);
  return (
    <>
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { ...props, delay: i * stagger })
          : child
      )}
    </>
  );
}
