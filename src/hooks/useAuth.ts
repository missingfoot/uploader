'use client'

import { useState, useEffect } from 'react'

const AUTH_KEY_STORAGE = 'uploader_auth_key'

export function useAuth() {
  const [authKey, setAuthKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedKey = localStorage.getItem(AUTH_KEY_STORAGE)
    setAuthKey(storedKey)
    setIsLoading(false)
  }, [])

  const saveAuthKey = (key: string) => {
    localStorage.setItem(AUTH_KEY_STORAGE, key)
    setAuthKey(key)
  }

  const clearAuthKey = () => {
    localStorage.removeItem(AUTH_KEY_STORAGE)
    setAuthKey(null)
  }

  const isAuthenticated = Boolean(authKey)

  return {
    authKey,
    isAuthenticated,
    isLoading,
    saveAuthKey,
    clearAuthKey,
  }
}