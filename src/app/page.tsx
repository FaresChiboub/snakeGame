"use client";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";

interface Coordinate {
  x: number;
  y: number;
}

interface Board {
  x: number;
  y: number;
}

const Homepage = () => {
  const [board] = useState<Board>({
    x: 26,
    y: 26,
  });
  const [snake, setSnake] = useState<Coordinate[]>([
    { x: 5, y: 3 }, // snake head
    { x: 4, y: 3 }, // snake body
    { x: 3, y: 3 }, // snake tail
  ]);
  const [direction, setDirection] = useState<string>("ArrowRight");
  const [nextDirection, setNextDirection] = useState<string | null>(null);
  const [food, setFood] = useState<Coordinate | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Generate random food position
  const generateFood = useCallback(() => {
    let newFood: Coordinate;
    do {
      newFood = {
        x: Math.floor(Math.random() * board.x),
        y: Math.floor(Math.random() * board.y),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    setFood(newFood);
  }, [board.x, board.y, snake]);

  // Initial food spawn
  useEffect(() => {
    if (!food && !gameOver) {
      generateFood();
    }
  }, [food, gameOver, generateFood]);

  // Determine current direction based on snake head and body
  const getCurrentDirection = useCallback(() => {
    if (snake.length < 2) return direction;
    const head = snake[0];
    const neck = snake[1];
    if (head.x > neck.x) return "ArrowRight";
    if (head.x < neck.x) return "ArrowLeft";
    if (head.y > neck.y) return "ArrowDown";
    if (head.y < neck.y) return "ArrowUp";
    return direction;
  }, [snake, direction]);

  // Memoized move function
  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const snakeHead = { ...newSnake[0] };
      const currentDirection = getCurrentDirection();

      // Apply next direction if valid
      let moveDirection = direction;
      if (nextDirection) {
        if (
          (nextDirection === "ArrowUp" && currentDirection !== "ArrowDown") ||
          (nextDirection === "ArrowDown" && currentDirection !== "ArrowUp") ||
          (nextDirection === "ArrowLeft" &&
            currentDirection !== "ArrowRight") ||
          (nextDirection === "ArrowRight" && currentDirection !== "ArrowLeft")
        ) {
          moveDirection = nextDirection;
          setDirection(nextDirection);
          setNextDirection(null);
        }
      }

      // Move snake
      switch (moveDirection) {
        case "ArrowUp":
          snakeHead.y -= 1;
          break;
        case "ArrowDown":
          snakeHead.y += 1;
          break;
        case "ArrowLeft":
          snakeHead.x -= 1;
          break;
        case "ArrowRight":
          snakeHead.x += 1;
          break;
        default:
          return prevSnake;
      }

      // Check game over conditions
      if (
        snakeHead.x < 0 ||
        snakeHead.x >= board.x ||
        snakeHead.y < 0 ||
        snakeHead.y >= board.y || // Wall collision
        newSnake.some(
          (segment) => segment.x === snakeHead.x && segment.y === snakeHead.y
        ) // Self collision
      ) {
        setGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(snakeHead);

      // Check if snake ate food
      if (food && snakeHead.x === food.x && snakeHead.y === food.y) {
        setScore((prev) => prev + 1); // Increase score
        generateFood(); // Spawn new food
        // Don't pop tail - snake grows
      } else {
        newSnake.pop(); // Normal movement, remove tail
      }

      return newSnake;
    });
  }, [
    direction,
    nextDirection,
    board.x,
    board.y,
    food,
    gameOver,
    getCurrentDirection,
    generateFood,
  ]);

  /* board design */
  const grid = useMemo(() => {
    return Array.from({ length: board.x * board.y }).map((_, index) => {
      const cellX = index % board.x;
      const cellY = Math.floor(index / board.x);
      const isSnake = snake.some(
        (segment) => segment.x === cellX && segment.y === cellY
      );
      const isFood = food && food.x === cellX && food.y === cellY;
      return (
        <div
          className={`border ${
            isSnake ? "bg-green-500" : isFood ? "bg-red-500" : "bg-gray-100"
          } border-slate-500`}
          key={`${cellX}-${cellY}`}
        />
      );
    });
  }, [board.x, board.y, snake, food]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          setNextDirection(e.key);
          break;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameOver]);

  // Handle automatic movement
  useEffect(() => {
    if (!gameOver) {
      intervalRef.current = window.setInterval(moveSnake, 200);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [moveSnake, gameOver]);

  // Prevent body scroll
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  // Reset game
  const resetGame = () => {
    setSnake([
      { x: 5, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 3 },
    ]);
    setDirection("ArrowRight");
    setNextDirection(null);
    setGameOver(false);
    setScore(0);
    setFood(null); // Will trigger new food generation
  };

  return (
    <div className="h-screen flex flex-col px-12 md:px-24 lg:px-36 xl:px-40 2xl:px-44 3xl:px-52">
      <div className="flex-shrink-0">
        <h1 className="text-3xl py-5 mt-5 text-center text-slate-600 font-semibold font-[cursive]">
          Snake Game
        </h1>
        <div className="flex p-2 items-center justify-center gap-5 bg-black/90 text-white">
          <div className="flex items-center gap-3 text-xl">
            <h1>Score:</h1>
            <span className="text-lg text-green-500 font-bold">{score}</span>
          </div>
        </div>
      </div>
      <div
        className="flex-grow grid border-black border-4 shadow-2xl my-20 w-full 2xl:w-[70%] mx-auto relative"
        style={{
          gridTemplateColumns: `repeat(${board.x},1fr)`,
          gridTemplateRows: `repeat(${board.y},1fr)`,
        }}
      >
        {grid}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="text-white text-4xl font-bold mb-4">Game Over!</div>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
