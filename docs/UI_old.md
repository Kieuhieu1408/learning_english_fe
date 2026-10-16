# TÀI LIỆU THIẾT KẾ GIAO DIỆN HIỆN TẠI (UI_old.md)

## Dự án: Hệ Thống Học Từ Vựng Tiếng Anh Ghi Chú Thông Minh (Smart English Notes)

---

## 1. Công nghệ & Nền tảng Giao diện (UI Tech Stack)

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.9.
- **Styling Engine**: Tailwind CSS v4 (`@import "tailwindcss"` qua `@tailwindcss/postcss`).
- **Icons**: `lucide-react` (phiên bản 0.577.0).
- **Theme Engine**: `next-themes` (quản lý chế độ `dark` / `light`).
- **Animations**: CSS transitions + Tailwind arbitrary classes (`animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-bottom`).

---

## 2. Hệ Thống Màu Sắc & Bảng Mã Màu Chi Tiết (Color Palette)

Hệ thống màu hiện tại phụ thuộc chủ yếu vào bảng màu **Slate** của Tailwind CSS kết hợp với điểm nhấn **Indigo** và các màu trạng thái rực rỡ mang phong cách Dark Mode công nghệ:

### 2.1. Màu Nền & Bề Mặt (Backgrounds & Surfaces)

| Tên thành phần                    | Lớp Tailwind   | Mã Hex    | Ghi chú / Vị trí sử dụng                             |
| :-------------------------------- | :------------- | :-------- | :--------------------------------------------------- |
| **Dark Canvas (Nền tối chính)**   | `bg-slate-950` | `#020617` | Nền toàn trang LoginPage, ResultPage, Leftbar (dark) |
| **Dark Card / Container**         | `bg-slate-900` | `#0f172a` | Khung thẻ Auth, Leftbar sidebar, card bảng thống kê  |
| **Dark Surface Elevated**         | `bg-slate-800` | `#1e293b` | Nút bấm phụ, thanh tiến trình rỗng, popover hover    |
| **Light Canvas (Nền sáng chính)** | `bg-white`     | `#ffffff` | Nền chính MainPage (light mode), khung soạn thảo     |
| **Light Card / Surface**          | `bg-slate-100` | `#f1f5f9` | Thanh pill thống kê, nút phụ light mode              |
| **Light Surface Muted**           | `bg-slate-50`  | `#f8fafc` | Nền phụ của các chủ đề màu sáng                      |

### 2.2. Đường Viền & Phân Cách (Borders & Dividers)

| Tên thành phần         | Lớp Tailwind                                  | Mã Hex                  | Ghi chú                                                |
| :--------------------- | :-------------------------------------------- | :---------------------- | :----------------------------------------------------- |
| **Dark Border Chính**  | `border-slate-800`                            | `#1e293b`               | Viền các card, modal, phân tách cột Leftbar            |
| **Dark Border Nhẹ**    | `border-slate-800/50` / `border-slate-800/80` | `rgba(30, 41, 59, 0.5)` | Đường kẻ phân cách hàng bảng từ vựng, đường viền modal |
| **Light Border Chính** | `border-slate-200`                            | `#e2e8f0`               | Viền Header, viền khung soạn thảo light mode           |

### 2.3. Màu Chữ & Biểu Tượng (Typography & Icons)

| Vai trò                      | Lớp Tailwind                        | Mã Hex                | Ngữ cảnh                                             |
| :--------------------------- | :---------------------------------- | :-------------------- | :--------------------------------------------------- |
| **Text Primary (Tối)**       | `text-white` / `text-slate-100`     | `#ffffff` / `#f1f5f9` | Tiêu đề chính, từ vựng nổi bật, text chính dark mode |
| **Text Primary (Sáng)**      | `text-slate-900` / `text-slate-800` | `#0f172a` / `#1e293b` | Tiêu đề, chữ chính light mode                        |
| **Text Secondary / Muted**   | `text-slate-400`                    | `#94a3b8`             | Bản dịch nghĩa, nhãn phụ, icon                       |
| **Text Tertiary / Disabled** | `text-slate-500` / `text-slate-600` | `#64748b` / `#475569` | Placeholder, ngày tháng, IPA mờ                      |

### 2.4. Màu Thương Hiệu & Điểm Nhấn (Brand / Accent Colors)

| Tên màu                  | Lớp Tailwind                           | Mã Hex                                | Mục đích                                   |
| :----------------------- | :------------------------------------- | :------------------------------------ | :----------------------------------------- |
| **Primary Accent**       | `bg-indigo-600` / `text-indigo-600`    | `#4f46e5`                             | Nút bấm chính (CTA), tab active, icon logo |
| **Primary Hover**        | `bg-indigo-500` / `text-indigo-500`    | `#6366f1`                             | Trạng thái hover của nút bấm chính         |
| **Primary Light / Glow** | `text-indigo-400` / `bg-indigo-500/10` | `#818cf8` / `rgba(99, 102, 241, 0.1)` | Huy hiệu phụ, viền phát sáng, icon nền     |

### 2.5. Màu Trạng Thái Học Tập & Hệ Thống (Semantic Status)

| Trạng thái                  | Lớp Text & Border                            | Lớp Nền (10% Opacity) | Mã Hex                        |
| :-------------------------- | :------------------------------------------- | :-------------------- | :---------------------------- |
| **MASTERED (Đã thuộc)**     | `text-emerald-400` / `border-emerald-500/20` | `bg-emerald-500/10`   | `#34d399` (Xanh lá ngọc)      |
| **LEARNING (Đang học)**     | `text-amber-400` / `border-amber-500/20`     | `bg-amber-500/10`     | `#fbbf24` (Vàng hổ phách)     |
| **NEW (Từ mới)**            | `text-indigo-400` / `border-indigo-500/20`   | `bg-indigo-500/10`    | `#818cf8` (Tím xanh indigo)   |
| **ERROR / FAILED / DELETE** | `text-rose-400` / `border-rose-500/20`       | `bg-rose-500/10`      | `#fb7185` (Đỏ hoa hồng)       |
| **OFFLINE / WARNING**       | `text-amber-700` / `border-amber-200`        | `bg-amber-100`        | `#b45309` (Cảnh báo mất mạng) |

### 2.6. Bảng Tùy Chọn Theme Nền Cá Nhân (Theme Options trong `Leftbar`)

- `midnight`: Dark mặc định (`bg-slate-950` / `#020617`)
- `slate`: Sáng xám lạnh (`bg-slate-50` / `#f8fafc`)
- `sky`: Sáng xanh da trời nhẹ (`bg-sky-50` / `#f0f9ff`)
- `lavender`: Sáng tím oải hương (`bg-purple-50` / `#faf5ff`)
- `mint`: Sáng xanh bạc hà (`bg-emerald-50` / `#ecfdf5`)
- `peach`: Sáng cam đào (`bg-orange-50` / `#fff7ed`)
- `rose`: Sáng hồng phấn (`bg-rose-50` / `#fff1f2`)

---

## 3. Danh Sách Các Trang (Pages/Views) & Cấu Trúc Bố Cục

```
app/
├── page.tsx                     # Bộ điều hướng View trung tâm (activeView)
├── views/
│   ├── LoginPage.tsx            # View Đăng nhập/Đăng ký (gọi AuthPage)
│   ├── MainPage.tsx             # View chính: Sidebar + Header + Editor / Quiz
│   ├── KeySettingPage.tsx       # View cài đặt API Key AI
│   ├── TestPage.tsx             # View phòng thi/ôn tập độc lập
│   └── ResultPage.tsx           # View tổng kết kết quả học tập
```

---

## 4. Danh Sách Chi Tiết Các Component Hiện Có

### 4.1. `AuthPage.tsx`

- **Vị trí**: `components/AuthPage.tsx`
- **Layout**: Hộp thoại rộng `max-w-md`, bo góc lớn `rounded-2xl`, bóng đổ sâu `shadow-2xl`.
- **Thành phần**:
  - Logo icon `GraduationCap` trong ô vuông tròn nhỏ `rounded-xl bg-indigo-600/10`.
  - Tiêu đề `text-2xl font-extrabold text-white`.
  - Input có icon định vị tuyệt đối `left-3 top-3` (`User`, `Mail`, `Lock`).
  - Nút bấm toàn chiều rộng `w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3`.

### 4.2. `DashboardCounters.tsx`

- **Vị trí**: `components/DashboardCounters.tsx`
- **Layout**: Thanh ngang trên cùng (Header), viền dưới `border-b border-slate-200 dark:border-slate-800`.
- **Thành phần**:
  - Cột trái (rộng `w-64` khớp với sidebar): Logo `Sparkles` màu tím + Tiêu đề _"English Notes"_ + Nút **Sync** (icon xoay tròn khi đang đồng bộ).
  - Khu vực giữa: 2 Tab chuyển đổi dạng pill viền bo tròn `rounded-xl px-4 py-2 text-xs font-bold`: **Word Editor** vs **Review Session**.
  - Khu vực phải:
    - Card nhỏ Today's Streak: Icon `Award` màu tím, số từ to đậm.
    - Card nhỏ Total Words: Icon `Award` màu hổ phách, số thẻ to đậm.
    - Huy hiệu kết nối: Viên thuốc bo cong mềm `rounded-2xl px-3.5 py-2` hiển thị **Connected** (icon `Cloud`) hoặc **Offline** (icon `CloudOff`).

### 4.3. `Leftbar.tsx`

- **Vị trí**: `components/Leftbar.tsx`
- **Layout**: Cột cố định bề ngang `w-64`, chiều cao full màn hình, viền phải `border-r border-slate-200 dark:border-slate-800`.
- **Thành phần**:
  - Khối Thư mục Chủ đề (`Topics`): Nút thêm mới `FolderPlus`, danh sách hiển thị icon `ChevronRight` / `ChevronDown` khi mở thư mục.
  - Khối Ghi chú (`Notes`): Nằm thụt lề bên trong Topic, icon `FileText`, nút thêm nhanh `FilePlus`.
  - Khối Người dùng & Cấu hình dưới đáy:
    - Avatar chữ cái viết tắt, tên đăng nhập.
    - Nút Settings (icon `Settings` ⚙️).
    - Thanh chọn Theme màu tròn nhỏ (Color Dots).
    - Nút chuyển chế độ Sáng/Tối (`Sun` / `Moon`).
    - Nút Đăng xuất (`LogOut` màu đỏ nhạt).

### 4.4. `NotionEditor.tsx`

- **Vị trí**: `components/NotionEditor.tsx`
- **Layout**: Khung trung tâm tối đa `max-w-3xl`, căn giữa.
- **Thành phần**:
  - Thanh công cụ trên: Badge `Notion Editor`, nút **Save changes** màu tím, nút xóa thùng rác `Trash2`.
  - Ô nhập tiêu đề: Input `text-3xl font-extrabold border-none bg-transparent focus:outline-none`.
  - Khung viết văn bản: `textarea` không viền `text-base leading-relaxed resize-none`.
  - **Popover AI dịch từ**: Tọa độ động (`style={{ left: ..., top: ... }}`), nút nổi màu tím mang icon `Sparkles`.
  - **Alert kết quả dịch**: Xuất hiện cố định góc phải dưới `fixed bottom-6 right-6 max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl`.

### 4.5. `QuizEngine.tsx`

- **Vị trí**: `components/QuizEngine.tsx`
- **Layout**: Khung ôn tập thẻ từ căn giữa màn hình.
- **Thành phần**:
  - Bộ đếm tiến độ: `Word X of Y`, thanh progress bar mỏng màu tím.
  - Thẻ Flashcard:
    - Khối bo cong `rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl min-h-[300px]`.
    - Nút loa phát âm `Volume2`.
    - Mặt trước: Từ vựng kích thước lớn `text-3xl font-extrabold`.
    - Mặt sau: Nghĩa dịch, phiên âm font monospace (`font-mono text-sm`), câu ví dụ có từ khuyết hoặc tô đậm.
    - 2 nút hành động lớn dưới thẻ: **Forgot (Quên)** viền đỏ vs **Remembered (Nhớ)** nền tím.
  - Chế độ Điền từ (Essay Mode):
    - Ô input đơn `border border-slate-800 bg-slate-950 rounded-xl px-4 py-3`.
    - Nút Submit mũi tên `ArrowRight`.

### 4.6. `ResultPage.tsx`

- **Vị trí**: `app/views/ResultPage.tsx`
- **Layout**: Khung nội dung tối đa `max-w-4xl`, nền `bg-slate-950`.
- **Thành phần**:
  - Header dính (`sticky top-0 bg-slate-950/80 backdrop-blur-xl`): Nút mũi tên quay lại `ArrowLeft` + Tiêu đề Gradient (`from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`).
  - Grid 3 Card thống kê hôm nay: **Total Reviewed**, **Correct**, **Needs Review**.
  - Card tiến độ tổng thể (`Overall Progress`): Thanh bar 3 màu nối liền nhau hiển thị tỷ lệ % Mastered, Learning, New.
  - Bảng danh sách từ (`All Words`): Header grid 12 cột (`grid-cols-12`), các hàng ngăn cách bằng viền mờ `divide-slate-800/50`.

### 4.7. `ConflictResolverModal.tsx`

- **Vị trí**: `components/ConflictResolverModal.tsx`
- **Layout**: Modal lớp phủ mờ toàn màn hình `fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50`.
- **Thành phần**:
  - Icon cảnh báo `AlertTriangle` màu vàng hổ phách.
  - 2 cột so sánh song song: Cột Local vs Cột Cloud Server.
  - 2 nút bấm lựa chọn phiên bản giữ lại.

---

## 5. Nhận Xét & Đánh Giá Khiếm Khuyết UI Hiện Tại (Visual Critique: "AI-Generated / Industrial Look")

Mặc dù giao diện hiện tại hoạt động tốt và đầy đủ chức năng, nhưng mang đậm cảm giác **"Template do AI tự sinh kiểu công nghiệp" (Generic AI Slop / Bootstrap Dark Mode)** vì những lý do sau:

1. **Lạm dụng màu Slate tối nặng nề (`bg-slate-950` + `bg-slate-900`)**: Tạo cảm giác như một bảng điều khiển Server / DevOps Dashboard hơn là một không gian ghi chú văn chương và học ngôn ngữ tự nhiên.
2. **Đường viền (Borders) quá cứng và thô**: Sử dụng viền `1px border-slate-800` khắp mọi nơi từ card, input đến popover tạo cảm giác bị đóng hộp (boxed-in), thiếu độ thoáng và chiều sâu hữu cơ (organic depth).
3. **Typography thiếu chất riêng**: Sử dụng font sans-serif hệ thống mặc định (`font-sans`) cho toàn bộ từ tiêu đề, nội dung ghi chú đến thẻ từ vựng; thiếu sự tương phản giữa font Serif thanh lịch cho từ vựng và font Sans-serif kỹ thuật cho UI.
4. **Màu sắc quá rực rỡ và máy móc**: Sự kết hợp giữa tím đậm (`indigo-600`), xanh neon (`emerald-400`), vàng rực (`amber-400`) và hồng đỏ (`rose-400`) theo phong cách Tailwind mặc định tạo cảm giác điện tử, thiếu sự ấm áp của trang giấy (paper-like warmth).
5. **Hiệu ứng lật thẻ thô sơ**: Flashcard hiện tại chỉ dùng lệnh ẩn/hiện điều kiện `showAnswer ? mặt_sau : mặt_trước`, không có hiệu ứng 3D lật thẻ vật lý (card flip perspective) hay cảm giác xúc giác (tactile feeling).
