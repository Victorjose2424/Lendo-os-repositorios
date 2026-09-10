import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Grid = number[][];

const GRID_SIZE = 4;

export const Game2048App: React.FC = () => {
  const [grid, setGrid] = useState<Grid>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(2480);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const getEmptyCells = (currentGrid: Grid) => {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentGrid[r][c] === 0) empty.push({ r, c });
      }
    }
    return empty;
  };

  const addRandomTile = useCallback((currentGrid: Grid): Grid => {
    const empty = getEmptyCells(currentGrid);
    if (empty.length === 0) return currentGrid;
    const randomCell = empty[Math.floor(Math.random() * empty.length)];
    const newGrid = currentGrid.map((row) => [...row]);
    newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let newGrid: Grid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const slideRow = (row: number[]) => {
    const filtered = row.filter((val) => val !== 0);
    let points = 0;
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        points += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    while (filtered.length < GRID_SIZE) {
      filtered.push(0);
    }
    return { newRow: filtered, points };
  };

  const moveLeft = useCallback(() => {
    let moved = false;
    let gainedPoints = 0;
    const newGrid = grid.map((row) => {
      const { newRow, points } = slideRow(row);
      gainedPoints += points;
      if (row.some((val, idx) => val !== newRow[idx])) moved = true;
      return newRow;
    });

    if (moved) {
      const finalGrid = addRandomTile(newGrid);
      setGrid(finalGrid);
      setScore((prev) => {
        const next = prev + gainedPoints;
        if (next > bestScore) setBestScore(next);
        return next;
      });
    }
  }, [grid, addRandomTile, bestScore]);

  const rotateGrid = (currentGrid: Grid): Grid => {
    const rotated: Grid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        rotated[c][GRID_SIZE - 1 - r] = currentGrid[r][c];
      }
    }
    return rotated;
  };

  const moveRight = useCallback(() => {
    // Reverse, slide left, reverse
    let moved = false;
    let gainedPoints = 0;
    const newGrid = grid.map((row) => {
      const reversed = [...row].reverse();
      const { newRow, points } = slideRow(reversed);
      gainedPoints += points;
      const unreversed = newRow.reverse();
      if (row.some((val, idx) => val !== unreversed[idx])) moved = true;
      return unreversed;
    });

    if (moved) {
      const finalGrid = addRandomTile(newGrid);
      setGrid(finalGrid);
      setScore((prev) => {
        const next = prev + gainedPoints;
        if (next > bestScore) setBestScore(next);
        return next;
      });
    }
  }, [grid, addRandomTile, bestScore]);

  const moveUp = useCallback(() => {
    // Rotate counter-clockwise (3 times), slide, rotate back
    let temp = rotateGrid(rotateGrid(rotateGrid(grid)));
    let moved = false;
    let gainedPoints = 0;
    temp = temp.map((row) => {
      const { newRow, points } = slideRow(row);
      gainedPoints += points;
      return newRow;
    });
    temp = rotateGrid(temp); // back to normal

    if (grid.some((row, r) => row.some((val, c) => val !== temp[r][c]))) {
      const finalGrid = addRandomTile(temp);
      setGrid(finalGrid);
      setScore((prev) => {
        const next = prev + gainedPoints;
        if (next > bestScore) setBestScore(next);
        return next;
      });
    }
  }, [grid, addRandomTile, bestScore]);

  const moveDown = useCallback(() => {
    let temp = rotateGrid(grid);
    let gainedPoints = 0;
    temp = temp.map((row) => {
      const { newRow, points } = slideRow(row);
      gainedPoints += points;
      return newRow;
    });
    temp = rotateGrid(rotateGrid(rotateGrid(temp)));

    if (grid.some((row, r) => row.some((val, c) => val !== temp[r][c]))) {
      const finalGrid = addRandomTile(temp);
      setGrid(finalGrid);
      setScore((prev) => {
        const next = prev + gainedPoints;
        if (next > bestScore) setBestScore(next);
        return next;
      });
    }
  }, [grid, addRandomTile, bestScore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        moveLeft();
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        moveRight();
      } else if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        moveUp();
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        moveDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveUp, moveDown]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-amber-100 text-amber-900 border-amber-200 font-bold';
      case 4:
        return 'bg-amber-200 text-amber-900 border-amber-300 font-bold';
      case 8:
        return 'bg-orange-400 text-white font-bold shadow';
      case 16:
        return 'bg-orange-500 text-white font-bold shadow';
      case 32:
        return 'bg-rose-500 text-white font-bold shadow';
      case 64:
        return 'bg-rose-600 text-white font-bold shadow';
      case 128:
        return 'bg-yellow-400 text-slate-900 font-black shadow-md';
      case 256:
        return 'bg-yellow-500 text-slate-900 font-black shadow-md';
      case 512:
        return 'bg-yellow-600 text-white font-black shadow-lg';
      case 1024:
      case 2048:
        return 'bg-amber-500 text-white font-black shadow-xl animate-pulse';
      default:
        return 'bg-slate-800/40 text-transparent';
    }
  };

  return (
    <div className="w-full h-full min-h-[480px] bg-amber-50/50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Game Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">2048</h1>
            <p className="text-xs text-slate-500">Use as setas para juntar os números</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-bold">SCORE</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{score}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="block text-[10px] text-amber-500 uppercase font-bold">RECORDE</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{bestScore}</span>
            </div>

            <button
              type="button"
              onClick={initGame}
              title="Reiniciar Jogo"
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4x4 Grid Container */}
        <div className="relative p-2.5 bg-slate-300 dark:bg-slate-900 rounded-xl shadow-inner w-full aspect-square grid grid-cols-4 gap-2">
          {grid.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center rounded-lg text-lg sm:text-2xl transition-all duration-100 ${getTileColor(
                  val
                )}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* On-screen Directional Controls for touch & click */}
        <div className="flex flex-col items-center mt-4 gap-1 sm:hidden">
          <button
            type="button"
            onClick={moveUp}
            className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 active:scale-90"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={moveLeft}
              className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={moveDown}
              className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 active:scale-90"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={moveRight}
              className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 active:scale-90"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
