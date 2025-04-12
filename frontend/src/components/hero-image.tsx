"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroImage() {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-full">
      {hasError ? (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
          <div className="flex flex-col items-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M8 21h8"></path>
              <path d="M12 17v4"></path>
            </svg>
            <p className="mt-4">Preview Image</p>
          </div>
        </div>
      ) : (
        <Image
          src="/images/preview.png"
          alt="ExplainGPT Interface Preview"
          fill
          style={{ objectFit: "contain" }}
          priority
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
