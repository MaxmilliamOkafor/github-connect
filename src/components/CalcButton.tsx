import { cn } from "@/lib/utils";

interface CalcButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "number" | "operator" | "function";
  isActive?: boolean;
  className?: string;
}

export const CalcButton = ({
  children,
  onClick,
  variant = "number",
  isActive = false,
  className,
}: CalcButtonProps) => {
  const baseStyles = "h-16 rounded-2xl font-medium text-2xl transition-all duration-150 calc-btn-press select-none";
  
  const variantStyles = {
    number: "bg-calc-btn-number hover:bg-calc-btn-number-hover text-foreground",
    operator: cn(
      "text-primary-foreground font-semibold",
      isActive 
        ? "bg-foreground text-calc-btn-operator" 
        : "bg-calc-btn-operator hover:bg-calc-btn-operator-hover"
    ),
    function: "bg-calc-btn-function hover:bg-calc-btn-function-hover text-background font-semibold",
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
    </button>
  );
};
