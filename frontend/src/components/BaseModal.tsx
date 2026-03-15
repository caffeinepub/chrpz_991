import { X } from "lucide-react";
import { ReactNode } from "react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: BaseModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-4xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[80vh] overflow-hidden`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            {title && (
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            )}
            {!title && <div />}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
