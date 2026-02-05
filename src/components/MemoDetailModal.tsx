'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { summarizeMemo } from '@/actions/memos'

interface MemoDetailModalProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => Promise<void>
}

export default function MemoDetailModal({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailModalProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  // 모달 열릴 때 기존 요약 표시 및 ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    // 기존 요약이 있으면 표시
    setSummary(memo?.summary ?? null)
    setIsSummarizing(false)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, memo?.summary])

  // 배경 클릭으로 모달 닫기
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      work: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      study:
        'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      idea: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  if (!isOpen || !memo) return null

  const handleEditClick = () => {
    onClose()
    onEdit(memo)
  }

  const handleDeleteClick = async () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      await onDelete(memo.id)
      onClose()
    }
  }

  const handleSummarize = async () => {
    if (!memo) return

    // 이미 요약이 있으면 다시 생성하지 않음
    if (summary) return

    setIsSummarizing(true)
    try {
      const result = await summarizeMemo(memo.id)
      setSummary(result)
    } catch (error) {
      console.error(error)
      alert('메모 요약 중 오류가 발생했습니다.')
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {memo.title}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>생성: {formatDate(memo.createdAt)}</span>
                  {memo.createdAt !== memo.updatedAt && (
                    <span className="sm:before:content-['•'] sm:before:mx-2">
                      수정: {formatDate(memo.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4"
              title="닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <div className="markdown-content text-gray-700 dark:text-gray-300 leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }: { children?: React.ReactNode }) => (
                    <p className="mb-4 last:mb-0 text-gray-700 dark:text-gray-300">
                      {children}
                    </p>
                  ),
                  h1: ({ children }: { children?: React.ReactNode }) => (
                    <h1 className="text-3xl font-bold mb-4 mt-8 first:mt-0 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }: { children?: React.ReactNode }) => (
                    <h2 className="text-2xl font-bold mb-3 mt-6 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }: { children?: React.ReactNode }) => (
                    <h3 className="text-xl font-semibold mb-2 mt-5 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }: { children?: React.ReactNode }) => (
                    <h4 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h4>
                  ),
                  ul: ({ children }: { children?: React.ReactNode }) => (
                    <ul className="list-disc mb-4 ml-6 space-y-2 text-gray-700 dark:text-gray-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }: { children?: React.ReactNode }) => (
                    <ol className="list-decimal mb-4 ml-6 space-y-2 text-gray-700 dark:text-gray-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }: { children?: React.ReactNode }) => (
                    <li className="text-gray-700 dark:text-gray-300">
                      {children}
                    </li>
                  ),
                  code: ({
                    children,
                    className,
                  }: {
                    children?: React.ReactNode
                    className?: string
                  }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-200 dark:border-gray-600 font-mono text-sm">
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }: { children?: React.ReactNode }) => {
                    // pre는 code를 감싸므로 스타일링은 code에서 처리
                    return <pre className="mb-4">{children}</pre>
                  },
                  blockquote: ({
                    children,
                  }: {
                    children?: React.ReactNode
                  }) => (
                    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 pl-4 py-2 italic my-4 text-gray-700 dark:text-gray-300 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  a: ({
                    children,
                    href,
                  }: {
                    children?: React.ReactNode
                    href?: string
                  }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }: { children?: React.ReactNode }) => (
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }: { children?: React.ReactNode }) => (
                    <em className="italic text-gray-700 dark:text-gray-300">
                      {children}
                    </em>
                  ),
                  hr: () => (
                    <hr className="my-6 border-gray-300 dark:border-gray-600" />
                  ),
                  table: ({ children }: { children?: React.ReactNode }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }: { children?: React.ReactNode }) => (
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }: { children?: React.ReactNode }) => (
                    <tbody>{children}</tbody>
                  ),
                  tr: ({ children }: { children?: React.ReactNode }) => (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {children}
                    </tr>
                  ),
                  th: ({ children }: { children?: React.ReactNode }) => (
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                      {children}
                    </th>
                  ),
                  td: ({ children }: { children?: React.ReactNode }) => (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                      {children}
                    </td>
                  ),
                }}
              >
                {memo.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* AI 요약 결과 */}
          {(summary || isSummarizing) && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                AI 요약
              </h3>
              {isSummarizing ? (
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  요약 중입니다...
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
          )}

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                태그
              </h3>
              <div className="flex gap-2 flex-wrap">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {isSummarizing ? '요약 중...' : 'AI 요약'}
            </button>
            <button
              onClick={handleEditClick}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              편집
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
