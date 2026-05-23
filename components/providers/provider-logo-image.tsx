import { cn } from "@/lib/utils";

type ProviderLogoImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ProviderLogoImage({
  src,
  alt,
  className,
}: ProviderLogoImageProps) {
  return (
    // Provider logos are uploaded dynamically to R2. Use a plain <img> so the
    // render path is not coupled to Next Image's build-time remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("block", className)}
      loading="lazy"
      decoding="async"
    />
  );
}
