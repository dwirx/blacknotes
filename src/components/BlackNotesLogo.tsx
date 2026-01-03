import { cn } from "@/lib/utils";

interface BlackNotesLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: "w-4 h-4", container: "w-6 h-6", text: "text-xs" },
  md: { icon: "w-5 h-5", container: "w-8 h-8", text: "text-sm" },
  lg: { icon: "w-6 h-6", container: "w-10 h-10", text: "text-base" },
};

export const BlackNotesLogo = ({ 
  className, 
  size = "sm",
  showText = true 
}: BlackNotesLogoProps) => {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        sizes.container,
        "rounded-lg bg-gradient-to-br from-primary via-primary/95 to-primary/90 flex items-center justify-center shadow-md",
        "border border-primary/30 relative overflow-hidden group"
      )}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <svg
          className={cn(sizes.icon, "relative z-10")}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Notebook base */}
          <path
            d="M5 5C5 4.44772 5.44772 4 6 4H16C16.5523 4 17 4.44772 17 5V19C17 19.5523 16.5523 20 16 20H6C5.44772 20 5 19.5523 5 19V5Z"
            fill="currentColor"
            className="text-primary-foreground"
            fillOpacity="0.15"
          />
          <path
            d="M5 5C5 4.44772 5.44772 4 6 4H16C16.5523 4 17 4.44772 17 5V19C17 19.5523 16.5523 20 16 20H6C5.44772 20 5 19.5523 5 19V5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
          
          {/* Binding/spine */}
          <line
            x1="7.5"
            y1="4"
            x2="7.5"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="text-primary-foreground"
            opacity="0.6"
          />
          
          {/* Text lines */}
          <line
            x1="9.5"
            y1="7.5"
            x2="15.5"
            y2="7.5"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="text-primary-foreground"
            opacity="0.5"
          />
          <line
            x1="9.5"
            y1="10"
            x2="15.5"
            y2="10"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="text-primary-foreground"
            opacity="0.5"
          />
          <line
            x1="9.5"
            y1="12.5"
            x2="13.5"
            y2="12.5"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="text-primary-foreground"
            opacity="0.5"
          />
          
          {/* Pen/Pencil */}
          <path
            d="M17.5 3L19.5 5L18 6.5L16 4.5L17.5 3Z"
            fill="currentColor"
            className="text-primary-foreground"
            opacity="0.9"
          />
          <line
            x1="17.5"
            y1="3"
            x2="19.5"
            y2="5"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary-foreground"
            opacity="0.6"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn(
          "font-semibold text-foreground tracking-tight",
          sizes.text
        )}>
          BlackNotes
        </span>
      )}
    </div>
  );
};
