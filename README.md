# Kanadō — học tiếng Nhật từ bảng chữ tới JLPT N3

Ứng dụng học tiếng Nhật cá nhân: bảng chữ, 721 kanji, 3.644 từ vựng, ngữ pháp N5–N3,
flashcard lặp lại ngắt quãng và đề kiểm tra chấm điểm. Tiến độ đồng bộ giữa các thiết bị qua tài khoản.

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
├─ tools/extract-content.js    Sinh lại raw.ts từ prototype
├─ tools/import-dictionary.js  Nhập kanji và từ vựng từ từ điển mở
└─ docker-compose.yml    Postgres cho môi trường phát triển
```

### Vì sao nội dung nằm ở package chứ không gọi API

Dữ liệu học là tĩnh (721 kanji, 3.644 từ, 134 mẫu ngữ pháp). Để trong package thì web
render tức thì, không chờ mạng, và học được cả khi API chết. API vẫn có đầy đủ endpoint
`/api/content/*` đọc từ cùng nguồn — dành cho client khác về sau (app điện thoại chẳng hạn) và
để bạn tra cứu, thống kê, soạn thêm nội dung bằng DBeaver.

API chỉ thật sự cần cho hai việc: **tài khoản** và **đồng bộ tiến độ**.

## Chạy lần đầu

Cần Node 20+. Docker Desktop chỉ cần khi muốn chạy Postgres ở máy thay vì dùng Neon.

```bash
npm run setup
```

Lệnh này cài dependencies, build package nội dung, và sinh Prisma Client.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Điền `DATABASE_URL` và `DIRECT_URL` trong `apps/api/.env` bằng chuỗi Neon (xem mục dưới), rồi:

```bash
npm run db:migrate
npm run db:seed
```

Muốn dùng Postgres local thay vì Neon thì bỏ comment hai dòng `localhost` trong `.env` và chạy
`npm run db:up` trước.

Mở hai terminal:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Web ở http://localhost:3000, API ở http://localhost:4000/api.

## Hai chuỗi kết nối: DATABASE_URL và DIRECT_URL

Prisma cần hai biến vì Neon có hai loại endpoint:

| Biến | Dùng cho | Endpoint |
|---|---|---|
| `DATABASE_URL` | ứng dụng lúc chạy | có `-pooler` trong hostname nếu deploy serverless (Vercel); dùng direct nếu chạy server thường (Render, VM) |
| `DIRECT_URL` | migration | **luôn** là endpoint direct — pooler không chạy được lệnh DDL |

Lấy cả hai trong Neon Console → Connection Details (chọn "Pooled connection" để ra chuỗi có
`-pooler`). Chạy Postgres local trong Docker thì đặt cả hai bằng cùng một chuỗi `localhost`.

## Kết nối DBeaver

**Với Neon** — dán thẳng chuỗi direct vào ô URL khi tạo connection PostgreSQL, hoặc điền tay
host / database / user / password lấy từ chuỗi đó. Nhớ bật SSL (`sslmode=require`).

**Với Postgres local** sau `npm run db:up`:

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
| `npm run db:up` / `npm run db:down` | Bật/tắt Postgres local trong Docker (không cần khi dùng Neon) |
| `npm run db:migrate` | Tạo và áp dụng migration mới |
| `npm run db:seed` | Nạp lại nội dung học vào DB |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run extract:content` | Sinh lại `raw.ts` từ `prototype/kana-do.html` |
| `npm run import:dict` | Tải lại kanji và từ vựng từ từ điển mở |

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

`/content/kana`, `/content/kanji?level=N5|N4|N3|both`, `/content/vocab`, `/content/grammar?level=…`,
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

Database dùng **Neon** (free vĩnh viễn, không hết hạn). Chỉ cần chọn nơi chạy API.

### Bước 1 — API lên Render

Repo có sẵn `render.yaml` nên không phải điền tay cấu hình.

1. Push code lên GitHub (nếu chưa): `git push -u origin main`.
2. Render → **New** → **Blueprint** → chọn repo này. Render đọc `render.yaml` và tạo sẵn service
   `kanado-api` (Docker, gói free, region Singapore, health check `/api/health`).
3. Render hỏi ba biến chưa có giá trị — điền vào:

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | chuỗi kết nối Neon (bản direct) |
   | `DIRECT_URL` | cùng chuỗi trên |
   | `CORS_ORIGINS` | tạm điền `http://localhost:3000`, sửa lại ở bước 3 |

   Hai biến `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` được Render tự sinh ngẫu nhiên.

4. Apply. Lần build đầu mất khoảng 5–10 phút. Container tự chạy `prisma migrate deploy` trước khi
   khởi động nên không cần thao tác gì thêm.
5. Kiểm tra: mở `https://kanado-api-xxxx.onrender.com/api/health`, phải ra `{"status":"ok",...}`.

Nội dung học (kanji, từ vựng, ngữ pháp) chỉ cần nạp **một lần** và đã nằm sẵn trên Neon. Nếu về sau
thêm nội dung mới thì chạy `npm run db:seed` từ máy bạn với `.env` trỏ về Neon.

Gói free của Render ngủ sau 15 phút không có request, lần gọi đầu sau đó mất 30–60 giây. Database
nằm ở Neon nên **không bị xoá sau 30 ngày** như Postgres free của chính Render.

### Bước 2 — Web lên Vercel

1. Import repo, đặt **Root Directory** là `apps/web`.
2. Bật **Include source files outside of the Root Directory** — bắt buộc, vì web dùng
   `packages/content` nằm ngoài thư mục gốc.
3. Deploy. Không cần đặt biến môi trường nào, cũng không cần chỉnh Install/Build Command:
   - URL API nằm trong `apps/web/.env.production` (đã commit).
   - `apps/web` có script `prebuild` tự dựng `@kanado/content` trước khi `next build` chạy.

Đổi domain API thì sửa `apps/web/.env.production` rồi push, Vercel tự build lại.

> **Vì sao URL API để trong repo mà không đặt trong dashboard?**
> Tiền tố `NEXT_PUBLIC_` khiến Next.js nhúng giá trị thẳng vào JavaScript gửi xuống trình duyệt —
> nó công khai theo đúng thiết kế, không phải bí mật. Vercel còn chặn không cho lưu biến có tiền tố
> này dưới dạng Secret. Để trong repo thì rõ ràng hơn và bớt một bước cấu hình tay. Bí mật thật
> (chuỗi Neon, JWT secret) nằm ở phía Render và không bao giờ xuống trình duyệt.

Nếu vẫn báo `Module not found: Can't resolve '@kanado/content'`, nghĩa là Vercel không thấy thư mục
`packages/` — kiểm tra lại bước 2, hoặc đặt Install Command thành `cd ../.. && npm install`.

### Bước 3 — Nối hai đầu lại

Quay lại Render, sửa `CORS_ORIGINS` thành domain Vercel thật
(`https://<tên-app>.vercel.app`) rồi để service khởi động lại. Không làm bước này thì trang web mở
được nhưng đăng nhập sẽ báo lỗi CORS trong Console.

### Bước 4 — Kiểm tra

Mở trang web, tạo tài khoản, học vài chữ rồi mở tab ẩn danh đăng nhập lại — tiến độ phải theo sang.
Chấm tròn cạnh tên tài khoản trên header chuyển xanh là đã đồng bộ được.

### Vài chỗ hay vướng

- **Đổi `NEXT_PUBLIC_API_URL` phải redeploy Vercel**, không chỉ restart — biến `NEXT_PUBLIC_*` được
  nhúng thẳng vào bundle lúc build.
- **Đăng nhập báo lỗi CORS** trong Console: `CORS_ORIGINS` trên Render chưa khớp domain Vercel.
  Phải khớp cả `https://` và không có dấu `/` ở cuối.
- **Lần gọi đầu trong ngày chậm 30–60 giây**: đúng như thiết kế của gói free Render, service ngủ
  sau 15 phút không ai dùng. Muốn hết thì nâng lên gói trả phí, hoặc chuyển API sang Vercel
  serverless (cold start còn 1–2 giây) — khi đó nhớ đổi `DATABASE_URL` sang chuỗi **có `-pooler`**
  của Neon, vì serverless mở kết nối mới mỗi lần gọi.
- **Build Docker lỗi Prisma/OpenSSL**: Dockerfile dùng `node:20-slim` chứ không phải `alpine` chính
  vì lý do này — đừng đổi base image sang alpine nếu không muốn xử lý `binaryTargets`.

## Ghi chú bảo mật

- Mật khẩu băm bằng bcrypt (12 vòng). Refresh token lưu trong DB dưới dạng băm SHA-256, xoay vòng
  mỗi lần dùng — token cũ dùng lại sẽ bị từ chối.
- Token lưu ở `localStorage` để web và API khác domain vẫn chạy đơn giản. Đổi lại, JavaScript trên
  trang đọc được token. Với app cá nhân thì chấp nhận được; nếu sau này nhúng script bên thứ ba,
  nên chuyển refresh token sang cookie `httpOnly` + `SameSite=None; Secure`.
- Đổi `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` thành chuỗi ngẫu nhiên trước khi deploy. Đừng
  commit file `.env`.

## Nội dung học hiện có

| Mảng | Có sẵn | N3 cần |
|---|---|---|
| Bảng chữ | đủ (hiragana + katakana + mở rộng) | đủ |
| Kanji | 721 | ~650 |
| Từ vựng | 3.644 | ~3.750 |
| Mẫu ngữ pháp | 134 (20 N5 + 48 N4 + 66 N3) | ~300 cộng dồn |
| Luyện đọc, luyện nghe | 0 | 120/180 điểm đề N3 |

Nội dung đến từ hai nguồn. Phần **soạn tay** (461 kanji, 423 từ, toàn bộ ngữ pháp) có nghĩa tiếng
Việt và từ ví dụ chọn lọc. Phần **nhập từ từ điển mở** lấp chỗ còn lại, nghĩa là tiếng Anh và được
đánh dấu `EN` trong giao diện. Mọi kanji đều có **âm Hán Việt** lấy từ KANJIDIC2 — rất hữu ích để
đoán nghĩa chữ chưa gặp.

Nhập lại dữ liệu từ điển:

```bash
npm run import:dict && npm run build:content && npm run db:seed
```

App không dạy đọc hiểu và nghe được — hai mảng đó chiếm 120/180 điểm đề N3. Xem tab **Lộ trình**
trong app để biết cần thêm giáo trình và tài liệu nào.

## Nguồn dữ liệu và ghi công

- **KANJIDIC2** — Electronic Dictionary Research and Development Group (EDRDG), dùng theo giấy
  phép [Creative Commons BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html). Cung cấp âm On,
  âm Kun, âm Hán Việt, nghĩa tiếng Anh, số nét và độ thường gặp.
- **open-anki-jlpt-decks** — Jamie Sinclair, giấy phép MIT.
  Cung cấp danh sách từ vựng đã gắn cấp JLPT.

KANJIDIC2 dùng thang JLPT cũ (1–4) chứ không phải thang mới, và kỳ thi hiện nay không công bố danh
sách kanji chính thức. Script nhập quy đổi xấp xỉ: cũ 4 → N5, cũ 3 → N4, cũ 2 → N3 lấy theo độ
thường gặp cho tới khoảng 650 chữ. Đây là phép xấp xỉ, không phải danh sách chính thức.
