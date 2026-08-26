# Kanadō — học tiếng Nhật từ bảng chữ tới JLPT N4

Ứng dụng học tiếng Nhật cá nhân: bảng chữ, kanji, từ vựng, ngữ pháp N5–N4, flashcard lặp lại
ngắt quãng và đề kiểm tra chấm điểm. Tiến độ đồng bộ giữa các thiết bị qua tài khoản.

| Mảng | Công nghệ |
|---|---|
| Web | Next.js 15 (App Router) + React 19 + TypeScript |
| API | NestJS 10 + Prisma 5 + JWT |
| Database | PostgreSQL 16 |
| Nội dung học | package dùng chung `@kanado/content` |

## Cấu trúc

```
Kanado-Japanese-Learner/
├─ apps/
│  ├─ web/               Next.js — giao diện học
│  └─ api/               NestJS — auth, đồng bộ tiến độ, phục vụ nội dung
├─ packages/
│  └─ content/           Toàn bộ dữ liệu học, dùng chung cho web và api
├─ prototype/kana-do.html  Bản HTML một trang ban đầu (nguồn của dữ liệu)
├─ tools/extract-content.js  Sinh lại packages/content/src/raw.ts từ prototype
└─ docker-compose.yml    Postgres cho môi trường phát triển
```

### Vì sao nội dung nằm ở package chứ không gọi API

Dữ liệu học là tĩnh và không lớn (249 kanji, 241 từ, 68 mẫu ngữ pháp). Để trong package thì web
render tức thì, không chờ mạng, và học được cả khi API chết. API vẫn có đầy đủ endpoint
`/api/content/*` đọc từ cùng nguồn — dành cho client khác về sau (app điện thoại chẳng hạn) và
để bạn tra cứu, thống kê, soạn thêm nội dung bằng DBeaver.

API chỉ thật sự cần cho hai việc: **tài khoản** và **đồng bộ tiến độ**.

## Chạy lần đầu

Cần Node 20+ và Docker Desktop.

```bash
npm run setup
```

Lệnh này cài dependencies, build package nội dung, và sinh Prisma Client.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up
npm run db:migrate
npm run db:seed
```

Mở hai terminal:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Web ở http://localhost:3000, API ở http://localhost:4000/api.

## Kết nối DBeaver

Sau `npm run db:up`, tạo connection PostgreSQL trong DBeaver:

| Trường | Giá trị |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `kanado` |
| Username | `kanado` |
| Password | `kanado` |

Các bảng đáng xem: `kanji`, `vocab_items`, `grammar_points`, `cloze_questions` (nội dung học);
`users`, `kana_stats`, `srs_cards`, `test_attempts` (tiến độ người học).

Thêm nội dung mới thì sửa trong `packages/content/src/` rồi chạy lại `npm run db:seed` — seed dùng
upsert nên chạy bao nhiêu lần cũng được. Sửa thẳng trong DBeaver cũng được nhưng lần seed sau sẽ
ghi đè, vì package mới là nguồn gốc.

Muốn xem nhanh không cần DBeaver: `npm run db:studio` mở Prisma Studio.

## Các lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run dev:web` / `npm run dev:api` | Chạy chế độ phát triển |
| `npm run build` | Build cả ba package |
| `npm run db:up` / `npm run db:down` | Bật/tắt Postgres |
| `npm run db:migrate` | Tạo và áp dụng migration mới |
| `npm run db:seed` | Nạp lại nội dung học vào DB |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run extract:content` | Sinh lại `raw.ts` từ `prototype/kana-do.html` |

## API

Tất cả nằm dưới tiền tố `/api`.

### Auth

| Method | Đường dẫn | Việc |
|---|---|---|
| POST | `/auth/register` | Đăng ký, trả về cặp token |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/refresh` | Đổi refresh token lấy cặp mới (token cũ bị thu hồi ngay) |
| POST | `/auth/logout` | Thu hồi refresh token |
| GET | `/auth/me` | Thông tin tài khoản (cần Bearer token) |

### Tiến độ (cần đăng nhập)

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/progress` | Toàn bộ tiến độ |
| GET | `/progress/summary` | Số liệu tổng hợp cho trang tài khoản |
| POST | `/progress/sync` | Đồng bộ hai chiều, trả về trạng thái đã hợp nhất |
| DELETE | `/progress` | Xoá sạch tiến độ |

### Nội dung (không cần đăng nhập)

`/content/kana`, `/content/kanji?level=N5|N4|both`, `/content/vocab`, `/content/grammar?level=…`,
`/content/cloze?level=…`, `/content/decks`, `/content/decks/:deckId`, `/content/plan`.

## Cách đồng bộ hoạt động

App luôn ghi vào `localStorage` trước, nên **học được cả khi offline hoặc chưa đăng nhập**. Khi đã
đăng nhập, thay đổi được gom lại và đẩy lên server sau 1,5 giây kể từ thao tác cuối, cộng thêm một
lần đẩy khi rời trang.

Khi hai máy có dữ liệu khác nhau, server không lấy "bên nào ghi sau thì thắng" mà theo quy tắc giữ
phần học được nhiều hơn:

- **Bảng chữ** — giữ bản có tổng lượt ôn lớn hơn.
- **Flashcard** — giữ hộp SRS cao hơn; bằng hộp thì giữ hạn ôn xa hơn.
- **Lịch sử thi** — chỉ thêm, không sửa không xoá; trùng mốc thời gian thì bỏ qua.

Nghĩa là đăng nhập trên máy mới không bao giờ làm mất tiến độ đang có ở máy cũ.

Tiến độ từ bản HTML một trang (`kanado.v1`, `kanado.srs.v1`, `kanado.tests.v1` trong localStorage)
được tự động nhặt sang lần đầu mở app mới.

## Deploy

### API + Database lên Railway

1. Tạo project mới, thêm **PostgreSQL** từ marketplace.
2. Thêm service từ repo GitHub này, đặt **Root Directory** là `/` và dùng
   `apps/api/Dockerfile` làm build config (Railway đọc được Dockerfile khi trỏ đúng đường dẫn).
3. Biến môi trường:

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_ACCESS_SECRET=<openssl rand -base64 48>
   JWT_REFRESH_SECRET=<chuỗi khác, cũng ngẫu nhiên>
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=30d
   PORT=4000
   CORS_ORIGINS=https://<tên-app>.vercel.app
   ```

4. Deploy. Dockerfile tự chạy `prisma migrate deploy` trước khi khởi động.
5. Nạp nội dung một lần: mở shell của service rồi chạy `npx prisma db seed`, hoặc chạy tại máy với
   `DATABASE_URL` trỏ về Postgres của Railway.

Render làm tương tự: Web Service kiểu Docker, cùng bộ biến môi trường.

### Web lên Vercel

1. Import repo, đặt **Root Directory** là `apps/web`.
2. Vercel tự nhận Next.js. Thêm biến môi trường:

   ```
   NEXT_PUBLIC_API_URL=https://<api-cua-ban>.up.railway.app/api
   ```

3. Deploy, rồi quay lại Railway sửa `CORS_ORIGINS` thành domain Vercel thật.

Biến `NEXT_PUBLIC_*` được nhúng vào bundle lúc build, nên đổi giá trị thì phải **redeploy**, không
chỉ restart.

### Kiểm tra sau khi deploy

```bash
curl https://<api>/api/health
```

Phải trả về `{"status":"ok",...}`. Nếu trang web đăng nhập được nhưng báo lỗi CORS trong Console,
gần như chắc chắn `CORS_ORIGINS` chưa khớp domain Vercel.

## Ghi chú bảo mật

- Mật khẩu băm bằng bcrypt (12 vòng). Refresh token lưu trong DB dưới dạng băm SHA-256, xoay vòng
  mỗi lần dùng — token cũ dùng lại sẽ bị từ chối.
- Token lưu ở `localStorage` để web và API khác domain vẫn chạy đơn giản. Đổi lại, JavaScript trên
  trang đọc được token. Với app cá nhân thì chấp nhận được; nếu sau này nhúng script bên thứ ba,
  nên chuyển refresh token sang cookie `httpOnly` + `SameSite=None; Secure`.
- Đổi `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` thành chuỗi ngẫu nhiên trước khi deploy. Đừng
  commit file `.env`.

## Nội dung học hiện có

| Mảng | Có sẵn | N4 cần |
|---|---|---|
| Bảng chữ | đủ (hiragana + katakana + mở rộng) | đủ |
| Kanji | 249 | ~300 |
| Từ vựng | 241 | ~1.500 |
| Mẫu ngữ pháp | 68 (20 N5 + 48 N4) | ~150 |
| Luyện nghe | 0 | 60/180 điểm thi |

App không dạy nghe được, và phần nghe chiếm 60/180 điểm N4 với mức điểm sàn riêng. Xem tab
**Lộ trình** trong app để biết cần thêm giáo trình và tài liệu nghe nào.
