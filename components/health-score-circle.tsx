"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface HealthScoreCircleProps {
  score: number
}

export function HealthScoreCircle({ score }: HealthScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 500)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-500"
    if (score >= 50) return "text-amber-600 dark:text-amber-500"
    return "text-red-600 dark:text-red-500"
  }

  const getStrokeColor = (score: number) => {
    if (score >= 80) return "#10b981"
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`text-6xl font-bold ${getColor(score)}`}
          >
            {animatedScore}
          </motion.div>
          <div className="text-sm text-muted-foreground font-medium mt-2">Health Score</div>
        </div>
      </div>
    </div>
  )
}
