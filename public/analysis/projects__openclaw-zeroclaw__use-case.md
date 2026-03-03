# OpenClaw - Use Case: Automation & Data Intelligence Cho Sales/Ops

> **Mục tiêu**: Kết nối mọi điểm chạm (Touchpoints) thành một bức tranh toàn cảnh về khách hàng. Cung cấp dữ liệu "sống" (Live Data) để ra quyết định kinh doanh tức thì.

---

## 1. Insight & Vấn đề Cần Giải Quyết
- **Nhân viên**: "Sợ" nhập liệu CRM, làm báo cáo thủ công mất thời gian, dễ sai sót. Quên chăm sóc khách hàng cũ.
- **Lãnh đạo**: Cần nhìn thấy "Sức khỏe doanh nghiệp" (Business Health) mỗi ngày, không phải chờ cuối tháng. Cần biết khách hàng đang nói gì về sản phẩm.

---

## 2. UC-01: Tóm Tắt & Chấm Điểm Khách Hàng (Lead Scoring & Summary)
**Tình huống**: Sales nhận lead mới nhưng không biết khách này là ai, nhu cầu gì, lịch sử ra sao.
- **Giải pháp**: OpenClaw tự động tổng hợp thông tin trước khi cuộc gọi bắt đầu.
- **Quy trình**:
  1.  **Trigger**: Lead mới đổ về CRM hoặc Sales gõ lệnh chat "Tóm tắt khách Nguyễn Văn A".
  2.  **Action**:
      - Quét toàn bộ lịch sử Call (Transcript), Chat (Message), Web Visit.
      - **AI Analysis**: Tóm tắt nhu cầu chính ("Khách cần mua gấp tặng vợ 8/3", "Khách hay phàn nàn giá ship").
      - **Lead Score**: Chấm điểm tiềm năng (Hot/Warm/Cold) dựa trên hành vi.
  3.  **Output**: Gửi tin nhắn tóm tắt qua Telegram/Slack cho Sales ("Khách A đang rất quan tâm, nên chốt ngay. Lưu ý: Freeship.").
- **Lợi ích**: Sales tự tin hơn, chốt deal nhanh hơn (Time-to-close giảm 50%).

---

## 3. UC-02: Auto Onboarding & CSKH Tự Động (Zero-touch Ops)
**Tình huống**: Khách chốt đơn xong. Sales phải manual: tạo account, gửi mail welcome, add Zalo, nhắc lịch... Rất dễ quên.
- **Giải pháp**: OpenClaw tự động hóa 100% quy trình sau bán.
- **Quy trình**:
  1.  **Trigger**: Deal chuyển trạng thái "Won" trên CRM.
  2.  **Action**:
      - Tạo Account trên hệ thống quản trị.
      - Gửi Email Welcome cá nhân hóa ("Chào anh A, mừng anh gia nhập...").
      - Add vào nhóm Zalo chăm sóc riêng.
      - Đặt lịch Reminder cho CSKH gọi lại sau 3 ngày.
  3.  **Output**: Thông báo "Onboarding Success" cho cả Khách và Sales.
- **Lợi ích**: Không bao giờ bỏ sót khách hàng. Trải nghiệm chuyên nghiệp chuẩn 5 sao.

---

## 4. UC-03: Phân Tích Feedback & Báo Cáo Sentiment (Voice of Customer)
**Tình huống**: Sếp hỏi "Tại sao doanh số tuần này giảm?". Không ai trả lời được chính xác.
- **Giải pháp**: OpenClaw lắng nghe và phân tích "Tiếng nói khách hàng" (VoC).
- **Quy trình**:
  1.  **Trigger**: Định kỳ hàng ngày/tuần.
  2.  **Action**:
      - Quét toàn bộ Call Transcript và Chat Log.
      - **AI Analysis**: Đếm số lần xuất hiện từ khóa tiêu cực ("đắt", "xấu", "hỏng", "thái độ").
      - Phân tích nguyên nhân gốc rễ (Root Cause Analysis): "50% phàn nàn do shipper khu vực X giao chậm".
  3.  **Output**: Dashboard trực quan + Cảnh báo đỏ nếu chỉ số tiêu cực vượt ngưỡng.
- **Lợi ích**: Phát hiện vấn đề vận hành/sản phẩm ngay lập tức để khắc phục.

---

## 5. UC-04: Salesforce/CRM ChatOps (Thao tác trong 1 nốt nhạc)
**Tình huống**: Sales đi gặp khách, lười mở máy tính cập nhật CRM. Dữ liệu bị delay.
- **Giải pháp**: Chat trực tiếp với Bot OpenClaw để update CRM.
- **Quy trình**:
  1.  Sales chat: "Vừa gặp khách B, họ chốt deal 50tr nhé. Update giúp anh."
  2.  OpenClaw (AI) hiểu ý định -> Gọi API CRM -> Cập nhật trạng thái Deal -> Log Note cuộc họp.
  3.  Phản hồi: "Done anh nhé! Đã update Deal 50tr. Chúc mừng team!".
- **Lợi ích**: Dữ liệu CRM luôn real-time (Tươi sống). Sales rảnh tay đi kiếm tiền.

---

## 6. UC-05: AI Gọi Điện Xác Nhận Sự Kiện (Event Confirmation)
- **Tình huống**: Tổ chức hội thảo 500 người. Gọi xác nhận từng người là cực hình.
- **Giải pháp**: OpenClaw + Voice AI tự động gọi xác nhận.
- **Quy trình**:
  1.  **Trigger**: Trước sự kiện 2 ngày.
  2.  **Action**: AI gọi 500 khách trong 1 giờ.
      - "Chào anh A, anh có tham gia hội thảo X vào thứ 7 này không ạ?"
      - Nếu "Có": Gửi vé QR Code qua Zalo ngay lập tức.
      - Nếu "Bận": Note lại lý do, không gửi vé.
  3.  **Output**: Danh sách Final Guest List sạch sẽ.
- **Lợi ích**: Tiết kiệm 100 giờ gọi điện. Tỷ lệ tham gia thực tế tăng cao.
