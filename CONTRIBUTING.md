# 기여

```bash
npm test                 # Vitest 테스트
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit 타입 검사
npm run build            # 타입 검사 후 프로덕션 빌드
npm run contract:check   # 생성한 타입이 계약 스키마와 맞는지 확인
```

저장소 역할과 코드 지도는 `ARCHITECTURE.md`에 있습니다.

## 계약

`contract/`는 [sion-api](https://github.com/tolelom/sion-api) `contract/`의 복사본이고, `src/types/contract.gen.ts`는 복사한 `contract/sion.schema.json`에서 [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript)로 만든 파일입니다.

- `src/contract.test.tsx`가 서버 메시지 픽스처를 실제 메시지 라우터와 리듀서에 넣어 화면 상태를 픽스처와 비교하고, 대시보드가 보내는 명령과 경로 탐색 요청을 스키마로 검사합니다(ajv).
- `npm run contract:check`는 `contract.gen.ts`가 복사한 스키마와 어긋나면 실패합니다. CI에서 돕니다.
- 복사본이 sion-api보다 오래됐는지는 CI가 보지 않습니다(테스트에 네트워크를 쓰지 않습니다).

sion-api의 계약이 바뀌면 이 순서로 갱신합니다.

```bash
npm run contract:sync     # ../sion-api/contract가 있으면 거기서, 없으면 GitHub main에서 복사
npm run contract:types    # src/types/contract.gen.ts 다시 생성
npm test
```

`contract:sync`는 `-- --from <경로>`로 다른 체크아웃을, `-- --remote [ref]`로 GitHub의 특정 브랜치·태그를 고를 수 있습니다.

## 배포

GitHub Actions(`.github/workflows/frontend-ci-cd.yml`)가 PR과 push마다 Node 22로 lint, `contract:check`, 테스트, 빌드를 돌립니다. `main`·`master`에 push하면 arm64 이미지 `ghcr.io/tolelom/sion:latest`, `ghcr.io/tolelom/sion:main`을 올립니다. 이미지는 `dist/`를 nginx로 80 포트에서 내보냅니다.

- 프로덕션 빌드는 `.env.production`의 `https://sion-api.tolelom.xyz`를 가리킵니다.
- `VITE_WS_URL`이나 `VITE_API_BASE_URL`이 없으면 빌드가 실패합니다.

`.github/workflows/vuln.yml`은 `main` push, PR, 매주 월요일에 `npm audit --omit=dev --audit-level=high`를 돌립니다.
