import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className="flex justify-center items-start w-full py-8 px-4">
      <div className={`flex flex-col space-y-8 w-full max-w-4xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
