# 트러블슈팅 가이드

이 문서는 프로젝트 개발 중 발생한 주요 문제와 해결 과정을 기록합니다.

## 목차

1. [드래그 기능 이벤트 리스너 참조 불일치 문제](#1-드래그-기능-이벤트-리스너-참조-불일치-문제)
2. [보드 캔버스와 드래그 위젯 이벤트 충돌 문제](#2-보드-캔버스와-드래그-위젯-이벤트-충돌-문제)
3. [Supabase Realtime DELETE 이벤트가 다른 사용자에게 반영되지 않는 문제](#3-supabase-realtime-delete-이벤트가-다른-사용자에게-반영되지-않는-문제)
4. [Tailwind CSS v4 다크모드 적용 문제](#4-tailwind-css-v4-다크모드-적용-문제)
5. [포맷팅된 텍스트 선택 불가 문제](#5-포맷팅된-텍스트-선택-불가-문제)
6. [협업 위젯 초기 위치 설정 문제](#6-협업-위젯-초기-위치-설정-문제)

---

## 1. 드래그 기능 이벤트 리스너 참조 불일치 문제

### 문제 상황

**날짜**: 2025년 12월  
**파일**: `src/shared/lib/use-draggable.ts`  
**증상**: 협업 위젯 드래그 기능이 첫 번째 시도에서 약간만 움직이다가 멈추는 현상 발생. 두 번째 시도부터는 정상 작동.

### 증상 상세

- 첫 번째 드래그 시도: 마우스를 약간 움직인 후 멈춤
- 두 번째 드래그 시도: 정상 작동
- 세 번째 드래그 시도: 다시 멈춤
- 네 번째 드래그 시도: 정상 작동
- **패턴**: 홀수 번째 시도는 실패, 짝수 번째 시도는 성공

### 원인 분석

#### 1단계: 초기 진단

콘솔 로그를 통해 확인한 사실:
- `handleMouseDown`은 정상적으로 호출됨
- 이벤트 리스너가 정상적으로 등록됨
- `handleMouseMove`가 처음 몇 번 호출된 후 더 이상 호출되지 않음
- `handleMouseUp`이 예상치 못하게 호출되지 않음

#### 2단계: 근본 원인 발견

**핵심 문제**: `useCallback`의 의존성 배열 변경으로 인한 함수 참조 불일치

```typescript
// 문제가 있던 코드
const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    // ...
  },
  [enabled, dragThreshold, clampPosition, onDragStart]
);

const handleMouseUp = useCallback(
  () => {
    // ...
  },
  [enabled, handleMouseMove, onDragEnd, onClick, savePosition, position]
);

const handleMouseDown = useCallback(
  (e: React.MouseEvent) => {
    // ...
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  },
  [enabled, excludeSelectors, handleMouseMove, handleMouseUp, position]
);
```

**문제점**:
1. `handleMouseMove`와 `handleMouseUp`이 의존성 변경 시 새로운 참조로 재생성됨
2. `handleMouseDown`에서 등록한 이벤트 리스너와 `handleMouseUp`에서 제거하려는 이벤트 리스너가 **다른 참조**
3. `removeEventListener`가 올바른 함수를 찾지 못해 이벤트 리스너가 제거되지 않음
4. 다음 드래그 시도 시 이전 리스너가 남아있어 충돌 발생

### 시행착오 과정

#### 시도 1: 이벤트 리스너 중복 제거 로직 추가

```typescript
// handleMouseDown에서 이전 리스너 제거 시도
window.removeEventListener('mousemove', handleMouseMove);
window.removeEventListener('mouseup', handleMouseUp);
```

**결과**: 실패 - 참조가 달라서 제거되지 않음

#### 시도 2: useEffect로 이벤트 리스너 관리

```typescript
useEffect(() => {
  if (isDragging) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, handleMouseMove, handleMouseUp]);
```

**결과**: 실패 - `isDragging` 상태 업데이트가 드래그 중에는 발생하지 않아 리스너가 등록되지 않음

#### 시도 3: DOM 직접 조작과 React 상태 분리

```typescript
// transform을 완전히 훅에서만 관리
// 컴포넌트에서는 transform 속성 자체를 제거
```

**결과**: 부분 성공 - 좌표 계산 문제는 해결되었지만 이벤트 리스너 문제는 지속

#### 시도 4: useRef로 함수 참조 유지 (최종 해결)

```typescript
// 이벤트 핸들러 참조를 ref로 유지
const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | undefined>(undefined);
const handleMouseUpRef = useRef<(() => void) | undefined>(undefined);

// handleMouseMove와 handleMouseUp 생성 후 ref에 저장
useEffect(() => {
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;
}, [handleMouseMove, handleMouseUp]);

// 이벤트 리스너 제거 시 ref에 저장된 참조 사용
if (handleMouseMoveRef.current) {
  window.removeEventListener('mousemove', handleMouseMoveRef.current);
}
```

**결과**: 성공 ✅

### 최종 해결 방법

#### 핵심 아이디어

`useRef`를 사용하여 항상 최신 함수 참조를 유지하고, 이벤트 리스너 등록/제거 시 동일한 참조를 보장.

#### 구현 코드

```typescript
// 1. ref 선언
const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | undefined>(undefined);
const handleMouseUpRef = useRef<(() => void) | undefined>(undefined);

// 2. 최신 참조를 ref에 저장
useEffect(() => {
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;
}, [handleMouseMove, handleMouseUp]);

// 3. 이벤트 리스너 제거 시 ref 사용
const handleMouseUp = useCallback(() => {
  // ...
  if (handleMouseMoveRef.current) {
    window.removeEventListener('mousemove', handleMouseMoveRef.current);
  }
  if (handleMouseUpRef.current) {
    window.removeEventListener('mouseup', handleMouseUpRef.current);
  }
  // ...
}, [enabled, handleMouseMove, onDragEnd, onClick, savePosition, position]);

// 4. 이벤트 리스너 등록 시에도 ref 업데이트
const handleMouseDown = useCallback(
  (e: React.MouseEvent) => {
    // ...
    // 이전 리스너 제거
    if (handleMouseMoveRef.current) {
      window.removeEventListener('mousemove', handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      window.removeEventListener('mouseup', handleMouseUpRef.current);
    }
    
    // ref에 최신 참조 저장
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    
    // 새 리스너 등록
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  },
  [enabled, excludeSelectors, handleMouseMove, handleMouseUp, position]
);
```

### 교훈

1. **이벤트 리스너 등록/제거는 항상 동일한 참조 사용**
   - `addEventListener`와 `removeEventListener`는 함수 참조를 비교하므로, 다른 참조를 사용하면 제거되지 않음

2. **useCallback의 의존성 배열 주의**
   - 의존성이 변경되면 함수가 재생성되어 참조가 변경됨
   - 이벤트 리스너와 함께 사용할 때는 특히 주의 필요

3. **useRef를 활용한 참조 유지**
   - 함수 참조를 ref에 저장하여 항상 최신 참조를 유지할 수 있음
   - 이벤트 리스너 관리에 유용한 패턴

4. **디버깅 전략**
   - 콘솔 로그로 이벤트 호출 추적
   - 함수 참조 비교 (`===` 연산자)
   - 이벤트 리스너 등록/제거 시점 확인

---

## 2. 보드 캔버스와 드래그 위젯 이벤트 충돌 문제

### 문제 상황

**날짜**: 2025년 12월  
**파일**: `src/widgets/board-canvas/ui/board-canvas.tsx`, `src/widgets/collaboration-widget/ui/collaboration-widget.tsx`  
**증상**: 협업 위젯을 드래그할 때 보드 캔버스의 패닝(panning) 기능이 동시에 작동하여 드래그가 제대로 작동하지 않음.

### 원인 분석

보드 캔버스와 협업 위젯이 같은 마우스 이벤트를 처리하려고 시도:

1. **보드 캔버스**: `onMouseDown`, `onMouseMove`, `onMouseUp`로 패닝 처리
2. **협업 위젯**: `onMouseDown`으로 드래그 시작, `window`에 `mousemove`, `mouseup` 리스너 등록

**충돌 지점**:
- 협업 위젯의 `onMouseDown`이 보드 캔버스로 버블링되어 캔버스의 패닝이 시작됨
- 보드 캔버스의 `handleMouseMove`가 협업 위젯 위에서도 실행됨

### 해결 방법

#### 1. 이벤트 버블링 방지

```typescript
// collaboration-widget.tsx
const handleMouseDown = useCallback(
  (e: React.MouseEvent) => {
    e.stopPropagation(); // 보드 캔버스로 이벤트 전파 방지
    // ...
  },
  [/* ... */]
);
```

#### 2. 보드 캔버스에서 협업 위젯 제외

```typescript
// board-canvas.tsx
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  // 협업 위젯 클릭은 무시
  const target = e.target as HTMLElement;
  if (target.closest('[data-collaboration-widget]')) {
    return;
  }
  // ...
}, [/* ... */]);

const handleMouseMove = useCallback((e: React.MouseEvent) => {
  // 협업 위젯 위에서는 캔버스 마우스 이벤트 무시
  const target = e.target as HTMLElement;
  if (target.closest('[data-collaboration-widget]')) {
    return;
  }
  // ...
}, [/* ... */]);
```

#### 3. 협업 위젯에 식별자 추가

```typescript
// collaboration-widget.tsx
<div
  ref={dragHandlers.ref}
  data-collaboration-widget // 식별자 추가
  onMouseDown={dragHandlers.onMouseDown}
>
  {/* ... */}
</div>
```

### 교훈

1. **이벤트 버블링 관리**
   - `stopPropagation()`으로 상위 요소로의 이벤트 전파 방지
   - 하위 요소의 이벤트는 `closest()`로 체크하여 제외

2. **data attribute 활용**
   - 특정 요소를 식별하기 위한 `data-*` 속성 사용
   - CSS 선택자로 쉽게 찾을 수 있음

3. **이벤트 핸들러에서 타겟 체크**
   - 이벤트가 의도한 요소에서 발생했는지 확인
   - `closest()`로 부모 요소까지 체크 가능

---

## 일반적인 디버깅 팁

### 1. 이벤트 리스너 문제

**증상**: 이벤트가 예상대로 작동하지 않음

**체크리스트**:
- [ ] 이벤트 리스너가 등록되었는지 확인
- [ ] 등록과 제거 시 동일한 함수 참조 사용하는지 확인
- [ ] 이벤트 버블링/캡처링 문제인지 확인
- [ ] 다른 이벤트 핸들러와 충돌하는지 확인

**디버깅 방법**:
```typescript
// 이벤트 리스너 등록 확인
console.log('리스너 등록:', typeof handleMouseMove);

// 함수 참조 비교
console.log('참조 동일:', handleMouseMove === handleMouseMoveRef.current);

// 이벤트 호출 추적
const callId = Math.random().toString(36).substr(2, 9);
console.log(`[EVENT-${callId}] 호출됨`);
```

### 2. React 상태와 DOM 동기화 문제

**증상**: 화면에 반영되지 않거나 예상과 다른 위치

**체크리스트**:
- [ ] React 상태와 ref가 동기화되어 있는지 확인
- [ ] DOM 직접 조작과 React 렌더링이 충돌하는지 확인
- [ ] `useEffect` 의존성 배열이 올바른지 확인

**디버깅 방법**:
```typescript
// 상태와 ref 비교
console.log('상태:', position);
console.log('ref:', positionRef.current);
console.log('DOM:', elementRef.current.style.transform);

// 동기화 시점 확인
useEffect(() => {
  console.log('동기화 실행:', { position, isDragging });
}, [position, isDragging]);
```

### 3. 성능 문제

**증상**: 드래그가 버벅이거나 느림

**체크리스트**:
- [ ] 드래그 중 불필요한 리렌더링이 발생하는지 확인
- [ ] `useCallback`, `useMemo`를 적절히 사용하는지 확인
- [ ] DOM 직접 조작을 사용하는지 확인 (transform 사용)

**최적화 팁**:
- 드래그 중에는 React 상태 업데이트 최소화
- `transform` 사용으로 GPU 가속 활용
- `willChange` CSS 속성으로 브라우저 최적화 힌트 제공

---

## 참고 자료

- [React useCallback 문서](https://react.dev/reference/react/useCallback)
- [React useRef 문서](https://react.dev/reference/react/useRef)
- [MDN addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [MDN removeEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)

---

## 3. Supabase Realtime DELETE 이벤트가 다른 사용자에게 반영되지 않는 문제

### 문제 상황

**날짜**: 2025년 12월 26일  
**파일**: `src/shared/lib/use-realtime-subscription.ts`, `src/features/content/model/use-board-content.ts`  
**증상**: 한 사용자가 보드 요소(포스트잇, 이미지)를 삭제해도 다른 사용자의 화면에서 실시간으로 사라지지 않음. 새로고침하면 사라짐.

### 증상 상세

- **INSERT 이벤트**: 정상 작동 (다른 사용자가 생성한 요소가 실시간으로 보임)
- **UPDATE 이벤트**: 정상 작동 (다른 사용자가 이동/수정한 요소가 실시간으로 반영됨)
- **DELETE 이벤트**: 작동하지 않음 (다른 사용자가 삭제한 요소가 실시간으로 사라지지 않음)
- **커서 위치**: 정상 작동 (다른 사용자의 커서가 실시간으로 보임)

### 원인 분석

#### 1단계: 초기 진단

콘솔 로그를 통해 확인한 사실:
- `useRealtimeSubscription` 훅이 호출됨
- DELETE 이벤트 리스너가 등록됨
- 하지만 `[RealtimeSubscription] DELETE 이벤트 수신` 로그가 전혀 나타나지 않음
- `handleRealtimeDelete` 함수가 호출되지 않음

#### 2단계: 근본 원인 발견

**핵심 문제 1**: PostgreSQL의 `REPLICA IDENTITY` 설정이 `DEFAULT`로 되어 있어 DELETE 이벤트에서 `payload.old`에 전체 행 데이터가 포함되지 않음

**핵심 문제 2**: `useEffect`의 의존성 배열이 계속 변경되어 cleanup만 실행되고 다시 실행되지 않음

**핵심 문제 3**: `channelName`과 `filter`가 매번 새로운 문자열로 생성되어 의존성 배열이 불안정함

### 시행착오 과정

#### 시도 1: DELETE 이벤트 핸들러 로직 강화

```typescript
// handleRealtimeDelete 함수에 더 많은 로깅 추가
// shouldIgnoreRealtimeEvent에서 DELETE 이벤트 처리 로직 개선
```

**결과**: 로그는 추가되었지만 여전히 DELETE 이벤트가 수신되지 않음

#### 시도 2: useEffect 의존성 배열 단순화

```typescript
// events 배열을 메모이제이션
const realtimeEvents = useMemo(() => ['INSERT', 'UPDATE', 'DELETE'] as RealtimeEvent[], []);

// channelName과 filter를 메모이제이션
const channelName = useMemo(() => channelNameProp, [channelNameProp]);
const filter = useMemo(() => filterProp, [filterProp]);
```

**결과**: 부분 성공 - 하지만 여전히 `useEffect`가 실행되지 않는 경우가 있음

#### 시도 3: 이전 값과 비교하여 실제 변경 시에만 실행

```typescript
// prevValuesRef를 사용하여 이전 값과 비교
const prevValuesRef = useRef({
  enabled,
  channelName,
  schema,
  table,
  filter,
  eventsKey,
});

useEffect(() => {
  const prev = prevValuesRef.current;
  const hasChanged = 
    prev.enabled !== enabled ||
    prev.channelName !== channelName ||
    // ...
  
  if (!hasChanged && channelRef.current) {
    return; // 변경 없으면 스킵
  }
  // ...
}, [/* 의존성 배열 */]);
```

**결과**: 부분 성공 - 하지만 여전히 DELETE 이벤트가 수신되지 않음

#### 시도 4: REPLICA IDENTITY FULL 적용 (최종 해결)

```sql
-- supabase/migrations/20241230000001_set_replica_identity_full.sql
ALTER TABLE board_elements REPLICA IDENTITY FULL;
```

**결과**: 성공 ✅

### 최종 해결 방법

#### 핵심 아이디어

PostgreSQL의 `REPLICA IDENTITY` 설정을 `FULL`로 변경하여 DELETE 이벤트에서 삭제된 행의 전체 데이터를 `payload.old`에 포함시킴.

#### 구현 코드

**1. 마이그레이션 파일 생성**

```sql
-- supabase/migrations/20241230000001_set_replica_identity_full.sql
-- Set REPLICA IDENTITY FULL for board_elements table
-- This ensures that DELETE events include the full old row data in payload.old
-- Required for Supabase Realtime to send complete deleted row information

ALTER TABLE board_elements REPLICA IDENTITY FULL;
```

**2. DELETE 이벤트 핸들러**

```typescript
// src/features/content/model/use-board-content.ts
const handleRealtimeDelete = useCallback((payload: { new: any; old: any }) => {
  const deletedRow = payload.old;
  const deletedId = deletedRow?.id;
  
  if (!deletedId) {
    console.error('[Realtime DELETE] id를 찾을 수 없습니다:', payload);
    return;
  }
  
  // 추적 정보도 제거
  recentlyUpdatedRef.current.delete(deletedId);
  draggingElementsRef.current.delete(deletedId);
  
  setElements((prev) => {
    const elementToDelete = prev.find((el) => el.id === deletedId);
    
    if (!elementToDelete) {
      // 이미 UI에 없으면 그대로 반환
      return prev;
    }
    
    // 요소 제거
    return prev.filter((el) => el.id !== deletedId);
  });
}, [currentUserId]);
```

**3. shouldIgnoreRealtimeEvent 로직**

```typescript
// DELETE 이벤트는 payload.old에 삭제된 행 데이터가 있음
if (event === 'DELETE') {
  const deletedRow = payload.old;
  
  if (!deletedRow || !deletedRow.id) {
    return false; // id가 없으면 처리
  }
  
  const deletedId = deletedRow.id;
  const deletedUserId = deletedRow.user_id;
  
  // 다른 사용자가 삭제한 경우는 항상 처리 (실시간 반영)
  if (deletedUserId !== currentUserId) {
    return false; // false = 무시하지 않음 = 처리함
  }
  
  // 자신이 삭제한 경우에만 recentlyUpdatedRef 확인
  const recentlyUpdated = recentlyUpdatedRef.current.get(deletedId);
  if (recentlyUpdated && Date.now() - recentlyUpdated < 1000) {
    // 자신이 최근에 삭제한 요소는 무시 (optimistic update와 중복 방지)
    return true;
  }
  
  return false;
}
```

### REPLICA IDENTITY 설명

PostgreSQL의 `REPLICA IDENTITY`는 logical replication에서 변경된 행을 식별하는 방법을 결정합니다:

- **DEFAULT**: PRIMARY KEY만 복제 (DELETE 이벤트에서 `payload.old`에 id만 포함될 수 있음)
- **FULL**: 전체 행 복제 (DELETE 이벤트에서 `payload.old`에 모든 컬럼 포함)
- **INDEX**: 특정 인덱스 사용
- **NOTHING**: 복제하지 않음

Supabase Realtime에서 DELETE 이벤트의 `payload.old`에 삭제된 행의 전체 데이터를 포함하려면 `REPLICA IDENTITY FULL`이 필요합니다.

### 확인 방법

마이그레이션 적용 후 확인:

```sql
SELECT 
  n.nspname as schemaname,
  c.relname as tablename, 
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'i' THEN 'INDEX'
    WHEN 'f' THEN 'FULL'
    ELSE 'UNKNOWN'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'board_elements';
```

결과: `replica_identity = 'FULL'`

### 교훈

1. **Supabase Realtime DELETE 이벤트는 REPLICA IDENTITY FULL 필요**
   - DELETE 이벤트에서 `payload.old`에 전체 행 데이터를 포함하려면 테이블에 `REPLICA IDENTITY FULL` 설정 필요
   - 기본값(DEFAULT)은 PRIMARY KEY만 복제하므로 DELETE 이벤트에서 전체 데이터를 받을 수 없음

2. **useEffect 의존성 배열 안정화**
   - 문자열 리터럴(`\`board:${boardId}:elements\``)은 매번 새로운 참조 생성
   - `useMemo`로 메모이제이션하여 안정적인 의존성 보장
   - 이전 값과 비교하여 실제 변경 시에만 실행하도록 최적화

3. **디버깅 전략**
   - 콘솔 로그로 이벤트 수신 여부 확인
   - `payload.old` 구조 확인 (REPLICA IDENTITY 설정 확인)
   - `useEffect` 실행 여부 확인 (의존성 배열 문제 확인)

4. **배열 mutate 문제는 없었음**
   - `setElements`에서 `prev.filter()` 사용으로 새로운 배열 생성
   - 직접 mutate 메서드(`push`, `pop`, `splice` 등) 사용하지 않음
   - React가 상태 변경을 정상적으로 감지함

### 관련 파일

- `supabase/migrations/20241230000001_set_replica_identity_full.sql` - REPLICA IDENTITY FULL 설정
- `src/shared/lib/use-realtime-subscription.ts` - Realtime 구독 훅
- `src/features/content/model/use-board-content.ts` - 보드 요소 관리 훅

### 참고 자료

- [PostgreSQL REPLICA IDENTITY 문서](https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-REPLICA-IDENTITY)
- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

---

## 4. Tailwind CSS v4 다크모드 적용 문제

### 문제 상황

**날짜**: 2025년 12월 26일  
**파일**: `app/globals.css`, `app/layout.tsx`, `src/app/providers/theme-provider.tsx`  
**증상**: 다크모드가 제대로 적용되지 않음. `dark` 클래스가 추가되지 않거나, 헤더만 변경되고 전체 페이지가 변경되지 않음. 스크롤 시 다크모드가 풀리는 현상 발생.

### 증상 상세

1. **dark 클래스가 추가되지 않음**
   - `ThemeToggle` 버튼을 클릭해도 `document.documentElement`에 `dark` 클래스가 추가되지 않음
   - Tailwind의 `dark:` 변형이 작동하지 않음

2. **부분적인 다크모드 적용**
   - 헤더만 다크모드로 변경되고 나머지 페이지는 라이트 모드 유지
   - 일부 위젯만 다크모드 스타일이 적용됨

3. **스크롤 시 다크모드 해제**
   - 페이지를 스크롤하면 다크모드가 자동으로 라이트 모드로 변경됨

4. **FOUC (Flash of Unstyled Content)**
   - 페이지 로드 시 잠깐 라이트 모드가 보이다가 다크모드로 변경되는 깜빡임 현상

### 원인 분석

#### 1단계: Tailwind CSS v4 설정 문제

**핵심 문제 1**: Tailwind CSS v4에서는 기존의 `tailwind.config.ts` 파일이 제거되었고, 다크모드를 활성화하려면 CSS 파일에서 직접 설정해야 함

```css
/* 문제가 있던 코드 - tailwind.config.ts 사용 시도 */
// tailwind.config.ts
export default {
  darkMode: 'class', // ❌ Tailwind v4에서는 작동하지 않음
  // ...
};
```

**핵심 문제 2**: `@custom-variant dark` 설정이 누락됨

#### 2단계: SSR 및 Hydration 문제

**핵심 문제 3**: Next.js App Router의 SSR 환경에서 클라이언트 사이드 JavaScript가 실행되기 전까지 `dark` 클래스가 적용되지 않음

- `ThemeProvider`의 `useEffect`는 클라이언트에서만 실행됨
- 서버에서 렌더링된 HTML에는 `dark` 클래스가 없음
- 클라이언트에서 JavaScript가 로드되어야 `dark` 클래스가 추가됨
- 이 과정에서 FOUC 발생

**핵심 문제 4**: 모든 컴포넌트에 다크모드 스타일이 적용되지 않음

- 일부 위젯과 페이지에 `useTheme` 훅이 적용되지 않음
- 하드코딩된 라이트 모드 스타일이 남아있음

### 시행착오 과정

#### 시도 1: tailwind.config.ts 생성

```typescript
// tailwind.config.ts 생성 시도
export default {
  darkMode: 'class',
  // ...
};
```

**결과**: Tailwind CSS v4에서는 `tailwind.config.ts`의 `darkMode` 설정이 작동하지 않음

#### 시도 2: CSS에 @custom-variant 추가

```css
/* app/globals.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

**결과**: 부분 성공 - `dark` 클래스는 인식되지만 여전히 FOUC 발생

#### 시도 3: layout.tsx에 inline script 추가

```typescript
// app/layout.tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          const theme = localStorage.getItem('collaboard-theme');
          if (theme) {
            const parsed = JSON.parse(theme);
            const savedTheme = parsed.state?.theme || 'system';
            let resolvedTheme = savedTheme;
            if (savedTheme === 'system') {
              resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(resolvedTheme);
          }
        })();
      `,
    }}
  />
</head>
```

**결과**: 성공 - FOUC 문제 해결, 하지만 여전히 일부 컴포넌트에 다크모드 미적용

#### 시도 4: 모든 컴포넌트에 useTheme 훅 적용

- `src/pages/landing/ui/landing-page.tsx`
- `src/pages/auth/ui/auth-page.tsx`
- `src/pages/dashboard/ui/dashboard-page.tsx`
- `src/pages/board/ui/board-page.tsx`
- 모든 위젯 컴포넌트들

**결과**: 성공 - 전체 페이지에 다크모드 적용 완료

### 최종 해결 방법

#### 1. Tailwind CSS v4 다크모드 설정

```css
/* app/globals.css */
@import "tailwindcss";

/* Tailwind CSS v4 다크모드 활성화 */
@custom-variant dark (&:where(.dark, .dark *));
```

#### 2. SSR 시 FOUC 방지 (inline script)

```typescript
// app/layout.tsx
<html lang="ko" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('collaboard-theme');
              if (theme) {
                const parsed = JSON.parse(theme);
                const savedTheme = parsed.state?.theme || 'system';
                let resolvedTheme = savedTheme;
                if (savedTheme === 'system') {
                  resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(resolvedTheme);
              } else {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(systemTheme);
              }
            } catch (e) {
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add('light');
            }
          })();
        `,
      }}
    />
  </head>
  <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    {/* ... */}
  </body>
</html>
```

#### 3. ThemeProvider 초기 마운트 시 강제 적용

```typescript
// src/app/providers/theme-provider.tsx
useEffect(() => {
  setMounted(true);
  
  // localStorage에서 직접 읽어서 즉시 적용
  try {
    const stored = localStorage.getItem('collaboard-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      const savedTheme = parsed.state?.theme || 'system';
      let resolved: 'light' | 'dark';
      
      if (savedTheme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = savedTheme;
      }
      
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      
      // 스토어 상태도 동기화
      const store = useThemeStore.getState();
      if (store.resolvedTheme !== resolved) {
        store.setTheme(savedTheme);
      }
    }
  } catch (e) {
    // 에러 발생 시 기본값 사용
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }
}, []);
```

#### 4. 모든 컴포넌트에 useTheme 훅 적용

```typescript
// 예시: src/pages/landing/ui/landing-page.tsx
import { useTheme } from '@shared/lib';

export const LandingPage = () => {
  const { classes } = useTheme();
  
  return (
    <div className={`min-h-screen ${classes.bg}`}>
      {/* ... */}
    </div>
  );
};
```

### 관련 파일

- `app/globals.css` - Tailwind CSS v4 다크모드 설정
- `app/layout.tsx` - SSR 시 FOUC 방지 inline script
- `src/app/providers/theme-provider.tsx` - 테마 프로바이더 및 초기 마운트 로직
- `src/shared/lib/use-theme-store.ts` - 테마 상태 관리 (Zustand)
- `src/shared/lib/use-theme.ts` - 테마 훅 및 공통 클래스 제공
- `src/shared/ui/components/theme-toggle.tsx` - 테마 토글 버튼
- 모든 페이지 및 위젯 컴포넌트 - `useTheme` 훅 적용

### 참고 자료

- [Tailwind CSS v4 다크모드 설정](https://www.sujalvanjare.com/blog/fix-dark-class-not-applying-tailwind-css-v4)
- [Next.js App Router SSR](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [FOUC (Flash of Unstyled Content) 방지](https://web.dev/articles/prevent-layout-shift)

---

## 5. 포맷팅된 텍스트 선택 불가 문제

### 문제 상황

**날짜**: 2025년 1월  
**파일**: `src/widgets/board-canvas/ui/components/text-element.tsx`, `src/widgets/board-canvas/ui/board-canvas.tsx`  
**증상**: 텍스트 요소에서 포맷팅된 텍스트(`<b>`, `<i>` 등)를 클릭해도 선택되지 않고, 편집 모드 진입이 불가능한 문제 발생.

### 증상 상세

- **증상**: 포맷팅이 적용된 텍스트(`<b>`, `<i>` 등)의 중간 부분을 클릭하면 선택되지 않음
- **예외**: 텍스트 끝부분을 클릭하면 정상 작동
- **조건**: 포맷팅이 없는 일반 텍스트는 정상 작동

### 원인 분석

**근본 원인**: 포맷팅 태그(`<b>`, `<i>` 등)가 클릭 이벤트를 가로채서 상위 div의 `onClick` 핸들러가 실행되지 않음

**이벤트 흐름**:
1. 사용자가 포맷팅된 텍스트(`<b>텍스트</b>`)를 클릭
2. 클릭 이벤트가 `<b>` 태그에서 발생
3. `e.target`이 `<b>` 태그가 되어 상위 div의 `onClick`이 실행되지 않음
4. `BoardCanvas`의 요소 wrapper `onClick`이 먼저 실행되어 `e.stopPropagation()` 호출
5. `TextElement`의 `onClick`이 실행되지 않음

**초기 시도**:
- `useFormattedTextInteraction` 훅을 사용하여 포맷팅된 텍스트 상호작용 처리 시도
- `data-formatted-text-*` 속성을 동적으로 추가하여 클릭 감지 시도
- 하지만 여전히 포맷팅 태그가 클릭을 가로채는 문제 발생

### 시행착오 과정

**시도 1**: `BoardCanvas`의 `onClick` 핸들러에서 `data-text-element-display` 체크 추가
```typescript
// board-canvas.tsx
onClick={(e) => {
  const target = e.target as HTMLElement;
  const textElementDisplay = target.closest('[data-text-element-display]');
  if (textElementDisplay) {
    return; // TextElement가 처리하도록 함
  }
  // ...
}}
```

**결과**: 부분 성공 - 하지만 포맷팅 태그에서 클릭 시 여전히 실패

**시도 2**: `TextElement`의 `onClick`에서 `e.stopPropagation()` 추가
```typescript
// text-element.tsx
onClick={(e) => {
  e.stopPropagation();
  onSelect?.(element.id);
}}
```

**결과**: 부분 성공 - 하지만 포맷팅 태그 내부 클릭은 여전히 실패

**시도 3**: Transparent overlay + pointer-events:none 구조 (최종 해결)
```typescript
// text-element.tsx
<div onClick={...} onDoubleClick={...}>
  <div style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={...} />
</div>
```

**결과**: 성공 ✅ - 포맷팅 태그가 클릭을 가로채지 않음

### 최종 해결 방법

#### 핵심 아이디어: Transparent Overlay + pointer-events:none

포맷팅된 텍스트의 클릭 이벤트 문제를 해결하기 위해 **transparent overlay 패턴**을 사용:

1. **외부 div**: 클릭/더블클릭 이벤트 처리 (`onClick`, `onDoubleClick`)
2. **내부 div**: `pointer-events: none` 적용하여 포맷팅 태그가 클릭을 가로채지 않도록 함

#### 구현 코드

```typescript
// src/widgets/board-canvas/ui/components/text-element.tsx

// 비편집 모드 렌더링
{!isEditing && (
  <div
    ref={displayContentRef}
    data-text-element-display
    className="cursor-move"
    style={{
      fontSize: `${displayFontSize}px`,
      fontWeight,
      fontStyle,
      textDecoration,
      color,
      backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
      lineHeight: 1.2,
      ...(isSelected && {
        outline: `2px solid ${isDark ? '#9DFF4C' : '#FF2E2E'}`,
        outlineOffset: '4px',
      }),
    }}
    onClick={(e) => {
      // 포맷팅된 텍스트 내부 요소가 클릭을 가로채지 않도록
      // 외부 div에서 onClick 처리
      e.stopPropagation();
      onSelect?.(element.id);
    }}
    onDoubleClick={(e) => {
      e.stopPropagation();
      onSelect?.(element.id);
      onDoubleClick?.(e);
    }}
  >
    {/* pointer-events: none을 적용하여 내부 포맷팅 태그가 클릭을 가로채지 않도록 함 */}
    <div
      style={{ pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: element.content || '더블클릭하여 편집' }}
    />
  </div>
)}
```


### 교훈

1. **포맷팅된 HTML과 이벤트 처리**
   - `dangerouslySetInnerHTML`로 렌더링된 포맷팅 태그는 클릭 이벤트를 가로챌 수 있음
   - `pointer-events: none`을 사용하여 내부 요소의 클릭을 차단하고, 외부 컨테이너에서 이벤트 처리
   - Transparent overlay 패턴은 복잡한 HTML 구조에서 이벤트 처리를 단순화하는 효과적인 방법

2. **이벤트 버블링과 stopPropagation**
   - 상위 요소의 이벤트 핸들러가 먼저 실행되면 하위 요소의 이벤트가 차단될 수 있음
   - `stopPropagation()`을 적절히 사용하여 이벤트 전파를 제어해야 함
   - 하지만 포맷팅 태그 내부 클릭은 `stopPropagation()`만으로는 해결되지 않음

3. **디버깅 전략**
   - 이벤트 흐름을 추적하기 위해 `e.target`과 `e.currentTarget`을 확인
   - `closest()` 메서드를 사용하여 상위 요소까지 이벤트 타겟 확인
   - 여러 시도 후 근본 원인을 찾아 해결하는 접근이 중요

### 관련 파일

- `src/widgets/board-canvas/ui/components/text-element.tsx` - 텍스트 요소 컴포넌트
- `src/widgets/board-canvas/ui/board-canvas.tsx` - 보드 캔버스 (요소 렌더링 및 이벤트 처리)

### 참고 자료

- [MDN pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events)
- [MDN Event bubbling and capturing](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture)

---

## 6. 협업 위젯 초기 위치 설정 문제

### 문제 상황

**날짜**: 2025년 1월  
**파일**: `src/widgets/collaboration-widget/ui/collaboration-widget.tsx`, `src/widgets/board-toolbar/ui/board-toolbar.tsx`  
**증상**: 협업 위젯이 보드 툴바 위에 초기 위치로 나타나거나, 대시보드에서 보드로 이동할 때 잘못된 위치에 표시됨. 마우스 다운 시에만 올바른 위치로 이동함.

### 증상 상세

1. **보드 페이지 새로고침 시**
   - 협업 위젯이 보드 툴바 위에 나타남
   - 콘솔 로그에는 "위치가 올바름"이라고 표시되지만 실제로는 잘못된 위치
   - 마우스를 움직이지 않고 마우스 다운만 하면 올바른 위치로 이동

2. **대시보드에서 보드로 이동 시**
   - 협업 위젯이 보드 툴바 위에 나타남
   - `initialY`가 57로 계산되었다가 70으로 업데이트됨
   - 하지만 `useDraggable`은 이미 57로 초기화되어 있어 위치가 맞지 않음

3. **위치 조정 로직 실행 안 됨**
   - `useEffect`가 실행되지만 실제 DOM 위치가 올바르지 않음
   - `position` state와 실제 DOM `transform` 값이 불일치

### 원인 분석

#### 1단계: CSS 변수 타이밍 문제

**핵심 문제 1**: `--board-toolbar-height` CSS 변수가 보드 툴바가 마운트된 후에 설정됨
- 보드 툴바는 `ResizeObserver`를 사용하여 높이를 측정하고 CSS 변수에 저장
- 협업 위젯은 페이지 로드 시점에 CSS 변수를 읽으려고 시도
- CSS 변수가 아직 설정되지 않아 기본값(57px)을 사용

#### 2단계: useDraggable 초기화 타이밍 문제

**핵심 문제 2**: `useDraggable`이 `initialY`가 업데이트되기 전에 초기화됨
- `useDraggable`은 컴포넌트 마운트 시 `initialPosition`을 사용하여 초기화
- `initialY`는 `useState`의 초기값(57)으로 시작
- CSS 변수가 업데이트되어 `initialY`가 70으로 변경되어도 `useDraggable`은 이미 초기화됨

#### 3단계: localStorage 위치와 실제 위치 불일치

**핵심 문제 3**: localStorage에 저장된 위치가 보드 툴바 위에 있을 수 있음
- 이전에 보드 툴바 높이가 다르거나 없었을 때 저장된 위치
- `useDraggable`이 localStorage에서 위치를 불러오면 보드 툴바 위에 위치할 수 있음

#### 4단계: DOM transform과 React state 불일치

**핵심 문제 4**: `useDraggable`이 DOM의 `transform`을 직접 조작하지만 React state는 별도로 관리됨
- `useDraggable`은 `transform`을 사용하여 위치를 업데이트
- React state(`position`)는 별도로 관리되어 실제 DOM과 불일치할 수 있음
- `useEffect`에서 `position` state를 확인하지만 실제 DOM 위치는 다를 수 있음

### 시행착오 과정

#### 시도 1: initialY를 useMemo로 계산

```typescript
const initialY = useMemo(() => {
  if (typeof window !== 'undefined') {
    return parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
    ) || 57;
  }
  return 57;
}, []);
```

**결과**: 실패 - CSS 변수가 업데이트되어도 `useMemo`가 재계산되지 않음

#### 시도 2: useEffect로 initialY 업데이트

```typescript
const [initialY, setInitialY] = useState(57);

useEffect(() => {
  const updateInitialY = () => {
    const toolbarHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
    ) || 57;
    setInitialY(toolbarHeight);
  };
  
  updateInitialY();
  const intervalId = setInterval(updateInitialY, 100);
  
  return () => clearInterval(intervalId);
}, []);
```

**결과**: 부분 성공 - `initialY`는 업데이트되지만 `useDraggable`은 이미 초기화됨

#### 시도 3: useDraggable의 initialPosition을 동적으로 업데이트

```typescript
const { position, setPosition } = useDraggable({
  initialPosition: { x: 16, y: initialY },
  // ...
});

useEffect(() => {
  if (initialY > 50) {
    setPosition({ x: position.x, y: initialY });
  }
}, [initialY]);
```

**결과**: 실패 - 무한 루프 발생 (`position`이 dependency에 포함되어 계속 업데이트)

#### 시도 4: 실제 DOM transform 값 확인 및 조정 (최종 해결)

```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && isMounted && initialY > 50) {
    const timeoutId = setTimeout(() => {
      const element = dragHandlers.ref.current;
      let actualY = 0;
      
      if (element) {
        const transform = element.style.transform;
        if (transform) {
          const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
          if (match) {
            actualY = parseFloat(match[2]) || 0;
          }
        }
      }
      
      // 실제 DOM 위치가 보드 툴바 위에 있으면 보드 툴바 아래로 이동
      if (actualY < initialY) {
        const newPosition = { x: actualX || 16, y: initialY };
        setPositionRef.current(newPosition);
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }
}, [isMounted, initialY]);
```

**결과**: 성공 ✅

### 최종 해결 방법

#### 핵심 아이디어

1. **CSS 변수 변경 감지**: `MutationObserver`와 `setInterval`을 사용하여 `--board-toolbar-height` 변경 감지
2. **initialY를 state로 관리**: `useState`로 관리하여 변경 시 재렌더링 유도
3. **실제 DOM 위치 확인**: React state 대신 실제 DOM의 `transform` 값을 확인
4. **setPosition ref 사용**: `useRef`로 `setPosition` 참조를 유지하여 무한 루프 방지

#### 구현 코드

**1. initialY를 state로 관리 및 CSS 변수 변경 감지**

```typescript
// 보드 툴바 높이를 상태로 관리 (CSS 변수 변경 감지)
const [initialY, setInitialY] = useState(() => {
  if (typeof window !== 'undefined') {
    const toolbarHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
    ) || 57;
    return toolbarHeight;
  }
  return 0;
});

// CSS 변수 변경 감지 및 initialY 업데이트
useEffect(() => {
  if (typeof window === 'undefined') return;

  const updateInitialY = () => {
    const toolbarHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--board-toolbar-height')
    ) || 57;
    
    setInitialY((prev) => {
      if (prev !== toolbarHeight) {
        return toolbarHeight;
      }
      return prev;
    });
  };

  // 초기 업데이트
  updateInitialY();

  // MutationObserver로 CSS 변수 변경 감지
  const observer = new MutationObserver(() => {
    updateInitialY();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
  });

  // 주기적으로 체크 (fallback)
  const intervalId = setInterval(updateInitialY, 500);

  return () => {
    observer.disconnect();
    clearInterval(intervalId);
  };
}, []);
```

**2. setPosition ref 사용**

```typescript
const setPositionRef = useRef(setPosition);

// setPosition ref를 항상 최신으로 유지
useEffect(() => {
  setPositionRef.current = setPosition;
}, [setPosition]);
```

**3. 실제 DOM 위치 확인 및 조정**

```typescript
// initialY가 변경될 때마다 위치를 올바르게 설정
useEffect(() => {
  if (typeof window !== 'undefined' && isMounted && initialY > 50) {
    const timeoutId = setTimeout(() => {
      // 실제 DOM의 transform 값을 확인
      const element = dragHandlers.ref.current;
      let actualY = 0;
      let actualX = 16;
      
      if (element) {
        const transform = element.style.transform;
        if (transform) {
          // transform: translate(16px, 71px) 형식에서 X, Y 값 추출
          const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
          if (match) {
            actualX = parseFloat(match[1]) || 16;
            actualY = parseFloat(match[2]) || 0;
          }
        }
      }
      
      // 실제 DOM 위치가 보드 툴바 위에 있으면 보드 툴바 아래로 이동
      if (actualY < initialY) {
        const newPosition = { x: actualX || 16, y: initialY };
        setPositionRef.current(newPosition);
      }
    }, 200); // useDraggable의 useEffect와 보드 툴바 마운트를 고려한 지연

    return () => clearTimeout(timeoutId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isMounted, initialY]); // position을 dependency에서 제거하여 무한 루프 방지
```

**4. onMouseDown에서도 위치 확인**

```typescript
onMouseDown={(e) => {
  // ... 드래그 시작 로직 ...
  
  // 현재 위치가 보드 툴바 위에 있으면 조정
  const element = dragHandlers.ref.current;
  if (element) {
    const transform = element.style.transform;
    if (transform) {
      const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (match) {
        const actualY = parseFloat(match[2]) || 0;
        if (actualY < initialY) {
          setPositionRef.current({ x: parseFloat(match[1]) || 16, y: initialY });
        }
      }
    }
  }
}}
```

### MutationObserver와 setInterval 설명

**MutationObserver**: DOM 속성 변경을 감지하는 Web API
- `document.documentElement`의 `style` 속성 변경 감지
- CSS 변수(`--board-toolbar-height`)가 변경되면 `style` 속성이 업데이트됨
- 하지만 CSS 변수 변경만으로는 `style` 속성이 변경되지 않을 수 있음

**setInterval (Fallback)**: 주기적으로 CSS 변수 값 확인
- `MutationObserver`가 감지하지 못하는 경우를 대비
- 500ms마다 CSS 변수 값을 확인하여 변경 사항 감지

### 교훈

1. **CSS 변수와 React state 동기화**
   - CSS 변수는 React의 반응성 시스템 밖에 있음
   - `MutationObserver`와 `setInterval`을 사용하여 변경 감지 필요
   - 변경 감지 후 React state로 동기화

2. **초기화 타이밍 문제**
   - 여러 컴포넌트가 서로 의존하는 경우 초기화 순서가 중요
   - `useEffect`와 `setTimeout`을 사용하여 초기화 순서 제어
   - `isMounted` 플래그로 클라이언트 사이드에서만 실행 보장

3. **DOM 직접 조작과 React state 분리**
   - `useDraggable`이 DOM의 `transform`을 직접 조작
   - React state(`position`)와 실제 DOM 위치가 불일치할 수 있음
   - 실제 DOM 위치를 확인하여 조정하는 로직 필요

4. **무한 루프 방지**
   - `position` state를 dependency에 포함하면 무한 루프 발생
   - `useRef`로 함수 참조를 유지하여 dependency에서 제외
   - 실제 DOM 값을 확인하여 필요한 경우에만 업데이트

5. **디버깅 전략**
   - 실제 DOM의 `transform` 값을 확인
   - React state와 실제 DOM 위치 비교
   - `console.log`로 초기화 순서 추적 (개발 환경에서만)

### 관련 파일

- `src/widgets/collaboration-widget/ui/collaboration-widget.tsx` - 협업 위젯 컴포넌트
- `src/widgets/board-toolbar/ui/board-toolbar.tsx` - 보드 툴바 (CSS 변수 설정)
- `src/shared/lib/use-draggable.ts` - 드래그 가능한 요소 훅

### 참고 자료

- [MDN MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [React useRef 문서](https://react.dev/reference/react/useRef)

---

**마지막 업데이트**: 2025년 1월

