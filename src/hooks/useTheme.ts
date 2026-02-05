'use client'

import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'memo-app-theme'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // 초기 테마 로드
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'

    const initialTheme = storedTheme || systemTheme
    setTheme(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)
  }, [])

  // 테마 적용 함수
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  // 테마 토글
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }, [theme, applyTheme])

  // 테마 설정
  const setThemeMode = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme)
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      applyTheme(newTheme)
    },
    [applyTheme]
  )

  return {
    theme,
    mounted,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: theme === 'dark',
  }
}
