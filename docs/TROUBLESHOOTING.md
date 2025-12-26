# 트러블슈팅 가이드

이 문서는 프로젝트 개발 중 발생한 주요 문제와 해결 과정을 기록합니다.

## 목차

1. [드래그 기능 이벤트 리스너 참조 불일치 문제](#1-드래그-기능-이벤트-리스너-참조-불일치-문제)
2. [보드 캔버스와 드래그 위젯 이벤트 충돌 문제](#2-보드-캔버스와-드래그-위젯-이벤트-충돌-문제)
3. [Supabase Realtime DELETE 이벤트가 다른 사용자에게 반영되지 않는 문제](#3-supabase-realtime-delete-이벤트가-다른-사용자에게-반영되지-않는-문제)

---

## 1. 드래그 기능 이벤트 리스너 참조 불일치 문제

### 문제 상황

**날짜**: 2024년 12월  
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

**날짜**: 2024년 12월  
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

**마지막 업데이트**: 2025년 12월 26일

