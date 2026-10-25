# HƯỚNG DẪN CĂN CHỈNH & SỬA LỖI FRONTEND THEO BACKEND MỚI (`be-alignment.md`)

## Dự án: Smart English Notes (`learning_english_fe`)

### Căn cứ theo: [`api-contract.md`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_be/docs/api-contract.md) v2.1.0 & Quyết định Đợt 2 trong [`answer.md`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_be/docs/answer.md)

---

## 📌 TỔNG QUAN

Tài liệu này tổng hợp **12 nhiệm vụ sửa lỗi và căn chỉnh cụ thể (F1 $\rightarrow$ F12)** trên Frontend `learning_english_fe` nhằm đảm bảo hệ thống Local-First hoạt động ăn khớp 100% với Backend mới, chấm dứt việc mất dữ liệu, lệch số liệu thống kê hoặc lỗi kết nối.

---

## 📋 DANH SÁCH 12 NHIỆM VỤ CỤ THỂ

---

### 1. [F1] Chuẩn hóa Enum `mode` trong Luồng Ôn tập

- **Vị trí**:
  - [`components/review/ReviewPage.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/review/ReviewPage.tsx#L27)
  - [`services/review.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/review.ts#L75)
- **Vấn đề**: FE đang truyền nhãn hiển thị `"Flashcards"` hoặc `"Fill in the blank"` lên Backend. Backend quy định enum chuẩn: `"FLASHCARD"` hoặc `"FILL_BLANK"`.
- **Cách sửa**:

  ```ts
  // types/review.ts
  export type ReviewMode = "FLASHCARD" | "FILL_BLANK";

  // Khi gọi submit từ ReviewPage:
  const apiMode: ReviewMode =
    mode === "Flashcards" ? "FLASHCARD" : "FILL_BLANK";
  await submitReviewCardApi(currentCard.id, ok, apiMode);
  ```

---

### 2. [F2] Hiển thị Huy hiệu Số Từ Đến Hạn (`dueCount`) Chuẩn xác

- **Vị trí**: [`components/layout/AppShell.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/layout/AppShell.tsx#L166)
- **Vấn đề**: `setDueCount(dueCards.length)` luôn bị chặn tối đa ở 15 vì `fetchDueCardsApi(15)` chỉ tải 15 từ. Khi người dùng có 40 từ đến hạn, badge vẫn chỉ hiện `15 due`.
- **Cách sửa**:
  - Đọc `dueCount` từ `counters.dueCount` trả về bởi `GET /api/auth/me` hoặc `GET /api/sync/counters`.
  - Khi offline, đếm toàn bộ số từ đến hạn từ Dexie:
    ```ts
    const todayStr = getLocalDateString();
    const count = await db.words
      .filter((w) => !w.nextReviewAt || w.nextReviewAt <= todayStr)
      .count();
    setDueCount(count);
    ```

---

### 3. [F3] Loại bỏ Đệm Từ Chưa Đến Hạn trong Fallback Ôn tập Cục bộ

- **Vị trí**: [`services/review.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/review.ts#L40-L46)
- **Vấn đề**: Đoạn code `if (needed > 0) { dueWords.push(...extraWords); }` đang tự ý lấy cả những từ chưa đến hạn để nhét vào danh sách ôn tập. Điều này làm sai lệch chu kỳ lặp lại ngắt quãng (SRS) của người dùng.
- **Cách sửa**:
  - Xóa bỏ hoàn toàn đoạn `needed > 0` và `extraWords`. Nếu chỉ có 3 từ đến hạn, chặng học chỉ gồm đúng 3 từ. Nếu có 0 từ đến hạn, hiển thị màn hình _"All caught up"_.

---

### 4. [F4] Chuẩn hóa Múi giờ Địa phương (Local Timezone Date String)

- **Vị trí**:
  - [`services/review.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/review.ts#L28)
  - [`services/words.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/words.ts#L59)
  - [`services/progress.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/progress.ts#L98)
- **Vấn đề**: Sử dụng `new Date().toISOString().split("T")[0]` sẽ lấy ngày theo giờ **UTC**. Tại Việt Nam (UTC+7), người dùng học từ lúc 00:00 đến 06:59 sáng sẽ bị tính là ngày hôm qua, gây đứt streak hoặc sai ngày ôn tập.
- **Cách sửa**: Tạo utility hàm lấy ngày theo giờ địa phương:
  ```ts
  // lib/dateUtils.ts
  export function getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  ```

---

### 5. [F5] Dọn dẹp Dữ liệu Giả và Ràng buộc Số liệu Thật trên Trang Progress

- **Vị trí**:
  - [`components/progress/ProgressPage.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/progress/ProgressPage.tsx#L98-L101)
  - [`services/progress.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/progress.ts#L101-L135)
- **Vấn đề**:
  - `ProgressPage.tsx` đang hardcode `/ 20` thay vì hiển thị `dailyTarget` thực tế từ server.
  - `services/progress.ts` dùng dữ liệu giả: `(i % 7 < 4 && i < 28) || count > 0`, `isCurrent = i === 28`, `newAddedCount = Math.max(0, allWords.length - 20)`, streak cố định = 4.
- **Cách sửa**:
  - `ProgressPage.tsx`: Thay `/ 20` bằng `<em>/ {dailyTarget || 20}</em>`.
  - Thay đổi nhãn _"added recently"_ thành _"added today"_.
  - `services/progress.ts`: Đọc trực tiếp response từ `GET /api/progress/dashboard` (các trường đã được Backend v2.1 chuẩn hóa: `accuracyPercent`, `reviewedToday`, `dailyTarget`, `wordsAddedToday`, `totalWords`, `streakDays`, `distribution`, `activityCalendar`).

---

### 6. [F6] Bảo mật API Key: Tuyệt đối Không Lưu Plaintext Key ở Client

- **Vị trí**: [`services/ai-settings.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/ai-settings.ts#L73-L74)
- **Vấn đề**: Hàm `saveAiSettingsApi` đang ghi nguyên cả `apiKey` vào `localStorage` và Dexie `configs`. Điều này vi phạm nghiêm trọng NFR bảo mật (§6.4 của BRD).
- **Cách sửa**:
  - Sau khi gửi `PUT /api/ai-settings` lên server (được mã hóa AES-256 trên DB Backend), Client chỉ lưu các thông tin phi nhạy cảm: `provider`, `customBaseUrl`, `translationModel`, `quizModel`, `chatModel`, `hasApiKey: true`.
  - Xóa trường `apiKey` khỏi payload lưu vào `localStorage` / Dexie.

---

### 7. [F7] Sinh UUIDv7 trên Client & Idempotent Upsert cho Topic/Note

- **Vị trí**:
  - [`services/topics.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/topics.ts#L42-L54)
  - [`services/notes.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/notes.ts#L65-L81)
- **Vấn đề**: FE tạo UUID tạm rồi gửi POST; nếu Backend trả về ID khác, FE xóa ID cũ và thay ID mới nhưng không cập nhật `topicId` trên các Note $\rightarrow$ các Note bị mồ côi.
- **Cách sửa**:
  - Cài đặt hàm sinh UUIDv7 chuẩn RFC 9562 trên Client (dùng timestamp 48-bit + random 74-bit).
  - Khi tạo Topic hoặc Note mới, gửi luôn `id: newUuidV7` trong body của `POST /api/topics` và `POST /api/notes`.
  - Backend đã hỗ trợ idempotent theo `id`, xóa bỏ hoàn toàn đoạn code xóa/đổi ID sau khi gọi API.

---

### 8. [F8] Quản lý Phiên bản Note (`baseVersion` vs Server `@Version`)

- **Vị trí**: [`services/notes.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/notes.ts#L51)
- **Vấn đề**: FE tự ý tăng `version = (existing?.version || 0) + 1`. Trong kiến trúc phân tán, Server là nơi duy nhất quản lý số `version`.
- **Cách sửa**:
  - Đổi tên trường trong Dexie thành `serverVersion`. Khi người dùng sửa Note, giữ nguyên `serverVersion`.
  - Khi gửi `PUT /api/notes/{id}` hoặc sync, gửi `baseVersion: note.serverVersion`. Khi Backend trả về thành công với `version` mới, cập nhật lại `serverVersion = serverData.version`.

---

### 9. [F9] Nâng cấp sang Delta Sync & Khắc phục Mất Dữ liệu

- **Vị trí**: [`lib/syncManager.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/lib/syncManager.ts#L71-L125)
- **Vấn đề**:
  - Đang gọi `POST /api/sync/batch` cũ và gọi `db.*.clear()` $\rightarrow$ **xóa sạch cơ sở dữ liệu cục bộ**, mất trắng các thay đổi chưa kịp sync nếu có thao tác phát sinh trong lúc đang gửi request.
  - Bỏ quên hoàn toàn bảng `wordContexts` và `reviewLogs` khi sync.
- **Cách sửa**:
  - Đổi endpoint sang `POST /api/sync/delta` (theo đặc tả mục 7 trong [`api-contract.md`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_be/docs/api-contract.md)).
  - Bổ sung `wordContexts` và `reviewEvents` vào payload.
  - Xóa bỏ hoàn toàn lệnh `.clear()`; sử dụng `db.*.bulkPut()` để upsert dữ liệu mới.
  - Xử lý mảng `tombstones` trả về từ server để xóa các bản ghi đã bị xóa trên thiết bị khác.
  - Cập nhật `idRemap` khi có từ vựng bị gộp ID.

---

### 10. [F10] Thực Thi Nguyên Tắc Một Đường Ghi (Single-Write Path)

- **Vị trí**:
  - [`services/words.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/words.ts#L106-L125)
  - [`services/notes.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/notes.ts#L57-L65)
  - [`services/topics.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/topics.ts#L39-L42)
- **Vấn đề**: Client đang vừa ghi vào `syncQueue` vừa gọi trực tiếp REST API cho cùng một thay đổi. Sau đó Sync Worker lại gửi lại lần 2 $\rightarrow$ rủi ro xử lý đôi (double mutation).
- **Cách sửa**:
  - Áp dụng Local-First chuẩn: Thao tác CRUD luôn ghi vào Dexie và đưa vào `syncQueue`.
  - Để `syncManager` (debounce 1.5s hoặc chạy ngầm) đảm nhiệm việc đẩy `syncQueue` lên Server qua `/api/sync/delta`. Không gọi REST song song cho cùng 1 thay đổi dữ liệu.

---

### 11. [F11] Cảnh báo Cascade Delete khi Xóa Topic

- **Vị trí**: [`components/modals/ManageModal.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/modals/ManageModal.tsx)
- **Vấn đề**: Theo quy định mới, xóa Topic sẽ cascade soft-delete toàn bộ các Note bên trong Topic đó.
- **Cách sửa**:
  - Khi người dùng bấm xóa Topic, hộp thoại xác nhận cần hiển thị rõ: _"Xóa chủ đề này sẽ xóa toàn bộ [X] bài viết bên trong. Các câu ngữ cảnh từ vựng đã thu thập vẫn được lưu giữ an toàn."_

---

### 12. [F12] Đấu Nối API Thật cho AI Dịch Ngữ Cảnh, AI Settings & Chat SSE

- **Vị trí**:
  - [`components/popovers/WordPopover.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/popovers/WordPopover.tsx#L51-L76)
  - [`services/ai-settings.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/ai-settings.ts#L96-L110)
  - [`services/chat.ts`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/services/chat.ts#L88-L107) & [`ChatWorkspace.tsx`](file:///Users/hieuquockieu/Desktop/workspace/learning%20english/learning_english_fe/components/chat/ChatWorkspace.tsx)
- **Vấn đề**: Tàn dư của bản prototype demo (dùng bảng `dictionary` cố định, `setTimeout` giả lập test kết nối, `sampleReply` giả vờ trả lời thay AI).
- **Cách sửa**:
  1. **`WordPopover.tsx`**: Gọi API thật `POST /api/ai/translate-context` với payload `{ text, sentence, noteId, noteTitle }`. Nếu mất mạng hoặc lỗi mới hiển thị ô nhập tay _"Enter manually"_.
  2. **`services/ai-settings.ts`**:
     - Bổ sung provider `"9ROUTER"` và `"OPENAI"`.
     - Thêm trường `chatModel` và đổi `baseUrl` thành `customBaseUrl`.
     - Gọi API thật `POST /api/ai-settings/test` để kiểm tra kết nối tới 9Router gateway.
  3. **`services/chat.ts` & `ChatWorkspace.tsx`**:
     - Tải lịch sử hội thoại thật từ `GET /api/chat/conversations` và `GET .../{id}/messages`.
     - Gọi `POST /api/chat/send` và đọc stream qua `response.body.getReader()` (SSE reader), cập nhật chữ chạy dần ra giao diện thời gian thực thay vì gọi `res.json()`.
     - Khi offline: Khóa ô chat và hiển thị thông báo rõ ràng _"AI Chat yêu cầu kết nối mạng"_, không giả vờ trả lời câu mẫu.
