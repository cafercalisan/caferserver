import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gold/20 text-gold border border-gold/30",
        success: "bg-health-green/20 text-health-green border border-health-green/30",
        warning: "bg-health-yellow/20 text-health-yellow border border-health-yellow/30",
        danger: "bg-health-red/20 text-health-red border border-health-red/30",
        info: "bg-mana-blue/20 text-mana-blue border border-mana-blue/30",
        outline: "border border-castle-border text-parchment-dim",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
