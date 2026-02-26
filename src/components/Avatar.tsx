interface AvatarProps {
  src?: string | null
  alt?: string
  size?: number
}

export function Avatar({ src, alt = '', size = 40 }: AvatarProps) {
  return (
    <div
      className="rounded-full overflow-hidden bg-muted flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-sm">?</span>
      )}
    </div>
  )
}
