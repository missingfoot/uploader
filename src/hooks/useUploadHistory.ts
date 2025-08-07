'use client'

import { useState, useEffect } from 'react'

export interface UploadHistoryItem {
  id: string
  fileName: string
  shortUrl: string
  uploadedAt: string
}

const UPLOAD_HISTORY_STORAGE = 'uploader_history'

export function useUploadHistory() {
  const [history, setHistory] = useState<UploadHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(UPLOAD_HISTORY_STORAGE)
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        setHistory(parsedHistory)
      }
    } catch (error) {
      console.error('Error loading upload history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addToHistory = (fileName: string, shortUrl: string, shortId: string) => {
    const newItem: UploadHistoryItem = {
      id: shortId,
      fileName,
      shortUrl,
      uploadedAt: new Date().toISOString(),
    }

    const updatedHistory = [newItem, ...history].slice(0, 20) // Keep only last 20 uploads
    setHistory(updatedHistory)
    
    try {
      localStorage.setItem(UPLOAD_HISTORY_STORAGE, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Error saving upload history:', error)
    }
  }

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(UPLOAD_HISTORY_STORAGE)
    } catch (error) {
      console.error('Error clearing upload history:', error)
    }
  }

  const removeFromHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
    
    try {
      localStorage.setItem(UPLOAD_HISTORY_STORAGE, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Error updating upload history:', error)
    }
  }

  const deleteFileAndRemoveFromHistory = async (id: string, authKey: string) => {
    try {
      const response = await fetch(`/api/delete?shortId=${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-key': authKey,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      // Only remove from history if deletion was successful
      removeFromHistory(id)
      return { success: true }
    } catch (error) {
      console.error('Error deleting file:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }

  return {
    history,
    isLoading,
    addToHistory,
    clearHistory,
    removeFromHistory,
    deleteFileAndRemoveFromHistory,
  }
}