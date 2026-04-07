import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export function Button({
  className = "",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
        variant === "default" &&
          "bg-emerald-500 text-black hover:bg-emerald-400",
        variant === "outline" &&
          "border border-gray-300 text-black hover:bg-gray-100",
        className
      )}
      {...props}
    />
  );
}