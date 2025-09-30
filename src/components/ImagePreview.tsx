'use client';

import React, { useState, useCallback } from 'react';
import {
  generateImageUrl,
  getImageSizeClass,
  getImageMimeType,
} from '@/utils/imageUtils';

interface ImagePreviewProps {
  filename: string;
  version?: number;
  userId?: string;
  sessionId?: string;
  selectedAgent?: string;
  invocationId?: string;
  alt?: string;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  filename,
  version,
  userId,
  sessionId,
  selectedAgent,
  invocationId,
  alt,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState<number>();
  const [showFullSize, setShowFullSize] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  const apiUrl = generateImageUrl(
    filename,
    version,
    userId,
    sessionId,
    selectedAgent,
    invocationId
  );

  // Base64画像データを取得してデータURLに変換
  const fetchImageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.inlineData && data.inlineData.data) {
        // MIMEタイプの決定（APIレスポンスを優先、なければファイル名から推測）
        const mimeType = data.inlineData.mimeType || getImageMimeType(filename);

        // URL-safe base64を標準base64に変換してから、改行文字やスペースを削除
        const standardBase64Data = data.inlineData.data
          .replace(/-/g, '+')  // URL-safe base64の - を + に変換
          .replace(/_/g, '/')  // URL-safe base64の _ を / に変換
          .replace(/[\r\n\s]/g, '');

        // データURLを作成
        const dataUrl = `data:${mimeType};base64,${standardBase64Data}`;
        setImageDataUrl(dataUrl);
      } else {
        throw new Error('Invalid response format: missing inlineData.data');
      }
    } catch (error) {
      console.error('ImagePreview - Failed to load image:', filename, error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filename]);

  // コンポーネントマウント時に画像データを取得
  React.useEffect(() => {
    fetchImageData();
  }, [fetchImageData]);

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      setNaturalWidth(img.naturalWidth);
    },
    []
  );

  const handleImageError = useCallback(() => {
    setError(true);
  }, []);

  const handleImageClick = useCallback(() => {
    setShowFullSize(!showFullSize);
  }, [showFullSize]);

  const sizeClass = getImageSizeClass(naturalWidth);

  if (error) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}
      >
        <div className="text-gray-500 text-sm">
          <span className="block mb-1">🖼️</span>
          <span className="block font-medium">{filename}</span>
          <span className="block text-xs mb-2">
            画像の読み込みに失敗しました
          </span>
          <details className="text-left">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              詳細情報
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono break-all">
              <div>
                <strong>API URL:</strong> {apiUrl}
              </div>
              <div>
                <strong>Version:</strong> {version || 'N/A'}
              </div>
              <div>
                <strong>User:</strong> {userId || 'N/A'}
              </div>
              <div>
                <strong>Session:</strong> {sessionId || 'N/A'}
              </div>
              <div>
                <strong>Data URL Length:</strong> {imageDataUrl.length}
              </div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center animate-pulse">
          <div className="text-gray-500 text-sm">
            <span className="block mb-1">🖼️</span>
            <span className="block font-medium">{filename}</span>
            <span className="block text-xs">読み込み中...</span>
          </div>
        </div>
      )}

      <div className={loading ? 'hidden' : 'block'}>
        <img
          src={imageDataUrl}
          alt={alt || filename}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
          className={`
            ${showFullSize ? 'max-w-full' : sizeClass}
            h-auto rounded-lg shadow-md cursor-pointer
            transition-all duration-300 hover:shadow-lg
            border border-gray-200
          `}
          style={{
            maxHeight: showFullSize ? 'none' : '400px',
          }}
        />

        {/* 画像情報とコントロール */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{filename}</span>
            {version !== undefined && (
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                v{version}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {naturalWidth && <span>{naturalWidth}px</span>}

            <button
              onClick={handleImageClick}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {showFullSize ? '縮小' : '拡大'}
            </button>

            <a
              href={imageDataUrl}
              download={filename}
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => e.stopPropagation()}
            >
              ダウンロード
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
