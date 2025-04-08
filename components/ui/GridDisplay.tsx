import React from "react";
import type { Modules } from "../../src/App"

type Props = {
  modules: Modules[];
  onTileClick?: (addr: number) => void;
};

const GridDisplay: React.FC<Props> = ({ modules, onTileClick }) => {
  const maxX = Math.max(...modules.map((m) => m.x)) + 1;
  const maxY = Math.max(...modules.map((m) => m.y)) + 1;

  const grid = Array.from({ length: maxY }, () =>
    Array.from({ length: maxX }, () => null as Modules | null)
  );

  modules.forEach((mod) => {
    grid[mod.y][mod.x] = mod;
  });

  return (
    <div
      className="grid-container"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${maxX}, 1fr)`,
        gridTemplateRows: `repeat(${maxY}, 1fr)`,
        width: "500px",     // Fixed width
        height: "500px",    // Fixed height
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