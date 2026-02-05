'use server'

import { supabase } from '@/lib/supabase'
import { Memo, MemoFormData } from '@/types/memo'
import { MemoRow } from '@/types/database'
import { v4 as uuidv4 } from 'uuid'

// DB Row → Memo 인터페이스 변환 (snake_case → camelCase)
const toMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags,
  summary: row.summary ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

// 모든 메모 조회
export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch memos:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return data.map(toMemo)
}

// 특정 메모 조회
export async function getMemoById(id: string): Promise<Memo | null> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 메모를 찾을 수 없음
    }
    console.error('Failed to fetch memo:', error)
    throw new Error('메모를 불러오는데 실패했습니다.')
  }

  return toMemo(data)
}

// 메모 생성
export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()
  const newMemo = {
    id: uuidv4(),
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('memos')
    .insert(newMemo)
    .select()
    .single()

  if (error) {
    console.error('Failed to create memo:', error)
    throw new Error('메모 생성에 실패했습니다.')
  }

  return toMemo(data)
}

// 메모 수정
export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update memo:', error)
    throw new Error('메모 수정에 실패했습니다.')
  }

  return toMemo(data)
}

// 메모 삭제
export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete memo:', error)
    throw new Error('메모 삭제에 실패했습니다.')
  }
}

// 모든 메모 삭제
export async function clearAllMemos(): Promise<void> {
  const { error } = await supabase.from('memos').delete().neq('id', '')

  if (error) {
    console.error('Failed to clear memos:', error)
    throw new Error('메모 전체 삭제에 실패했습니다.')
  }
}

// 메모 AI 요약 생성 및 저장
export async function summarizeMemo(id: string): Promise<string> {
  // 1. 메모 조회
  const { data: memo, error: fetchError } = await supabase
    .from('memos')
    .select('content, summary')
    .eq('id', id)
    .single()

  if (fetchError || !memo) {
    console.error('Failed to fetch memo for summarization:', fetchError)
    throw new Error('메모를 찾을 수 없습니다.')
  }

  // 이미 요약이 있으면 반환
  if (memo.summary) {
    return memo.summary
  }

  // 2. Google GenAI로 요약 생성
  const apiKey = process.env.GOOGLE_GENAI_API_KEY
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.')
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `다음 메모 내용을 한국어로 간결하게 요약해줘:\n\n${memo.content}`,
  })

  const summary = response.text
  if (!summary) {
    throw new Error('요약 생성에 실패했습니다.')
  }

  // 3. DB에 요약 저장
  const { error: updateError } = await supabase
    .from('memos')
    .update({ summary })
    .eq('id', id)

  if (updateError) {
    console.error('Failed to save summary:', updateError)
    throw new Error('요약 저장에 실패했습니다.')
  }

  return summary
}

// 샘플 데이터 시딩
export async function seedSampleMemos(): Promise<boolean> {
  // 기존 메모가 있는지 확인
  const { count, error: countError } = await supabase
    .from('memos')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Failed to check existing memos:', countError)
    return false
  }

  // 기존 데이터가 있으면 시딩하지 않음
  if (count && count > 0) {
    return false
  }

  const sampleMemos = [
    {
      id: uuidv4(),
      title: '프로젝트 회의 준비',
      content:
        '다음 주 월요일 오전 10시 프로젝트 킥오프 미팅을 위한 준비사항:\n\n- 프로젝트 범위 정의서 작성\n- 팀원별 역할 분담\n- 일정 계획 수립\n- 필요한 리소스 정리',
      category: 'work',
      tags: ['회의', '프로젝트', '준비'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(),
      title: 'React 18 새로운 기능 학습',
      content:
        'React 18에서 새로 추가된 기능들을 학습해야 함:\n\n1. Concurrent Features\n2. Automatic Batching\n3. Suspense 개선사항\n4. useId Hook\n5. useDeferredValue Hook\n\n이번 주말에 공식 문서를 읽고 간단한 예제를 만들어보자.',
      category: 'study',
      tags: ['React', '학습', '개발'],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(),
      title: '새로운 앱 아이디어: 습관 트래커',
      content:
        '매일 실천하고 싶은 습관들을 관리할 수 있는 앱:\n\n핵심 기능:\n- 습관 등록 및 관리\n- 일일 체크인\n- 진행 상황 시각화\n- 목표 달성 알림\n- 통계 분석\n\n기술 스택: React Native + Supabase\n출시 목표: 3개월 후',
      category: 'idea',
      tags: ['앱개발', '습관', 'React Native'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(),
      title: '주말 여행 계획',
      content:
        '이번 주말 제주도 여행 계획:\n\n토요일:\n- 오전: 한라산 등반\n- 오후: 성산일출봉 관광\n- 저녁: 흑돼지 맛집 방문\n\n일요일:\n- 오전: 우도 관광\n- 오후: 쇼핑 및 기념품 구매\n- 저녁: 공항 이동\n\n준비물: 등산화, 카메라, 선크림',
      category: 'personal',
      tags: ['여행', '제주도', '주말'],
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(),
      title: '독서 목록',
      content:
        '올해 읽고 싶은 책들:\n\n개발 관련:\n- 클린 코드 (로버트 C. 마틴)\n- 리팩토링 2판 (마틴 파울러)\n- 시스템 디자인 인터뷰 (알렉스 쉬)\n\n자기계발:\n- 아토믹 해빗 (제임스 클리어)\n- 데일 카네기 인간관계론\n\n소설:\n- 82년생 김지영 (조남주)\n- 미드나잇 라이브러리 (매트 헤이그)',
      category: 'personal',
      tags: ['독서', '책', '자기계발'],
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uuidv4(),
      title: '성능 최적화 아이디어',
      content:
        '웹 애플리케이션 성능 최적화 방법들:\n\n프론트엔드:\n- 이미지 최적화 (WebP, lazy loading)\n- 코드 스플리팅\n- 번들 크기 최적화\n- 캐싱 전략\n\n백엔드:\n- 데이터베이스 쿼리 최적화\n- CDN 활용\n- 서버 사이드 렌더링\n- API 응답 캐싱\n\n모니터링:\n- Core Web Vitals 측정\n- 성능 예산 설정',
      category: 'idea',
      tags: ['성능', '최적화', '웹개발'],
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const { error } = await supabase.from('memos').insert(sampleMemos)

  if (error) {
    console.error('Failed to seed sample memos:', error)
    return false
  }

  console.log('Sample data seeded successfully!')
  return true
}
