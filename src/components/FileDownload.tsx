'use client';

import React from 'react';

interface FileDownloadProps {
  content: string;
  artifactDelta?: { type?: string; metadata?: Record<string, unknown> };
  userId?: string;
  sessionId?: string;
  selectedAgent?: string;
  invocationId?: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({
  content,
  artifactDelta,
  userId,
  sessionId,
  selectedAgent,
  invocationId,
}) => {
  // artifactDeltaが存在しない場合は何も表示しない
  if (!artifactDelta) {
    return null;
  }

  // 画像ファイルかどうかを判定する関数
  const isImageFile = (filename: string): boolean => {
    const imageExtensions = [
      'png',
      'jpg',
      'jpeg',
      'gif',
      'bmp',
      'webp',
      'svg',
      'ico',
    ];
    const extension = filename.toLowerCase().split('.').pop() || '';
    return imageExtensions.includes(extension);
  };

  // artifactDeltaからファイル情報を抽出（画像ファイルを除外）
  const artifactFiles: { filename: string; version: number }[] = [];

  if (typeof artifactDelta === 'object' && artifactDelta !== null) {
    Object.entries(artifactDelta).forEach(([filename, version]) => {
      if (
        typeof filename === 'string' &&
        (typeof version === 'number' || typeof version === 'string')
      ) {
        // 画像ファイルでない場合のみ追加
        if (!isImageFile(filename)) {
          artifactFiles.push({
            filename,
            version:
              typeof version === 'string' ? parseInt(version, 10) : version,
          });
        }
      }
    });
  }

  // artifactDeltaからファイルが見つからない場合は、従来のパターンマッチングを試行
  let matches: RegExpMatchArray[] = [];
  if (artifactFiles.length === 0) {
    const patterns = [
      /\[(?:🗂️|📁|📄)\s*(.+?)\s*をダウンロード\]\((.*?)\)/g,
      /\[(.+\.(?:csv|json|txt|html|pdf|xlsx|docx|pptx|png|jpg))\s*をダウンロード\]\((.*?)\)/gi,
      /\[(.+\.(?:csv|json|txt|html|pdf|xlsx|docx|pptx|png|jpg))\]\((.*?)\)/gi,
    ];

    for (const pattern of patterns) {
      const allMatches = Array.from(content.matchAll(pattern));
      // 画像ファイルを除外
      matches = allMatches.filter((match) => !isImageFile(match[1]));
      if (matches.length > 0) break;
    }
  }

  // デバッグ用ログ
  console.log('FileDownload content:', content);
  console.log('FileDownload artifactDelta:', artifactDelta);
  console.log('FileDownload artifactFiles:', artifactFiles);
  console.log('FileDownload invocationId:', invocationId);
  console.log(
    'FileDownload download method:',
    invocationId ? 'invocation-based' : 'session-based'
  );

  // ダウンロードAPI呼び出しを関数でラップ
  const downloadFile = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`
      );
    }
    return await response.blob();
  };

  // 動的ダウンロードURL生成関数
  const generateDownloadUrl = (filename: string, version?: number): string => {
    const baseUrl = window.location.origin;
    const versionParam = version !== undefined ? `?version=${version}` : '';

    // invocationIdがある場合は、invocationIdベースのエンドポイントを使用
    if (invocationId) {
      return `${baseUrl}/download/artifact/by-invocation/${invocationId}/${filename}${versionParam}`;
    }

    // フォールバック: 従来の方法
    const agent = selectedAgent || 'document_creating_agent';
    const user = userId || 'anonymous';
    const session = sessionId || 'default_session';
    return `${baseUrl}/download/artifact/${agent}/${user}/${session}/${filename}${versionParam}`;
  };

  const handleDownload = async (filename: string, url?: string) => {
    try {
      // URLが提供されていない場合は動的に生成
      const downloadUrl = url || generateDownloadUrl(filename);

      if (downloadUrl.startsWith('http')) {
        // ストリーミングダウンロードエンドポイントの場合
        if (downloadUrl.includes('/download/artifact/')) {
          // 汎用Artifactダウンロードの場合、ラップした関数でダウンロードを試行
          const blob = await downloadFile(downloadUrl);
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        } else {
          // その他の外部URLの場合
          window.open(downloadUrl, '_blank');
        }
      } else {
        // Base64データまたはローカルファイルの場合（従来の処理）
        const blob = await downloadFile(
          `/api/download?file=${encodeURIComponent(downloadUrl)}`
        );
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('ダウンロードに失敗しました。エラー: ' + (error as Error).message);
    }
  };

  if (artifactFiles.length === 0 && matches.length === 0) {
    // デバッグ表示（開発時のみ）
    if (content.includes('をダウンロード') || content.includes('download')) {
      return (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">
            🐛 デバッグ情報
          </h4>
          <p className="text-sm text-yellow-700">
            ダウンロード関連のテキストが検出されましたが、artifactDeltaまたは正規表現にマッチしませんでした。
          </p>
          <details className="mt-2">
            <summary className="text-xs text-yellow-600 cursor-pointer">
              詳細を表示
            </summary>
            <pre className="text-xs mt-1 p-2 bg-yellow-100 rounded overflow-auto max-h-32">
              Content: {content}
              ArtifactDelta: {JSON.stringify(artifactDelta)}
            </pre>
          </details>
          <div className="mt-2">
            <button
              onClick={() => {
                // テスト用のダウンロード
                handleDownload('test.csv');
              }}
              className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
            >
              テストダウンロード
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  // const totalFiles = artifactFiles.length + matches.length;

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      <div className="space-y-2">
        {/* artifactDeltaからのファイル表示 */}
        {artifactFiles.map((file, index) => (
          <button
            key={`artifact-${index}`}
            onClick={() => handleDownload(file.filename)}
            className="flex items-center space-x-3 w-full p-3 text-left bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-blue-300 rounded-lg text-blue-700 hover:text-blue-900 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">
                {file.filename}
              </span>
              <span className="text-xs text-blue-500 opacity-75">
                {file.filename.toLowerCase().split('.').pop()?.toUpperCase()}{' '}
                ファイル (v{file.version})
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              <span>ダウンロード</span>
            </div>
          </button>
        ))}

        {/* 従来のパターンマッチングからのファイル表示 */}
        {matches.map(([, filename, url], index) => (
          <button
            key={`match-${index}`}
            onClick={() => handleDownload(filename, url)}
            className="flex items-center space-x-3 w-full p-3 text-left bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-blue-300 rounded-lg text-blue-700 hover:text-blue-900 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">{filename}</span>
              <span className="text-xs text-blue-500 opacity-75">
                {filename.toLowerCase().split('.').pop()?.toUpperCase()}{' '}
                ファイル
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              <span>ダウンロード</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileDownload;
