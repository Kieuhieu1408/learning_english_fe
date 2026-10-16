# TÀI LIỆU HỆ THỐNG GIAO DIỆN NÂNG CẤP (UI_new.md)

## Dự án: Hệ Thống Học Từ Vựng Tiếng Anh Ghi Chú Thông Minh (Smart English Notes - Redesign)

---

## 1. Triết Lý Thiết Kế Mới (Anti-AI Slop & Human-Crafted Aesthetic)

Để loại bỏ hoàn toàn cảm giác **"Template do AI tự sinh kiểu công nghiệp"** (Dark mode xanh đen Slate tràn lan, card nổi bóng bẩy vô hồn, nút bấm tím phát sáng rập khuôn), giao diện mới được định hình theo trường phái **"Software-Craft Luxury & Editorial Minimalism"** (lấy cảm hứng từ sự tinh tế của **Notion**, độ chính xác cơ học của **Linear**, và tính thanh lịch của các tạp chí văn học hiện đại):

### 4 Trụ Cột Thẩm Mỹ Chính:

1. **Bề mặt Giấy Ấm (Tactile & Paper-warm Surfaces)**:
   - **Light Mode**: Không dùng màu trắng toát (`#ffffff`) gây chói mắt; chuyển sang sắc trắng giấy ngà ấm áp (`#FBFBFA` và `#F7F7F5`).
   - **Dark Mode**: Không dùng màu Slate xanh đen (`#020617`); chuyển sang màu đá Obsidian / Than chì ấm sâu thẳm (`#111215` và `#18191E`).
2. **Đường Viền Sợi Tóc Siêu Mảnh (Hairline Precision Borders)**:
   - Thay thế các đường viền dày thô bằng viền bán trong suốt `1px` (`rgba(0,0,0,0.06)` ở Light mode và `rgba(255,255,255,0.07)` ở Dark mode).
   - Tạo chiều sâu khối bằng sắc thái phân tầng (Shade differentiation) thay vì đổ bóng màu đen quá đà.
3. **Typography Kết Hợp Đậm Chất Văn Học (Editorial Font Pairing)**:
   - **Từ vựng & Trích dẫn**: Sử dụng font **Serif thanh lịch** (như `Newsreader`, `Instrument Serif`, hoặc `Georgia`) mang hơi thở của cuốn từ điển giấy cao cấp Oxford.
   - **Giao diện & Hệ thống**: Sử dụng font **Sans-serif hiện đại** (như `Geist`, `Inter`, hoặc `SF Pro`) với khoảng cách chữ hẹp (`letter-spacing: -0.02em`) tạo cảm giác sắc sảo, dứt khoát.
4. **Màu Sắc Tiết Chế & Tự Nhiên (Restrained Organic Accents)**:
   - Màu sắc chỉ đóng vai trò truyền tải dữ liệu, không dùng để trang trí lòe loẹt. Dùng các gam màu tự nhiên như Xanh lá Xô thơm (Sage Green), Vàng Mật ong (Warm Amber), và Tím Oải hương Trầm (Iris/Lavender).

---

## 2. Hệ Thống Mã Màu & Design Tokens Mới (Chi Tiết Hex & Semantic)

### 2.1. Bảng Màu Nền & Bề Mặt (Surfaces & Canvas)

| Token Name         | Light Mode (Paper Warm)      | Dark Mode (Deep Obsidian) | Mục đích sử dụng                        |
| :----------------- | :--------------------------- | :------------------------ | :-------------------------------------- |
| `surface-canvas`   | `#FBFBFA` (Trắng ngà mịn)    | `#111215` (Than chì đậm)  | Nền toàn trang, nền NotionEditor        |
| `surface-subtle`   | `#F4F4F1` (Xám giấy nhạt)    | `#17181D` (Bề mặt nâng 1) | Nền Leftbar sidebar, card phụ           |
| `surface-elevated` | `#FFFFFF` (Trắng tinh khiết) | `#1F2026` (Bề mặt nâng 2) | Mặt thẻ Flashcard, Popover dịch từ      |
| `surface-overlay`  | `rgba(251,251,250,0.85)`     | `rgba(17,18,21,0.8)`      | Lớp phủ mờ (Backdrop blur) header/modal |

### 2.2. Bảng Màu Viền & Ngăn Cách (Hairline Borders)

| Token Name        | Light Mode Hex           | Dark Mode Hex               | Đặc điểm                                 |
| :---------------- | :----------------------- | :-------------------------- | :--------------------------------------- |
| `border-hairline` | `rgba(27, 28, 30, 0.08)` | `rgba(240, 240, 245, 0.08)` | Viền 1px mỏng nhẹ, tinh tế cho card/bảng |
| `border-strong`   | `rgba(27, 28, 30, 0.16)` | `rgba(240, 240, 245, 0.15)` | Viền khi hover, viền ô nhập active       |
| `border-focus`    | `#5E6AD2`                | `#717EE8`                   | Vòng focus bàn phím (Linear Iris)        |

### 2.3. Bảng Màu Chữ (Typography Hierarchy)

| Token Name       | Light Mode Hex             | Dark Mode Hex            | Vai trò                             |
| :--------------- | :------------------------- | :----------------------- | :---------------------------------- |
| `text-primary`   | `#1A1B1E` (Đen mực in)     | `#F5F6F8` (Trắng ngọc)   | Tiêu đề, chữ chính, từ vựng nổi bật |
| `text-secondary` | `#5F6368` (Xám trung tính) | `#9B9EA7` (Xám kim loại) | Nghĩa tiếng Việt, mô tả phụ, icon   |
| `text-tertiary`  | `#8F929A` (Xám mờ)         | `#60636C` (Xám khói)     | Phiên âm IPA, ngày tháng, phím tắt  |

### 2.4. Bảng Màu Trạng Thái Học Tập & Hệ Thống (Semantic Colors)

| Trạng thái Học tập      | Màu Chủ Đạo    | Light Mode Badge (Nền + Viền + Chữ)                   | Dark Mode Badge (Nền + Viền + Chữ)                                                |
| :---------------------- | :------------- | :---------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **MASTERED (Đã thuộc)** | **Sage Green** | Nền: `#EAF6EE`<br/>Viền: `#C3E7CE`<br/>Chữ: `#237346` | Nền: `rgba(46,160,90,0.12)`<br/>Viền: `rgba(46,160,90,0.25)`<br/>Chữ: `#48C774`   |
| **LEARNING (Đang học)** | **Warm Amber** | Nền: `#FEF7EA`<br/>Viền: `#FCE1B6`<br/>Chữ: `#B45309` | Nền: `rgba(245,158,11,0.12)`<br/>Viền: `rgba(245,158,11,0.25)`<br/>Chữ: `#FBBF24` |
| **NEW (Từ mới)**        | **Iris Blue**  | Nền: `#F0F2FD`<br/>Viền: `#D3D9FA`<br/>Chữ: `#4654BD` | Nền: `rgba(94,106,210,0.14)`<br/>Viền: `rgba(94,106,210,0.3)`<br/>Chữ: `#8E98EE`  |
| **REVIEW / TYPO**       | **Terracotta** | Nền: `#FDF2F2`<br/>Viền: `#F8D0D0`<br/>Chữ: `#C53030` | Nền: `rgba(224,86,86,0.12)`<br/>Viền: `rgba(224,86,86,0.25)`<br/>Chữ: `#F87171`   |

---

## 3. Bản Đặc Tả Thiết Kế Từng Màn Hình & Component (Component Specs)

### 3.1. `MainPage` & `NotionEditor` (Không gian Viết & Đọc Yên tĩnh)

- **Khung Soạn thảo (Editor Canvas)**:
  - Chiều rộng trang tối đa: `max-w-3xl` căn giữa hoàn hảo, lề thoáng đãng (`px-12 py-16`).
  - Tiêu đề: Font Sans-serif đậm hiện đại `text-4xl font-extrabold tracking-tight text-primary placeholder:text-tertiary`.
  - Thân bài: Font Sans-serif chất lượng cao `text-lg leading-relaxed text-primary/90 font-normal`.
- **Từ vựng đã Highlight trong bài**:
  - Các từ đã lưu trong kho cá nhân được gạch chân chấm thanh nhã: `border-b border-dashed border-iris-400/60 pb-0.5 hover:bg-iris-50/50 cursor-pointer transition-colors`.
- **Popover Dịch từ bằng AI (Translation Floating Card)**:
  - Không dùng hộp thoại đen vuông cứng; chuyển sang card kính mờ cao cấp (`backdrop-blur-xl bg-surface-elevated/95 border-hairline shadow-xl rounded-2xl p-4`).
  - Tiêu đề từ vựng: Font **Editorial Serif** nghiêng nhẹ `italic font-serif text-2xl text-primary`.
  - Có nhãn thông minh: _"Đã lưu ở Note khác (2 câu mẫu)"_ nếu là từ cũ.
  - Các trường nghĩa và câu ví dụ có thể click đúp để chỉnh sửa nhanh.
  - Nút **Save Card**: Nút đen/trắng tối giản viền mờ `bg-primary text-surface-canvas rounded-xl px-4 py-2 text-xs font-semibold`.

### 3.2. `Leftbar` (Thanh Thư Mục & Ngữ Cảnh)

- **Bố cục**: Bề ngang vừa phải (`w-60`), nền phẳng chìm (`surface-subtle`), viền ngăn cách siêu mỏng `border-r border-hairline`.
- **Cây thư mục (Topic / Notes)**:
  - Thư mục Topic: Chữ đậm vừa phải, icon folder vẽ nét thanh mảnh (stroke width 1.5px).
  - Bài Note: Hiển thị tiêu đề bài viết + số lượng từ vựng đã harvest được từ bài đó dạng badge con số nhỏ màu xám nhạt (ví dụ: `8`).
- **Chân trang cá nhân**:
  - Thiết kế tối giản, icon Settings và Theme chuyển thành menu dropdown kín đáo, loại bỏ thanh màu tròn lòe loẹt.

### 3.3. `DashboardCounters` (Thanh Chỉ Số Tinh Tế)

- **Bố cục**: Thanh nổi mỏng manh, chiều cao `h-14`, viền dưới siêu nhẹ.
- **Các chỉ số**:
  - Thay vì các thẻ màu to cồng kềnh, chuyển thành các cụm text thanh lịch:
    - `Hôm nay: 18 từ đã ôn` (chấm xanh lá báo hiệu hoàn thành mục tiêu).
    - `Kho cá nhân: 420 thẻ` (phân loại rõ số từ Mastered/Learning).
    - `Nút Review Session`: Thiết kế thành pill nổi bật với badge số từ đến hạn `[15 thẻ cần ôn]`, bấm vào mở ngay chặng học.

### 3.4. `QuizEngine` (Thẻ Flashcard Xúc Giác & Đầy Động Lực)

- **Mặt Thẻ Flashcard**:
  - Mô phỏng chất liệu giấy Bristol cao cấp: Nền `surface-elevated`, bo góc mềm `rounded-3xl`, viền sợi tóc `border-hairline`, đổ bóng đa lớp tinh tế (ambient shadow).
  - **Mặt Trước**:
    - Từ vựng tiếng Anh toát lên vẻ đẹp tri thức với font **Editorial Serif** cỡ lớn `text-4xl md:text-5xl font-medium tracking-normal text-primary`.
    - Nút loa phát âm tròn nhỏ, icon mỏng thanh lịch.
  - **Mặt Sau**:
    - Nghĩa dịch tiếng Việt sắc nét.
    - Phiên âm IPA đặt trong khung nền mờ nhẹ.
    - Câu ví dụ gốc trích từ bài viết Note với từ vựng được bôi đậm tự nhiên.
  - **Hàng Nút Đánh Giá Phím Tắt**:
    - Nút **Quên (Forgot)**: Phím tắt `[1]`, viền nhẹ màu Terracotta.
    - Nút **Nhớ (Remembered)**: Phím tắt `[2]`, nền Iris/Primary tự tin.
- **Chế độ Điền từ (AI Essay Mode)**:
  - Ô gõ đáp án thiết kế dạng dòng kẻ gạch dưới (Underline input) như điền vào trang sách thật, loại bỏ khung ô vuông input máy móc.
  - Khung thông báo AI chẩn đoán lỗi hiển thị như một lời chú thích của giáo viên viết bằng tay bên lề trang sách.

### 3.5. `ResultPage` (Báo Cáo Bento Grid Sáng Sủa)

- **Thống kê dạng Bento Grid**:
  - Ô lớn: Vòng cung phần trăm tỷ lệ nhớ bài trong ngày (`Accuracy Rate`).
  - Ô vừa: Số từ nạp mới hôm nay vs Số lượt đã ôn tập.
  - Ô dài: Biểu đồ chuỗi ngày học liên tục (Streak Calendar Dots).
- **Bảng Tra cứu Từ vựng**:
  - Bảng sạch sẽ không viền dọc, chỉ có đường kẻ ngang mờ nhạt giữa các hàng.
  - Cột hiển thị số lượng ngữ cảnh (`Contexts count`), click vào mở bung accordion xem các câu mẫu trích từ các bài Note khác nhau.

---

## 4. Danh Sách GitHub Repositories Tham Chiếu Thiết Kế (Design Reference Repositories)

Việc đính kèm trực tiếp các GitHub Repository hàng đầu vào tài liệu thiết kế là **cực kỳ hiệu quả đối với các mô hình AI (như Figma AI, Claude, GPT, v0.dev, Cursor)**. Vì AI đã được huấn luyện trên mã nguồn và Design System của các dự án này, việc chỉ định rõ ràng các repo sẽ giúp AI kích hoạt đúng các mẫu thiết kế tinh tế (Design Patterns) thay vì tự "bịa" ra phong cách công nghiệp generic:

| Tên Dự Án / Repository                    | Đường dẫn GitHub                                                                     | Yếu Tố AI Cần Tham Chiếu Cho Dự Án Này                                                                                                                                                                 |
| :---------------------------------------- | :----------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`steven-tey/dub`**                      | [https://github.com/steven-tey/dub](https://github.com/steven-tey/dub)               | **Bề mặt giấy ấm & Phân cấp thị giác**: Tham chiếu cách Dub xử lý nền giấy tự nhiên (`#FBFBFA`), các hộp thoại modal tối giản, thẻ bento grid sạch sẽ và thanh điều hướng thoáng đãng, không bị ngợp.  |
| **`shadcn-ui/ui`**                        | [https://github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui)                   | **Cấu trúc Component & Design Tokens chuẩn mực**: Tham chiếu kiến trúc Popover dịch từ, Dialog, Tabs, Tooltip và cách đặt tên biến token ngữ nghĩa (`background`, `surface`, `border`, `ring`).        |
| **`calcom/cal.com`**                      | [https://github.com/calcom/cal.com](https://github.com/calcom/cal.com)               | **Đường viền siêu mảnh (Hairline) & Typography**: Tham chiếu cách Cal.com sử dụng viền 1px mờ nhẹ kết hợp font chữ thanh mảnh, tạo cảm giác một ứng dụng cao cấp dành cho người dùng kỹ tính.          |
| **`magicuidesign/magicui`**               | [https://github.com/magicuidesign/magicui](https://github.com/magicuidesign/magicui) | **Tương tác xúc giác & Bento Grid phong cách Linear**: Tham chiếu hiệu ứng lật thẻ Flashcard 3D mượt mà, đường viền phát sáng nhẹ tự nhiên (Subtle Border Beam) và các micro-interactions cho nút bấm. |
| **`primer/react`** (GitHub Design System) | [https://github.com/primer/react](https://github.com/primer/react)                   | **Độ tương phản màu sắc & Khả năng đọc lâu (Accessibility)**: Tham chiếu cách phối màu các nhãn trạng thái (`Mastered`, `Learning`, `New`) để người học nhìn lâu không bị mỏi mắt.                     |

---

## 5. Hướng Dẫn Prompting Cho Figma AI / Designer

Bạn có thể sao chép đoạn prompt chuẩn hóa dưới đây kèm nội dung 4 file (`UX_old.md`, `UI_old.md`, `UX_new.md`, `UI_new.md`) để yêu cầu Figma AI hoặc Designer thiết kế lại toàn bộ hệ thống:

```text
PROMPT CHO FIGMA / DESIGN SYSTEM DESIGNER:

Tôi đang tái thiết kế (Redesign) toàn diện UI/UX cho ứng dụng Web học từ vựng tiếng Anh thông minh (Smart English Notes).
Dưới đây là 4 tài liệu đặc tả:
- UX_old.md: Luồng trải nghiệm hiện tại và các điểm nghẽn cần khắc phục.
- UI_old.md: Hệ thống màu sắc và component cũ (đang bị lỗi giao diện thô cứng, AI-generated generic slate).
- UX_new.md: Luồng trải nghiệm mới (kèm sơ đồ cây tính năng, luồng bôi đen đa ngữ cảnh, chia chặng ôn tập SRS).
- UI_new.md: Hệ thống Design System mới theo trường phái "Editorial Minimalism & Software-Craft Luxury".

THAM CHIẾU DESIGN PATTERNS TỪ CÁC GITHUB REPOSITORIES:
Hãy áp dụng phong cách thẩm mỹ và kiến trúc component từ các dự án mã nguồn mở sau:
1. steven-tey/dub (https://github.com/steven-tey/dub): Tham chiếu màu nền giấy ấm Paper Warm (#FBFBFA / #111215), card tối giản, layout thoáng đãng.
2. shadcn-ui/ui (https://github.com/shadcn-ui/ui): Tham chiếu component Popover dịch thuật, Dialog, Tooltip và Design Tokens chuẩn.
3. calcom/cal.com (https://github.com/calcom/cal.com): Tham chiếu đường viền siêu mảnh 1px hairline và typography sắc sảo.
4. magicuidesign/magicui (https://github.com/magicuidesign/magicui): Tham chiếu hiệu ứng thẻ Flashcard 3D xúc giác và micro-interactions kiểu Linear.
5. primer/react (https://github.com/primer/react): Tham chiếu bảng màu trạng thái nhã nhặn, đọc lâu không mỏi mắt.

YÊU CẦU THIẾT KẾ TRÊN FIGMA:
1. Phong cách Thẩm mỹ: Loại bỏ hoàn toàn phong cách Bootstrap/AI Dark Mode generic màu Slate #020617. Sử dụng bảng màu ấm áp: Paper Warm (#FBFBFA) cho Light mode và Deep Obsidian (#111215) cho Dark mode. Dùng đường viền hairline 1px bán trong suốt, typography kết hợp Serif thanh lịch (cho từ vựng) và Sans-serif sắc nét (cho UI chrome).
2. Thiết kế đầy đủ 5 Màn hình chính (Cả Light Mode & Dark Mode):
   - Screen 1: MainPage với Sidebar Leftbar (Topics/Notes) và Trình soạn thảo NotionEditor (kèm Popover dịch từ bôi đen đa ngữ cảnh và highlight gạch chân mờ).
   - Screen 2: Review Session (QuizEngine) với thẻ Flashcard 3D xúc giác, các phím tắt [Space], [1], [2], chế độ điền từ chính tả và màn hình Micro-Victory.
   - Screen 3: ResultPage với Bento Grid thống kê ngày học và Bảng tra cứu kho từ vựng cá nhân mở rộng ngữ cảnh.
   - Screen 4: KeySettingPage (Cấu hình API Key AI DeepSeek / Gemini với trạng thái test kết nối và chọn model).
   - Screen 5: ConflictResolverModal (Hộp thoại giải quyết xung đột đồng bộ 2 cột mượt mà).
3. Đóng gói đầy đủ Figma Component Set, Auto-layout, Design Tokens (Colors, Typography, Spacing 4px/8px grid) và Prototype tương tác lật thẻ/bôi đen dịch.
```
