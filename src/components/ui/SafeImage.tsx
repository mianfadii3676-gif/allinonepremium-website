"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image that hides itself or swaps to the neutral placeholder when the source fails, instead of showing a broken image. */
export default function SafeImage({ src, alt, hideOnError = false, ...rest }: ImageProps & { hideOnError?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc === src;
  // On dark panels a light placeholder looks broken, so those callers hide the image instead.
  if (failed && hideOnError) return null;
  return (
    <Image
      {...rest}
      src={failed ? "/placeholder.svg" : src}
      alt={alt}
      unoptimized={failed || rest.unoptimized}
      onError={() => setFailedSrc(src)}
    />
  );
}
