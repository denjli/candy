"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Timer, Target, RotateCcw, Play } from "lucide-react"

type CandyType = "red" | "blue" | "green" | "yellow" | "purple"
type GameMode = "timed" | "moves" | null
type GameState = "menu" | "playing" | "gameOver"

interface Candy {
  type: CandyType
  id: string
}

const CANDY_COLORS = {
  red: "#FF6B6B",
  blue: "#4ECDC4",
  green: "#45B7D1",
  yellow: "#FFA726",
  purple: "#AB47BC",
}

const CANDY_EMOJIS = {
  red: "🍓",
  blue: "🍇",
  green: "🍏",
  yellow: "🍋",
  purple: "🍆",
}

const GRID_SIZE = 8

export default function SweetMatchMania() {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [board, setBoard] = useState<Candy[][]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [movesLeft, setMovesLeft] = useState(20)
  const [selectedCandy, setSelectedCandy] = useState<{ row: number; col: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Generate random candy type
  const getRandomCandyType = (): CandyType => {
    const types: CandyType[] = ["red", "blue", "green", "yellow", "purple"]
    return types[Math.floor(Math.random() * types.length)]
  }

  // Initialize board
  const initializeBoard = useCallback(() => {
    const newBoard: Candy[][] = []
    for (let row = 0; row < GRID_SIZE; row++) {
      newBoard[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        newBoard[row][col] = {
          type: getRandomCandyType(),
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        }
      }
    }
    return newBoard
  }, [])

  // Check for matches
  const findMatches = (board: Candy[][]): { row: number; col: number }[] => {
    const matches: { row: number; col: number }[] = []

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      let count = 1
      let currentType = board[row][0].type

      for (let col = 1; col < GRID_SIZE; col++) {
        if (board[row][col].type === currentType) {
          count++
        } else {
          if (count >= 3) {
            for (let i = col - count; i < col; i++) {
              matches.push({ row, col: i })
            }
          }
          count = 1
          currentType = board[row][col].type
        }
      }

      if (count >= 3) {
        for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
          matches.push({ row, col: i })
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      let count = 1
      let currentType = board[0][col].type

      for (let row = 1; row < GRID_SIZE; row++) {
        if (board[row][col].type === currentType) {
          count++
        } else {
          if (count >= 3) {
            for (let i = row - count; i < row; i++) {
              matches.push({ row: i, col })
            }
          }
          count = 1
          currentType = board[row][col].type
        }
      }

      if (count >= 3) {
        for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
          matches.push({ row: i, col })
        }
      }
    }

    return matches
  }

  // Remove matches and apply gravity
  const removeMatchesAndApplyGravity = (board: Candy[][], matches: { row: number; col: number }[]): Candy[][] => {
    const newBoard = board.map((row) => [...row])

    // Remove matched candies
    matches.forEach(({ row, col }) => {
      newBoard[row][col] = {
        type: getRandomCandyType(),
        id: `new-${row}-${col}-${Date.now()}-${Math.random()}`,
      }
    })

    // Apply gravity
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = []
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (!matches.some((match) => match.row === row && match.col === col)) {
          column.push(newBoard[row][col])
        }
      }

      // Fill with new candies from top
      while (column.length < GRID_SIZE) {
        column.push({
          type: getRandomCandyType(),
          id: `gravity-${col}-${Date.now()}-${Math.random()}`,
        })
      }

      // Place back in board
      for (let row = 0; row < GRID_SIZE; row++) {
        newBoard[row][col] = column[GRID_SIZE - 1 - row]
      }
    }

    return newBoard
  }

  // Check if swap is valid (creates a match)
  const isValidSwap = (board: Candy[][], row1: number, col1: number, row2: number, col2: number): boolean => {
    const newBoard = board.map((row) => [...row])

    // Swap candies
    const temp = newBoard[row1][col1]
    newBoard[row1][col1] = newBoard[row2][col2]
    newBoard[row2][col2] = temp

    // Check if this creates any matches
    const matches = findMatches(newBoard)
    return matches.length > 0
  }

  // Handle candy click
  const handleCandyClick = (row: number, col: number) => {
    if (isAnimating || gameState !== "playing") return

    if (!selectedCandy) {
      setSelectedCandy({ row, col })
    } else {
      const { row: selectedRow, col: selectedCol } = selectedCandy

      // Check if clicking the same candy
      if (selectedRow === row && selectedCol === col) {
        setSelectedCandy(null)
        return
      }

      // Check if candies are adjacent
      const isAdjacent =
        (Math.abs(selectedRow - row) === 1 && selectedCol === col) ||
        (Math.abs(selectedCol - col) === 1 && selectedRow === row)

      if (isAdjacent && isValidSwap(board, selectedRow, selectedCol, row, col)) {
        // Valid swap
        setIsAnimating(true)

        const newBoard = board.map((row) => [...row])
        const temp = newBoard[selectedRow][selectedCol]
        newBoard[selectedRow][selectedCol] = newBoard[row][col]
        newBoard[row][col] = temp

        setBoard(newBoard)

        if (gameMode === "moves") {
          setMovesLeft((prev) => prev - 1)
        }

        // Process matches after a short delay for animation
        setTimeout(() => {
          processMatches(newBoard)
        }, 300)
      }

      setSelectedCandy(null)
    }
  }

  // Process matches recursively
  const processMatches = (currentBoard: Candy[][]) => {
    const matches = findMatches(currentBoard)

    if (matches.length > 0) {
      const points = matches.length * 10 + (matches.length > 3 ? (matches.length - 3) * 5 : 0)
      setScore((prev) => prev + points)

      const newBoard = removeMatchesAndApplyGravity(currentBoard, matches)
      setBoard(newBoard)

      // Check for more matches after gravity
      setTimeout(() => {
        processMatches(newBoard)
      }, 500)
    } else {
      setIsAnimating(false)
    }
  }

  // Start game
  const startGame = (mode: GameMode) => {
    setGameMode(mode)
    setGameState("playing")
    setScore(0)
    setTimeLeft(60)
    setMovesLeft(20)
    setSelectedCandy(null)
    setIsAnimating(false)

    const newBoard = initializeBoard()
    setBoard(newBoard)

    // Remove initial matches
    setTimeout(() => {
      processMatches(newBoard)
    }, 100)
  }

  // Reset game
  const resetGame = () => {
    setGameState("menu")
    setGameMode(null)
    setBoard([])
  }

  // Timer effect
  useEffect(() => {
    if (gameState === "playing" && gameMode === "timed" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameState === "playing" && gameMode === "timed" && timeLeft === 0) {
      setGameState("gameOver")
    }
  }, [gameState, gameMode, timeLeft])

  // Check moves left
  useEffect(() => {
    if (gameState === "playing" && gameMode === "moves" && movesLeft === 0) {
      setGameState("gameOver")
    }
  }, [gameState, gameMode, movesLeft])

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-700 bg-clip-text text-transparent font-fredoka">
              🍭 Sweet Match Mania
            </CardTitle>
            <p className="text-gray-700 font-comic text-lg">Match 3 or more candies to score points!</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => startGame("timed")}
              className="w-full h-14 text-lg font-quicksand font-semibold bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-500 hover:to-rose-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Timer className="mr-2 h-5 w-5" />
              Timed Mode (60s)
            </Button>
            <Button
              onClick={() => startGame("moves")}
              className="w-full h-14 text-lg font-quicksand font-semibold bg-gradient-to-r from-cyan-400 to-violet-500 hover:from-cyan-500 hover:to-violet-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Target className="mr-2 h-5 w-5" />
              Moves Mode (20 moves)
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === "gameOver") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 font-fredoka">Game Over!</CardTitle>
            <div className="text-5xl font-bold text-purple-700 mt-2 font-comic">{score.toLocaleString()} points</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => startGame(gameMode)}
              className="w-full h-14 text-lg font-quicksand font-semibold bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Play className="mr-2 h-5 w-5" />
              Play Again
            </Button>
            <Button
              onClick={resetGame}
              variant="outline"
              className="w-full h-14 text-lg font-quicksand font-semibold bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Main Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-lg px-4 py-2 font-quicksand font-semibold shadow-lg">
              Score: {score.toLocaleString()}
            </Badge>
            {gameMode === "timed" && (
              <Badge variant="destructive" className="text-lg px-4 py-2 font-quicksand font-semibold shadow-lg">
                <Timer className="mr-1 h-4 w-4" />
                {timeLeft}s
              </Badge>
            )}
            {gameMode === "moves" && (
              <Badge variant="default" className="text-lg px-4 py-2 font-quicksand font-semibold shadow-lg">
                <Target className="mr-1 h-4 w-4" />
                {movesLeft} moves
              </Badge>
            )}
          </div>
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="bg-white/80 hover:bg-white shadow-lg font-quicksand"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Game Board */}
        <Card className="p-6 shadow-2xl border-0 bg-white/95">
          <div
            className="grid gap-2 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              maxWidth: "400px",
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((candy, colIndex) => (
                <button
                  key={candy.id}
                  onClick={() => handleCandyClick(rowIndex, colIndex)}
                  className={`
                    aspect-square rounded-xl border-2 transition-all duration-200 text-2xl
                    hover:scale-105 active:scale-95 flex items-center justify-center
                    ${
                      selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex
                        ? "border-yellow-400 shadow-lg scale-110"
                        : "border-white/50 hover:border-white/80"
                    }
                    ${isAnimating ? "pointer-events-none" : "cursor-pointer"}
                  `}
                  style={{
                    backgroundColor: CANDY_COLORS[candy.type],
                    boxShadow:
                      selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex
                        ? "0 0 25px rgba(255, 255, 0, 0.6)"
                        : "0 4px 8px rgba(0, 0, 0, 0.15)",
                  }}
                  disabled={isAnimating}
                >
                  {CANDY_EMOJIS[candy.type]}
                </button>
              )),
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="mt-4 p-4 shadow-lg border-0 bg-white/90">
          <p className="text-center text-sm text-gray-700 font-comic">
            Click two adjacent candies to swap them and create matches of 3 or more!
          </p>
        </Card>
      </div>
    </div>
  )
}

