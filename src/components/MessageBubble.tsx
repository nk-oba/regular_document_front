'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/types/chat';
import FileDownload from './FileDownload';
import ImagePreview from './ImagePreview';
import { extractImageFiles } from '@/utils/imageUtils';

interface MessageBubbleProps {
  message: Message;
  userName?: string;
  userId?: string;
  sessionId?: string;
  selectedAgent?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userName,
  userId,
  sessionId,
  selectedAgent,
}) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';

  // 画像ファイルを抽出
  const imageFiles = extractImageFiles(
    message.artifactDelta as unknown as Record<string, unknown>
  );

  // デバッグ用: メッセージの詳細をログ出力
  console.log('MessageBubble - Message Details:', {
    messageId: message.id,
    messageContent: message.content,
    artifactDelta: message.artifactDelta,
    extractedImageFiles: imageFiles,
    userId,
    sessionId,
    selectedAgent,
    invocationId: message.invocationId,
    sender: message.sender,
    isAgent,
    hasArtifactDelta: !!message.artifactDelta,
    artifactDeltaKeys: message.artifactDelta
      ? Object.keys(message.artifactDelta)
      : [],
  });

  // より詳細なレンダリング条件の確認
  const shouldShowImagePreview = isAgent && imageFiles.length > 0;
  console.log('MessageBubble - Image Preview Conditions:', {
    isAgent,
    imageFilesLength: imageFiles.length,
    shouldShowImagePreview,
    imageFiles,
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-start space-x-2 max-w-2xl ${
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
            isUser ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {isUser ? (userName ? userName.charAt(0).toUpperCase() : 'U') : 'AI'}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          <div className="break-words">
            {isAgent ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // カスタムスタイリング
                    h1: ({ ...props }) => (
                      <h1 className="text-lg font-bold mb-2" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2 className="text-base font-bold mb-2" {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h3 className="text-sm font-bold mb-1" {...props} />
                    ),
                    h4: ({ ...props }) => (
                      <h4 className="text-sm font-semibold mb-1" {...props} />
                    ),
                    h5: ({ ...props }) => (
                      <h5 className="text-xs font-semibold mb-1" {...props} />
                    ),
                    h6: ({ ...props }) => (
                      <h6 className="text-xs font-medium mb-1" {...props} />
                    ),
                    hr: ({ ...props }) => (
                      <hr
                        className="my-4 border-t border-gray-300"
                        {...props}
                      />
                    ),
                    del: ({ ...props }) => (
                      <del className="line-through text-gray-500" {...props} />
                    ),
                    p: ({ ...props }) => (
                      <p className="mb-2 last:mb-0" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc pl-4 mb-2" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="list-decimal pl-4 mb-2" {...props} />
                    ),
                    li: ({ children, ...props }) => {
                      if (
                        typeof children === 'object' &&
                        children &&
                        'props' in children &&
                        children.props?.type === 'checkbox'
                      ) {
                        return (
                          <li className="mb-1 flex items-center" {...props}>
                            <input
                              type="checkbox"
                              checked={children.props.checked || false}
                              disabled
                              className="mr-2"
                            />
                            {children.props.children}
                          </li>
                        );
                      }
                      return (
                        <li className="mb-1" {...props}>
                          {children}
                        </li>
                      );
                    },
                    input: ({ ...props }) => {
                      if (props.type === 'checkbox') {
                        return (
                          <input
                            type="checkbox"
                            checked={props.checked || false}
                            disabled
                            className="mr-2 cursor-default"
                            {...props}
                          />
                        );
                      }
                      return <input {...props} />;
                    },
                    code: ({
                      inline,
                      className,
                      children,
                      ...props
                    }: {
                      inline?: boolean;
                      className?: string;
                      children?: React.ReactNode;
                    }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : null;

                      return inline ? (
                        <code
                          className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <div className="relative">
                          {language && (
                            <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs px-2 py-1 rounded-bl">
                              {language}
                            </div>
                          )}
                          <code
                            className={`block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto ${
                              className || ''
                            }`}
                            {...props}
                          >
                            {children}
                          </code>
                        </div>
                      );
                    },
                    pre: ({ ...props }) => (
                      <pre
                        className="bg-gray-100 p-2 rounded mb-2 overflow-x-auto"
                        {...props}
                      />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-gray-300 pl-3 italic mb-2"
                        {...props}
                      />
                    ),
                    table: ({ ...props }) => (
                      <div className="overflow-x-auto mb-2">
                        <table
                          className="min-w-full border-collapse border border-gray-300"
                          {...props}
                        />
                      </div>
                    ),
                    thead: ({ ...props }) => (
                      <thead className="bg-gray-50" {...props} />
                    ),
                    tbody: ({ ...props }) => <tbody {...props} />,
                    tr: ({ ...props }) => (
                      <tr className="hover:bg-gray-50" {...props} />
                    ),
                    th: ({ ...props }) => (
                      <th
                        className="border border-gray-300 px-3 py-2 text-left font-semibold"
                        {...props}
                      />
                    ),
                    td: ({ ...props }) => (
                      <td
                        className="border border-gray-300 px-3 py-2"
                        {...props}
                      />
                    ),
                    a: ({ href, ...props }) => {
                      const isExternal =
                        href?.startsWith('http://') ||
                        href?.startsWith('https://');
                      return (
                        <a
                          href={href}
                          className="text-blue-600 hover:underline"
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          {...props}
                        />
                      );
                    },
                    strong: ({ ...props }) => (
                      <strong className="font-bold" {...props} />
                    ),
                    em: ({ ...props }) => <em className="italic" {...props} />,
                    // 画像の処理をカスタマイズ
                    img: ({ src, alt, ...props }) => {
                      console.log(
                        'ReactMarkdown img component - src:',
                        src,
                        'alt:',
                        alt
                      );

                      // artifactDelta から画像を処理する場合は、ImagePreview を使用
                      if (
                        src &&
                        imageFiles.some((file) => src.includes(file.filename))
                      ) {
                        const matchingFile = imageFiles.find((file) =>
                          src.includes(file.filename)
                        );
                        if (matchingFile) {
                          return (
                            <ImagePreview
                              filename={matchingFile.filename}
                              version={matchingFile.version}
                              userId={userId}
                              sessionId={sessionId}
                              selectedAgent={selectedAgent}
                              invocationId={message.invocationId}
                              alt={alt}
                              className="my-2"
                            />
                          );
                        }
                      }

                      // 通常の画像タグとして処理
                      return (
                        <img
                          src={src}
                          alt={alt}
                          className="max-w-full h-auto rounded-lg my-2"
                          onError={(e) => {
                            console.error('ReactMarkdown img load error:', {
                              src,
                              alt,
                              error: e,
                            });
                            // エラー時は非表示にする
                            e.currentTarget.style.display = 'none';
                          }}
                          {...props}
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* 画像プレビュー */}
          {(() => {
            console.log('MessageBubble - Rendering image preview section:', {
              isAgent,
              imageFilesLength: imageFiles.length,
              willRender: isAgent && imageFiles.length > 0,
            });

            if (isAgent && imageFiles.length > 0) {
              return (
                <div className="mt-3 space-y-3">
                  <div className="space-y-4">
                    {imageFiles.map((imageFile, index) => {
                      console.log('MessageBubble - Rendering ImagePreview:', {
                        index,
                        imageFile,
                        props: {
                          filename: imageFile.filename,
                          version: imageFile.version,
                          userId,
                          sessionId,
                          selectedAgent,
                          invocationId: message.invocationId,
                        },
                      });

                      return (
                        <ImagePreview
                          key={`${imageFile.filename}-${imageFile.version}-${index}`}
                          filename={imageFile.filename}
                          version={imageFile.version}
                          userId={userId}
                          sessionId={sessionId}
                          selectedAgent={selectedAgent}
                          invocationId={message.invocationId}
                          alt={`生成された画像: ${imageFile.filename}`}
                          className="w-full"
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })()}

          {/* 生成されたファイルのダウンロード機能 */}
          {isAgent && (
            <FileDownload
              content={message.content}
              artifactDelta={message.artifactDelta}
              userId={userId}
              sessionId={sessionId}
              selectedAgent={selectedAgent}
              invocationId={message.invocationId}
            />
          )}

          <div
            className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {message.timestamp.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
