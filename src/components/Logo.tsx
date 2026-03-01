interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <div
      className={`flex items-center bg-transparent ${className}`}
      style={{ height: size }}
    >
      <img
        src="/logo-pisga.png"
        alt="פסגה מעלה אדומים"
        className="h-full w-auto object-contain object-left"
        style={{ maxWidth: size * 3 }}
      />
    </div>
  )
}
