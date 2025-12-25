# MCP 서버 설정 가이드

## 설정 완료 상태

✅ `.cursor/mcp.json` 파일이 생성되었습니다.

## 현재 설정

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

## 연결 확인 방법

### 1. Cursor 재시작 확인
- Cursor를 완전히 종료하고 다시 실행했는지 확인하세요.

### 2. MCP 연결 상태 확인
다음 방법으로 확인할 수 있습니다:

**방법 A: 명령 팔레트**
1. `Ctrl+Shift+P` (또는 `Cmd+Shift+P`)
2. "MCP" 검색
3. MCP 관련 명령어 확인

**방법 B: 설정 검색**
1. `Ctrl+,` (설정 열기)
2. 검색창에 "MCP" 입력
3. MCP 서버 설정 확인

**방법 C: 상태 표시줄**
- Cursor 하단 상태바에서 MCP 연결 상태 확인

### 3. 인증 진행
Supabase MCP 서버는 첫 연결 시 자동 인증을 사용합니다:

1. **자동 인증**: Cursor가 브라우저를 열어 Supabase 로그인을 요청할 수 있습니다.
2. **수동 인증**: 필요시 Cursor 설정에서 "Connect" 또는 "Authenticate" 버튼 클릭
3. **권한 승인**: 브라우저에서 Supabase 조직 접근 권한을 승인하세요.

### 4. 연결 테스트
연결이 완료되면 AI에게 다음을 요청해보세요:
- "Supabase 테이블 목록 보여줘"
- "boards 테이블 구조 확인해줘"
- "Supabase 프로젝트 정보 확인해줘"

## 문제 해결

### 연결이 안 될 때

1. **설정 파일 확인**
   ```bash
   # 파일이 올바른 위치에 있는지 확인
   cat .cursor/mcp.json
   ```

2. **JSON 형식 확인**
   - JSON 형식이 올바른지 확인
   - 따옴표, 쉼표 등 문법 오류 확인

3. **프로젝트 ID 확인**
   - `project_ref=YOUR_PROJECT_REF`가 올바른지 확인
   - Supabase 대시보드에서 프로젝트 설정 확인

4. **Cursor 로그 확인**
   - Cursor의 개발자 도구나 로그에서 오류 메시지 확인
   - `Help` > `Toggle Developer Tools`에서 콘솔 확인

5. **네트워크 확인**
   - 인터넷 연결 확인
   - 방화벽이나 프록시 설정 확인

## 보안 권장사항

⚠️ **중요**: Supabase MCP 서버는 개발/테스트 목적으로만 사용하세요.

- ❌ 프로덕션 데이터에 연결하지 마세요
- ✅ 개발 프로젝트에만 사용하세요
- ✅ 각 작업을 수동으로 승인하세요
- ✅ 프로젝트 스코핑을 사용하세요 (현재 설정됨)

## 참고 자료

- [Supabase MCP 공식 문서](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

