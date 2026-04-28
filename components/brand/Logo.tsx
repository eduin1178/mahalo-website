import Image from "next/image"
import { cn } from "@/lib/utils"

type LogoProps = {
  variant?: "default" | "white"
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function Logo({
  variant = "default",
  width = 160,
  height = 48,
  className,
  priority,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Mahalo Enterprise"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto",
        variant === "white" && "brightness-0 invert",
        className,
      )}
    />
  )
}
