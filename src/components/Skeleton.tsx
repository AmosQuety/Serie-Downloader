import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = 'rect' }) => {
  const baseStyles = "animate-pulse bg-gray-200";
  const variantStyles = {
    rect: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
  );
};

export const PosterSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="aspect-[2/3] w-full" />
    <div className="flex flex-col items-center gap-2">
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/4" />
    </div>
  </div>
);

export const LibraryItemSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="aspect-[16/9] w-full" />
    <div className="px-2">
      <Skeleton variant="text" className="w-1/2 mb-2" />
      <Skeleton variant="text" className="w-1/3 h-3" />
    </div>
  </div>
);
