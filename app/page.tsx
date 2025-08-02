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