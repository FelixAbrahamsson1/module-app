import React from "react";
import type { Modules } from "../../src/App"

type Props = {
  modules: Modules[];
  onTileClick?: (addr: number) => void;
};

const GridDisplay: React.FC<Props> = ({ modules, onTileClick }) => {
  if (modules.length === 0) return null;

  // Find bounds
  const minX = Math.min(...modules.map((m) => m.x));
  const minY = Math.min(...modules.map((m) => m.y));
  const maxX = Math.max(...modules.map((m) => m.x));
  const maxY = Math.max(...modules.map((m) => m.y));

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  // Initialize grid
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null as Modules | null)
  );

  // Populate grid with adjusted indices
  modules.forEach((mod) => {
    const gridX = mod.x - minX;
    const gridY = mod.y - minY;
    grid[gridY][gridX] = mod;
  });

  return (
    <div
      className="grid-container"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        width: "500px",
        height: "500px",
        gap: "4px",
        border: "0px solid #888",
      }}
    >
      {grid.flatMap((row, y) =>
        row.map((mod, x) =>
          mod ? (
            <div
              key={mod.addr}
              onClick={() => onTileClick?.(mod.addr)}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#4CAF50",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontWeight: "bold",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {mod.addr}
            </div>
          ) : (
            <div
              key={`empty-${x}-${y}`}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#ccc",
                borderRadius: "4px",
              }}
            />
          )
        )
      )}
    </div>
  );
};

export default GridDisplay;
