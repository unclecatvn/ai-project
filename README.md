# Report Viewer

Giao diện web để xem các file phân tích trong workspace, hỗ trợ cả Markdown và HTML.

## Các file được đồng bộ

Trước khi chạy dev/build, script `scripts/sync-analysis-files.mjs` sẽ quét thư mục `content/` (nằm trong `report-viewer`) và copy các file có đuôi:

- `.md`
- `.markdown`
- `.html`

Vào `public/analysis` và tạo manifest tại `src/data/analysis-manifest.json`.

Các thư mục được bỏ qua: `.git`, `node_modules`, `.next`, `.vercel`.

Quan trọng: để deploy Vercel luôn ổn định như localhost, hãy đặt tài liệu nguồn vào `report-viewer/content`.

## Cấu trúc Markdown gợi ý

Bạn nên quản lý tài liệu tại `../docs`:

- `../docs/analysis/strategic`
- `../docs/analysis/reports`
- `../docs/analysis/html`
- `../docs/resources`
- `../docs/skills`

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` để xem danh sách file.

## Deploy Vercel

1. Push code lên git provider (GitHub/GitLab/Bitbucket).
2. Import project vào Vercel.
3. Đặt **Root Directory** là `report-viewer`.
4. Build command: `npm run build`.
5. Output theo mặc định của Next.js (không cần đổi).

Script `prebuild` sẽ tự động đồng bộ file phân tích trước khi build.
