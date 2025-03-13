import { cn } from "@/lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes to apply to the grid container */
  className?: string;
  /** Rotation angle of the grid in degrees */
  angle?: number;
  /** Grid cell size in pixels */
  cellSize?: number;
  /** Grid opacity value between 0 and 1 */
  opacity?: number;
  /** Grid line color (now only for dark mode) */
  darkLineColor?: string;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  darkLineColor = "gray",
  ...props
}: RetroGridProps) {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        "opacity-[var(--opacity)]",
        className
      )}
      style={gridStyles}
      {...props}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)] [margin-left:-200%] [transform-origin:100%_0_0] animate-grid [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-90% to-transparent" />
    </div>
  );
}