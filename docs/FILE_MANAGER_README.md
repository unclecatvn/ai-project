# File Manager - Hệ thống quản lý file với Database

## Tổng quan

Hệ thống File Manager cho phép quản lý các file markdown, HTML và text trong database thay vì chỉ dùng file system. Giao diện chính tại `/` hoạt động như Developer File Browser: tree IDE, list + preview split-pane, full-text search, filter type/tag/sensitivity và actions dev-focused.

## 📁 Cấu trúc

```
report-viewer/
├── supabase/migrations/
│   └── 001_create_file_manager_schema.sql  # Database schema
├── scripts/
│   └── import-files-to-db.mjs               # Script import file từ content/ vào DB
├── src/
│   ├── lib/
│   │   ├── file-manager.ts                  # Types & utilities
│   │   └── file-manager-api.ts              # API functions
│   ├── app/
│   │   ├── page.tsx                         # File Browser chính
│   │   ├── admin/files/page.tsx             # Deprecated -> redirect về /
│   │   └── api/file-manager/
│   │       ├── files/route.ts               # API files
│   │       ├── files/[id]/route.ts          # API single file
│   │       ├── files/by-source/route.ts     # API preview theo source_path
│   │       ├── folders/route.ts             # API folders
│   │       └── stats/route.ts               # API stats
```

## 🚀 Cài đặt

### 1. Setup Database

Chạy migration SQL trong Supabase:

```bash
# Copy nội dung file supabase/migrations/001_create_file_manager_schema.sql
# Paste vào SQL Editor của Supabase và chạy
```

### 2. Cấu hình Environment Variables

Đảm bảo file `.env.local` có:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Import files hiện có

```bash
# Import tất cả files từ content/ vào database
node scripts/import-files-to-db.mjs
```

Script sẽ:
- Quét tất cả file `.md`, `.markdown`, `.html` trong `content/`
- Tự động tạo cấu trúc folder theo đường dẫn
- Import nội dung file vào database

### 4. Chạy ứng dụng

```bash
npm run dev
```

Truy cập: `http://localhost:3000/`

## 📊 Database Schema

### Tables

#### `folders`
- `id`: UUID (primary key)
- `name`: Tên folder
- `parent_id`: Folder cha (nullable)
- `path`: Đường dẫn đầy đủ
- `level`: Cấp độ (0 = root)
- `sort_order`: Thứ tự sắp xếp

#### `files`
- `id`: UUID (primary key)
- `folder_id`: Folder chứa (nullable)
- `title`: Tiêu đề hiển thị
- `file_name`: Tên file
- `source_path`: Đường dẫn gốc
- `file_type`: Loại file (markdown/html/json/text)
- `content`: Nội dung file
- `size`: Kích thước (bytes)
- `public_path`: Đường dẫn public
- `is_active`: Đang hoạt động

#### `file_tags`
- `id`: UUID (primary key)
- `name`: Tên tag
- `color`: Màu sắc hiển thị

#### `file_tag_relations`
- `file_id`: File
- `tag_id`: Tag

## 🔌 API Endpoints

### Files

```
GET    /api/file-manager/files              # List files
POST   /api/file-manager/files              # Create file
GET    /api/file-manager/files/:id          # Get file detail
PUT    /api/file-manager/files/:id          # Update file
DELETE /api/file-manager/files/:id          # Delete file (soft delete)
```

Query Parameters:
- `folder_id`: Filter by folder
- `file_type`: Filter by type (markdown/html)
- `search`: Search in title, filename, content
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50)
- `order_by`: Sort field (title/file_name/size/created_at/updated_at)
- `order_direction`: asc/desc

### Folders

```
GET    /api/file-manager/folders            # List folders
POST   /api/file-manager/folders            # Create folder
```

Query Parameters:
- `parent_id`: Filter by parent folder

### Stats

```
GET    /api/file-manager/stats              # Get statistics
```

## 💻 Developer File Browser

### Features

1. **IDE Tree Panel**: Duyệt folder theo cây thư mục
2. **Filter Bar**: Full-text search + filter theo type/sensitivity/tag
3. **List Pane**: Bảng file có hành động View/Download/Open raw/Copy path
4. **Preview Pane**: Xem trước markdown/html theo file được chọn
5. **DB-first**: Không fallback ngầm về `content/`

### Sử dụng

1. **Duyệt file**: Chọn folder trong tree panel
2. **Lọc dữ liệu**: Dùng search/type/sensitivity/tags
3. **Xem preview**: Click vào một file ở list pane
4. **Hành động dev**: Copy path, Open raw, Download, View detail route
5. **Entrypoint duy nhất**: dùng `/` cho toàn bộ nghiệp vụ file browser

## 🛠️ Development

### Import Utilities

```typescript
import { getFileIcon, formatFileSize, buildFileNodeTree } from '@/lib/file-manager';
import { getFiles, getFileById, createFile } from '@/lib/file-manager-api';

// Get files with filter
const result = await getFiles({
    folder_id: null,
    file_type: 'markdown',
    search: 'query',
    page: 1,
    page_size: 20
});

// Build file tree for UI
const tree = buildFileNodeTree(folders, files);
```

### Custom Components

```tsx
import { FileNode, File, Folder } from '@/lib/file-manager';
import { getFileIcon, getFileColor, formatFileSize } from '@/lib/file-manager';

function FileItem({ file }: { file: File }) {
    return (
        <div className="flex items-center gap-2">
            <span className={getFileColor(file.file_type)}>
                {getFileIcon(file.file_type)}
            </span>
            <span>{file.title}</span>
            <span className="text-sm text-gray-400">
                {formatFileSize(file.size)}
            </span>
        </div>
    );
}
```

## 📝 Ví dụ sử dụng

### Import file mới vào database

```javascript
import { createFile } from '@/lib/file-manager-api';

const newFile = await createFile({
    folder_id: 'folder-uuid',
    title: 'My Document',
    file_name: 'my-doc.md',
    source_path: 'custom/my-doc.md',
    file_type: 'markdown',
    content: '# Hello World\n\nThis is my content.',
    size: 45
});
```

### Tìm kiếm files

```javascript
import { searchFiles } from '@/lib/file-manager-api';

const results = await searchFiles('strategic analysis', 20);
```

### Lấy thống kê

```javascript
import { getFileStats } from '@/lib/file-manager-api';

const stats = await getFileStats();
console.log(stats);
// { totalFiles: 15, totalFolders: 5, markdownFiles: 10, htmlFiles: 5 }
```

## 🔐 Security

- Enable Row Level Security (RLS) trong Supabase
- Cấu hình Supabase qua `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Validated input data trước khi insert/update
- Soft delete thay vì hard delete

## 🚀 TODO - Features sắp tới

- [ ] Bulk import/export
- [ ] File tagging system
- [ ] Advanced search with filters
- [ ] File versioning
- [ ] Drag & drop file upload
- [ ] Edit file directly in UI
- [ ] Export to PDF
- [ ] Collaborative editing
- [ ] File sharing with permissions
