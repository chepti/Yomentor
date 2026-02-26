interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <img
      src="/logo-pisga.png"
      alt="פסגה מעלה אדומים"
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
