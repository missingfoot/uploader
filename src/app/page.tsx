'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/hooks/useAuth'
import { useUploadHistory } from '@/hooks/useUploadHistory'
import AuthModal from '@/components/AuthModal'
import UploadHistory from '@/components/UploadHistory'

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { authKey, isAuthenticated, isLoading, saveAuthKey, clearAuthKey } = useAuth()
  const { 
    history, 
    isLoading: historyLoading, 
    addToHistory, 
    deleteFileAndRemoveFromHistory 
  } = useUploadHistory()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !authKey) return

    setUploading(true)
    setError(null)
    setUploadedUrl(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-auth-key': authKey,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid authentication key. Please refresh and try again.')
          clearAuthKey()
          return
        }
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadedUrl(data.url)
      addToHistory(file.name, data.url, data.shortId)
    } catch (err) {
      setError('Failed to upload file')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }, [authKey, clearAuthKey, addToHistory])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: !isAuthenticated,
  })

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl)
    }
  }

  const resetUpload = () => {
    setUploadedUrl(null)
    setError(null)
  }

  const handleDeleteFile = async (id: string) => {
    if (!authKey) {
      return { success: false, error: 'Not authenticated' }
    }
    return await deleteFileAndRemoveFromHistory(id, authKey)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthModal onSubmit={saveAuthKey} />
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-start justify-center md:items-center overflow-hidden">
      <div className="max-w-md w-full h-full md:h-auto flex flex-col p-4 pt-8 md:pt-4 gap-6">
        <div className="flex-shrink-0">
          {!uploadedUrl ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
            >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                {isDragActive ? (
                  <p className="text-blue-600 dark:text-blue-400">Drop the file here...</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                )}
              </div>
              {uploading && (
                <div className="text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p className="mt-2">Uploading...</p>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-500 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Successful!</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                    {uploadedUrl}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      Copy Link
                    </button>
                    <a
                      href={uploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-center"
                    >
                      Visit Link
                    </a>
                    <button
                      onClick={resetUpload}
                      className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Upload Another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!uploadedUrl && !historyLoading && (
          <div className="flex-1 min-h-0 md:flex-none">
            <UploadHistory
              history={history}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        )}
      </div>
    </div>
  )
}