import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "glass" | "muted";
  hoverable?: boolean;
}

export function Card({
  variant = "default",
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-surface shadow-premium border border-border/40",
    outline: "bg-transparent border border-border",
    glass: "bg-white/85 backdrop-blur-md border border-white/30 shadow-glass",
    muted: "bg-surface-alt border border-border/20",
  };

  const hoverStyles = hoverable
    ? "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={`rounded-xl overflow-hidden p-6 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-b border-border/60 pb-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Content = function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-t border-border/60 pt-4 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
