'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, Trash2, Check, Loader } from 'react-feather'
import { UploadHistoryItem } from '@/hooks/useUploadHistory'

interface UploadHistoryProps {
  history: UploadHistoryItem[]
  onDeleteFile: (id: string) => Promise<{ success: boolean; error?: string }>
}

export default function UploadHistory({ 
  history, 
  onDeleteFile 
}: UploadHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    
    // Show top fade if we've scrolled down
    setShowTopFade(scrollTop > 0)
    
    // Show bottom fade if we haven't scrolled to the bottom
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 1)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    handleScroll()

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [history])

  if (history.length === 0) {
    return null
  }

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setError(null)
    
    try {
      const result = await onDeleteFile(id)
      if (!result.success) {
        setError(result.error || 'Failed to delete file')
      }
    } catch (err) {
      setError('Failed to delete file')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="w-full max-w-md space-y-4 flex flex-col h-full md:h-auto">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upload History ({history.length})
        </h3>
      </div>

      {error && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="relative flex-1 min-h-0 md:flex-none">
        <div 
          ref={scrollContainerRef}
          className="space-y-2 h-full md:max-h-64 overflow-y-auto"
        >
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <a 
                  href={item.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {item.fileName}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.uploadedAt)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(item.shortUrl, item.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded active:scale-95 transition-all duration-150 cursor-pointer ${
                    copiedId === item.id
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  }`}
                >
                  {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className={`w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded active:scale-95 transition-all duration-150 ${
                    deletingId === item.id
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-red-200 dark:hover:bg-red-800/40 hover:text-red-800 dark:hover:text-red-200'
                  }`}
                >
                  {deletingId === item.id ? 
                    <Loader size={14} className="animate-spin" /> : 
                    <Trash2 size={14} />
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        
        {/* Top fade overlay when scrolled down */}
        <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 dark:from-gray-900 to-transparent pointer-events-none transition-opacity duration-300 ${
          showTopFade ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Bottom fade overlay when there's more content to scroll */}
        <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none transition-opacity duration-300 ${
          showBottomFade ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>
    </div>
  )
}