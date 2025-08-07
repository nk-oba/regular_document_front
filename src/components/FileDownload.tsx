'use client'

import React from 'react'

interface FileDownloadProps {
  content: string
}

const FileDownload: React.FC<FileDownloadProps> = ({ content }) => {
  const downloadPattern = /\[(.+\.pptx?)\]\((.*?)\)/g
  const matches = [...content.matchAll(downloadPattern)]

  if (matches.length === 0) {
    return null
  }

  const handleDownload = async (filename: string, url: string) => {
    try {
      if (url.startsWith('http')) {
        // 外部URLの場合
        window.open(url, '_blank')
      } else {
        // Base64データまたはローカルファイルの場合
        const response = await fetch(`/api/download?file=${encodeURIComponent(url)}`)
        if (response.ok) {
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(downloadUrl)
        }
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert('ダウンロードに失敗しました。')
    }
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-blue-800 mb-2">📁 生成されたファイル</h4>
      <div className="space-y-2">
        {matches.map(([, filename, url], index) => (
          <button
            key={index}
            onClick={() => handleDownload(filename, url)}
            className="flex items-center space-x-2 w-full p-2 text-left bg-white hover:bg-blue-50 border border-blue-300 rounded text-blue-700 hover:text-blue-900 transition-colors"
          >
            <span className="text-lg">📄</span>
            <span className="font-medium">{filename}</span>
            <span className="ml-auto text-sm text-blue-600">ダウンロード</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default FileDownload