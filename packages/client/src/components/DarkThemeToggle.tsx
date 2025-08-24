"use client"

import { Toggle } from "@/components/ui/toggle"
import { Moon, Sun } from "lucide-react"
import * as React from "react"

export function DarkThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // 检查本地存储或系统偏好
    const stored = localStorage.getItem('darkMode')
    const isDarkMode = stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)
    
    // 应用主题
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    // 更新DOM和本地存储
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={toggleTheme}
      aria-label="切换暗色模式"
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Toggle>
  )
}
