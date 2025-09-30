/**
 * 画像関連のユーティリティ関数
 */

// サポートされている画像ファイル拡張子
const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'tiff',
  'tif',
];

/**
 * ファイル名から拡張子が画像かどうかを判定する
 * @param filename ファイル名
 * @returns 画像ファイルかどうか
 */
export const isImageFile = (filename: string): boolean => {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  const extension = filename.toLowerCase().split('.').pop();
  return extension ? IMAGE_EXTENSIONS.includes(extension) : false;
};

/**
 * artifactDeltaから画像ファイルのリストを抽出する
 * @param artifactDelta artifactDeltaオブジェクト
 * @returns 画像ファイルの配列
 */
export const extractImageFiles = (
  artifactDelta?: Record<string, unknown> | { [key: string]: unknown }
): Array<{ filename: string; version: number }> => {
  console.log('extractImageFiles - Input artifactDelta:', artifactDelta);

  if (!artifactDelta || typeof artifactDelta !== 'object') {
    console.log(
      'extractImageFiles - Invalid artifactDelta, returning empty array'
    );
    return [];
  }

  const imageFiles: Array<{ filename: string; version: number }> = [];

  // artifactDelta の構造: { "filename.ext": version_number }
  Object.entries(artifactDelta).forEach(([key, value]) => {
    console.log('extractImageFiles - Processing entry:', {
      key,
      value,
      type: typeof value,
    });

    // 主要パターン: ファイル名 -> バージョン番号
    if (isImageFile(key)) {
      // バージョン番号の処理
      let version = 1; // デフォルト値

      if (typeof value === 'number') {
        version = value;
      } else if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        version = isNaN(parsed) ? 1 : parsed;
      }

      console.log('extractImageFiles - Found image file:', {
        filename: key,
        version,
        originalValue: value,
      });

      imageFiles.push({
        filename: key,
        version,
      });
    }
    // ネストされたオブジェクト内のファイル名を検索（予備）
    else if (typeof value === 'object' && value !== null) {
      const valueObj = value as Record<string, unknown>;
      if (
        valueObj.filename &&
        typeof valueObj.filename === 'string' &&
        isImageFile(valueObj.filename)
      ) {
        const version = valueObj.version
          ? typeof valueObj.version === 'string'
            ? parseInt(valueObj.version, 10)
            : Number(valueObj.version)
          : 1;
        console.log('extractImageFiles - Found image file (nested):', {
          filename: valueObj.filename,
          version,
        });
        imageFiles.push({
          filename: valueObj.filename,
          version,
        });
      }
    }
  });

  console.log('extractImageFiles - Final result:', imageFiles);
  return imageFiles;
};

/**
 * 画像ダウンロードURLを生成する
 * @param filename ファイル名
 * @param version バージョン
 * @param userId ユーザーID
 * @param sessionId セッションID
 * @param selectedAgent 選択されたエージェント
 * @param invocationId 実行ID
 * @returns ダウンロードURL
 */
export const generateImageUrl = (
  filename: string,
  version?: number,
  userId?: string,
  sessionId?: string,
  selectedAgent?: string,
  _invocationId?: string // 将来の拡張用に残しておくが現在は未使用
): string => {
  // 直接バックエンドAPIを使用（開発環境）
  const backendUrl = 'http://localhost:8000';

  // 新しいAPIエンドポイント形式
  // /apps/{app_name}/users/{user_id}/sessions/{session_id}/artifacts/{artifact_name}/versions/{version_id}
  const appName = selectedAgent || 'document_creating_agent';
  const user = userId || 'anonymous';
  const session = sessionId || 'default_session';
  const versionId = version || 0;

  return `${backendUrl}/apps/${appName}/users/${user}/sessions/${session}/artifacts/${filename}/versions/${versionId}`;
};

/**
 * 画像ファイルのMIMEタイプを取得する
 * @param filename ファイル名
 * @returns MIMEタイプ
 */
export const getImageMimeType = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'image/png'; // デフォルト
  }
};

/**
 * 画像サイズ（幅）に基づいてCSSクラスを決定する
 * @param naturalWidth 画像の自然な幅
 * @returns CSSクラス文字列
 */
export const getImageSizeClass = (naturalWidth?: number): string => {
  if (!naturalWidth) {
    return 'max-w-md'; // デフォルト
  }

  if (naturalWidth <= 300) {
    return 'max-w-xs'; // 小さい画像
  } else if (naturalWidth <= 600) {
    return 'max-w-md'; // 中サイズ画像
  } else if (naturalWidth <= 1000) {
    return 'max-w-lg'; // 大きい画像
  } else {
    return 'max-w-2xl'; // 非常に大きい画像
  }
};
