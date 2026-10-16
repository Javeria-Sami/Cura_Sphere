import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded-md h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variantClasses[variant]} ${className}`}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
}
