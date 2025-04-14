# Exchange Watch - 실시간 환율 추적

**Exchange Watch**는 전 세계 환율 정보를 실시간으로 수집하고,
사용자의 관심 통화쌍을 실시간으로 모니터링하며, 일간 이력 집계 및 알림까지 제공하는 백엔드 서버입니다.

## 💡 주요 기능 (Features)
- 전 세계 주요 통화의 실시간 환율 수집 및 실시간 스트리밍 제공 (WebSocket + SSE)
- 관심 통화쌍 등록 및 실시간 모니터링
- 외부 API 호출을 최소화하기 위한 Redis 기반 캐싱 및 역산 최적화
- 일간 환율 데이터를 OHLC 형태로 자동 집계하여 이력 저장
- 목표 가격 도달 시 알림 전송 기능 **(FCM 연동 진행중)**
- 환율 이력 데이터 조회 및 차트 시각화 지원
- 단위/통합 테스트를 갖춘 안정적인 서비스 기반
---

## ⚙️ 기술 스택 및 사용처
| 범주      | 기술                   | 사용처                                                                               |
| --------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Language  | TypeScript             | 정적 타입 기반으로 안정성과 가독성 확보                                              |
| Framework | NestJS                 | 모듈 기반 구조, DI기반 설계, 이벤트 기반 아키텍쳐 적용                               |
| Realtime  | Websocket              | 외부 API로부터 (Websocket)실시간 환율 데이터 수집                                    |
| DB        | PostgreSQL             | 정규화된 이력 데이터 저장 및 관심 통화 리스트, 유저 정보 및 디바이스 토큰 관리, 알림 |
| ORM       | Prisma                 | type-safe한 DB접근 및 마이그레이션 자동화 및 테스트 환경 분리                        |
| Cache     | Redis                  | 수집된 실시간 환율 캐싱 및 외부 API 호출 최소화                                      |
| Messaging | Redis Pub/Sub          | 클라이언트 관리 및 Redis Pub/Sub을 통한 변동된 통화쌍만 실시간 부분 전송             |
| Infra     | Docker, Docker Compose | 로컬, 테스트, 배포 환경 일관성 확보                                                  |
| Test      | Jest, Supertest        | 단위/통합 테스트 및 외부 의존성 테스트                                               |
---

## 🧱 시스템 아키텍처

---

## 실시간 환율 수집
<img width="906" alt="실시간 환율 수집 구조 다이어그램" src="https://github.com/user-attachments/assets/2bb26f22-3f7e-47b8-a38d-f147327492ec" />

1. CoinAPI WebSocket을 통해 기준 통화 환율 데이터 수신
2. 수신 즉시 `ExchangeRateReceivedEvent` 이벤트 발생
3. Redis에 저장 전, 직전 환율과 비교하여 변동 여부 확인
4. 변동이 있는 경우에만 Redis에 저장 + Redis Pub/Sub 채널에 publish
5. 클라이언트는 REST 또는 SSE를 통해 Redis에서 최신 환율 수신

### 설계 의도
- WebSocket → Redis → SSE 구조로 실시간성과 확장성을 동시에 가져감
- 수집과 응답을 분리하여 API 호출 시 외부 통신 없이 캐시에서 응답
- 이벤트 중심 흐름으로 테스트하기 쉬운 구조
- 외부 API를 서버 1회 연결로만 수신, 모든 클라이언트는 Redis만 조회함 (최종 목표)
<!-- - 데이터 변경이 있을 때만(직전 수집된 데이터와 변동성 비교) Redis Pub/Sub으로 이벤트 전파하여 불필요한 SSE 트래픽 방지 -->
- **이전 값과의 비교를 통해 변동이 있을 때만** Pub/Sub 발생 → 불필요한 스트리밍 방지
---

## 일일 환율 집계
<img width="863" alt="일일환율집계다이어그램" src="https://github.com/user-attachments/assets/02b82956-b4fd-4054-9adc-b1d92dabd829" />

### > 하루에 한 번, 외부 API를 호출해 전일 수집된 환율들을 정제된 OHLC 데이터로 집계하고 DB에 저장합니다.

1. 매일 00:05 (UTC)에 Cron 스케줄러가 집계 프로세스 실행
2. 기준 통화 기준으로 Fluctuation API를 호출해 전일 변동 데이터 수집
3. 수집한 데이터 → OHLC(Open, High, Low, Close) 형식으로 가공
4. `exchange_rates_daily` 테이블에 저장

### 설계 의도
- 차트용 데이터는 실시간 수집이 아닌, **일관된** 집계 기준으로 관리
- Fluctuation API는 하루 1회만 호출 → 외부 API요청 최소화
- 실시간 구조와 분리되어 있어 문제 발생 시 다른 기능에 영향 없음
---


## SSE 요청 구조
<img width="896" alt="SSE흐름 다이어그램" src="https://github.com/user-attachments/assets/9fca7b2f-d201-49d4-8fd2-72b8b5677867" />

### > 클라이언트는 기준 통화를 지정하여 SSE(Server-Sent Events)로 실시간 환율을 구독
### > 서버는 Redis Pub/Sub 채널을 통해 환율 변동이 감지된 경우에만 클라이언트에 실시간 푸시합니다.

1.	클라이언트가 기준 통화를 지정하여 SSE 구독 요청
2.	서버는 Redis Pub/Sub 채널을 구독 (latest-rate-pub:KRW)
3.	외부 WebSocket으로 수신된 환율이 변동된 경우에만 Redis에 저장 + Pub 채널에 publish
4.	SSE 스트림을 통해 해당 클라이언트에게만 실시간 데이터 전송

### 설계 의도
WebSocket 없이 브라우저 친화적인 실시간 구조 구현
변동이 발생한 경우에만 이벤트 전파 → 트래픽 최소화
Redis Pub/Sub을 통해 서버 인스턴스 간 확장에도 대응 가능
기준 통화별 채널 분리로 관심 데이터만 효율적으로 전송
---

## 환율 히스토리 조회
<img width="802" alt="환율히스토리다이어그램" src="https://github.com/user-attachments/assets/91f5e8dc-be59-44f0-b505-32a96f64617f" />

1.	클라이언트가 GET /exchange-rates/history API를 호출 (기준 통화, 대상 통화, 날짜 범위)
2.	서버는 exchange_rates_daily 테이블에서 해당 날짜 범위의 OHLC 데이터를 조회
3.	조회 결과에 날짜 누락이 있을 경우 → 누락된 날짜만 외부 fluctuation API 호출
4.	누락된 날짜 데이터를 가공하여 DB에 저장한 뒤, 다시 전체 데이터를 재조회하여 응답

### 설계 의도
누락된 날짜만 외부 API 호출 → 불필요한 외부 요청 최소화
이력 데이터의 정합성을 보장하면서도 실시간성과 독립된 흐름으로 분리
이미 저장된 OHLC 데이터는 그대로 재사용 → 응답 속도 확보
---


## 기술적 도전과 해결
### 1. 930개 통화쌍 캐싱 문제 -> 역산 최적화 구조로 해결
- 초기에는 모든 통화쌍(31 * 30 = 930)을 Redis에 저장하려고 했지만
- 메모리 사용량과 Pub/Sub 트래픽이 비효율적이라는 문제가 있었고,
- 기준 통화(KRW)를 기준으로 30개만 저장하고, 나머지는 요청 시 저장된 데이터를 이용하여 역산 처리하도록 구조를 변경
- redis Hash 자료구조를 이용하여 변동률이 존재하지 최신 환율을 
- 최신 환율 수집 시, 변동률이 (굉장히)미미하다면 timestamp만 업데이트 해주기 위해 `redis hash`자료구조를 채택해 잦은 부분 업데이트에 대한 성능을 커버하였습니다
→ 메모리 사용량 대폭 절감, 응답 속도 동일 유지

### 1-2. 역산 최적화 예시
- 들어가기 전에, 우리 서버는 KRW/30개의 통화쌍 = 총 30개의 단일통화쌍을 가지고 있습니다 (N초마다 수집 및 업데이트).
- 만약 사용자가 USD/EUR의 통화쌍을 요청한다면?
#### 최신 환율 역산 예시
```shell
# Redis에 저장된 값 (우리는 항상 들고있습니다)
KRW → USD = 0.000699
KRW → EUR = 0.000616

# 요청: USD/EUR
rate = 0.000616 / 0.000699 ≈ 0.8813
```
#### 변동률 역산 예시
```shell
# 변동률 역산
KRW → EUR 변동률: +1.20%
KRW → USD 변동률: +0.85%

USD → EUR 변동률 ≈ 1.20% - 0.85% = 0.35%
```

### 2. 외부 API 유연성 문제 -> 도메인 인터페이스 기반 구조로 해결
- 다양한 환율 API를 기능별로 유연하게 사용해야 했고,
- API마다 응답 포맷과 기능 범위가 달라, 직접 서비스에 연결하면 결합도가 높아지는 문제가 있었음
- 이를 해결하기 위해 서비스에서 필요한 동작(예: getCurrentRate, getFluctuationData 등)을 명시한 공통 인터페이스(`IExchangeRateExternalAPI`)를 정의
- 모든 외부 API는 해당 인터페이스를 따르게 구현하고, ExternalApiModule에서 갈아끼우는 식으로(DI) 원하는 API를 주입해서 사용하도록 설계
→ 기능 확장, 테스트용 Mock 주입, API 교체 등 모든 상황에서 유연하게 대응 가능

### 3. 이벤트 기반 처리 구조 도입
- 실시간 환율 수신(WebSocket)과 비즈니스 로직(알림 비교, 저장)이 서로를 참조하면서,
  ExternalWebSocketGateway ↔ ExchangeRateService 간 순환 의존성 발생
- 단순히 forwardRef()로 해결할 수도 있었지만, 이는 구조적 해결이 아님
- 대신 WebSocket 게이트웨이는 단순히 데이터를 수신하고,
  내부적으로 `ExchangeRateReceivedEvent`를 발행하도록 설계 변경
- ExchangeRateService는 이 이벤트를 구독하여, Redis 저장 및 알림 로직을 처리

→ 결과적으로
- WebSocket 모듈과 비즈니스 로직 모듈 간 결합 제거
- 외부 데이터 수신 → 내부 로직 처리 흐름이 단방향이 됨
- 테스트, 유지보수, 확장성이 모두 개선됨

### 4. 테스트 환경 분리 및 통합 테스트 구성
- 서비스 로직은 mock 기반 단위 테스트로 충분히 커버되지만,
  Controller, Repository 단은 테스트 인프라와 함께 검증할 필요가 있었습니다
- 그러나 테스트 중 PostgreSQL/Redis 의존성 충돌, 데이터 오염 문제 발생
- 이를 해결하기 위해 테스트 환경을 완전히 격리시켜 구성:
- 단위 테스트는 Jest로 서비스 레이어만 mock하여 빠르게 핵심 비즈니스 로직만 실행
- docker-compose를 이용하여 실제 프로덕션 환경과 동일한 PostgreSQL/Redis 환경에서 실행
- 통합 테스트 실행 전 Prisma `migrate reset`으로 매 테스트마다 DB 스키마 초기화
- NestJS 모듈을 테스트 전용으로 분리 구성 (`test-prisma.module.ts`, `test-redis.module.ts`, `test-cls.module.ts`, `test-config.module.ts`)

→ 결과적으로
- 빠르고 안정적인 테스트 환경을 구축
- 구조 리팩토링/변경에도 자신 있게 대응할 수 있는 기반을 마련

## 디렉토리 구조
```shell
src/
├── common/                        # 전역 유틸, 데코레이터, 필터, 인터셉터, 공통 DTO 등
│   ├── decorators/               # Swagger, Validation, custom-decroator 분리
│   ├── dto/                      # 공통 DTO, 인터페이스, 페이지네이션
│   ├── filter/                   # 전역 예외 필터
│   ├── interceptor/              # 응답 인터셉터
│   └── utils/                    # 날짜 계산, 테이블 생성 유틸 등
├── infrastructure/               # 인프라 계층: 환경변수, 외부 API, 이벤트, Redis 둥
│   ├── config/                   # 환경변수 (env variables)
│   ├── database/                # Prisma DB 모듈
│   ├── events/                  # 서비스 전역에서 사용되는 이벤트들
│   ├── externals/               # 외부 환율 API (CoinAPI, Fixer 등)
│   └── redis/                   # Redis 모듈 및 Pub/Sub 구성
├── modules/
│   ├── exchange-rate/           # 환율 수집, 저장, 집계, 이력 조회 도메인
│   │   ├── services/            # 실시간 처리, Redis 저장, 집계 등
│   │   ├── controllers/         # REST/SSE 엔드포인트
│   │   ├── repositories/        # DB 저장소 (Prisma)
│   │   ├── schedulers/          # 일간 OHLC 집계 Cron
│   │   └── listeners/           # 이벤트 기반 환율 처리
│   ├── notifications/           # 알림 등록/조회/삭제, 트리거 서비스
│   ├── notification-histories/  # 알림 발송 이력 저장
│   ├── fcm/                     # FCM 푸시 알림 전송 모듈
│   ├── sse/                     # SSE 전용 컨트롤러 + 서비스
│   ├── watchlist/              # 관심 통화쌍 관리
│   ├── users/                  # 사용자 정보 및 디바이스 관리
│   └── auth/                   # 인증/인가 (JWT, Google OAuth 등)
├── test/                        # 전역 테스트 환경 구성
│   ├── unit/                   # Jest 단위 테스트
│   ├── integration/            # Docker 기반 통합 테스트
│   └── utils/                  # 테스트 전용 모듈 생성 유틸
```

