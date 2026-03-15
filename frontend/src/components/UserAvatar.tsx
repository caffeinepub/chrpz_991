import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function UserAvatar({
  src,
  alt = "Profile",
  size = "md",
  className = "",
  onClick,
  title,
}: UserAvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-16 h-16",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden ${className}`}
      onClick={onClick}
      title={title}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <User className={`${iconSizes[size]} text-white`} />
      )}
    </Component>
  );
}
