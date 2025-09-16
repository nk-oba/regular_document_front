import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AuthStatusProps {
  mcpAdaAuth: any;
  mcpAdaLoading: boolean;
  onMcpAdaToggle: () => void;
}

const AuthStatus: React.FC<AuthStatusProps> = ({
  mcpAdaAuth,
  mcpAdaLoading,
  onMcpAdaToggle,
}) => {
  // mcpAdaAuth が null の場合は「未認証」状態として表示
  const authStatus = mcpAdaAuth?.authenticated || false;
  const isLoading = mcpAdaLoading;

  return (
    <button
      onClick={onMcpAdaToggle}
      disabled={mcpAdaLoading}
      className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        authStatus
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      }`}
      title={
        isLoading
          ? '処理中...'
          : authStatus
          ? 'クリックして認証を解除'
          : 'クリックして認証'
      }
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="w-2 h-2" />
      ) : (
        <div
          className={`w-2 h-2 rounded-full ${
            authStatus ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
      )}
      <span>
        Ad Analyzer:{' '}
        {isLoading ? '処理中...' : authStatus ? '認証済み' : '未認証'}
      </span>
      {!isLoading &&
        (authStatus ? (
          <svg
            className="w-3 h-3 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ))}
    </button>
  );
};

export default AuthStatus;
