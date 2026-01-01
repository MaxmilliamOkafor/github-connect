import { useMemo } from "react";

interface CalcDisplayProps {
  value: string;
}

export const CalcDisplay = ({ value }: CalcDisplayProps) => {
  const formattedValue = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Format with commas for thousands
    if (Number.isInteger(num) && !value.includes(".")) {
      return num.toLocaleString("en-US");
    }
    
    // Handle decimals
    const parts = value.split(".");
    const intPart = parseInt(parts[0]).toLocaleString("en-US");
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  }, [value]);

  const fontSize = useMemo(() => {
    const len = formattedValue.replace(/[,.]/g, "").length;
    if (len > 12) return "text-3xl";
    if (len > 9) return "text-4xl";
    if (len > 6) return "text-5xl";
    return "text-6xl";
  }, [formattedValue]);

  return (
    <div className="bg-calc-display rounded-2xl p-6 min-h-[100px] flex items-end justify-end overflow-hidden">
      <span 
        className={`font-mono font-medium text-foreground ${fontSize} transition-all duration-200 truncate`}
      >
        {formattedValue}
      </span>
    </div>
  );
};
