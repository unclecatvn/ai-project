# Use Case: Chatbot AI Chăm Sóc Khách Hàng (Đa kênh: Messenger/Zalo/Web)

> **Mục tiêu**: Thay thế Chatbot cũ "vô tri" bằng AI Agent thực thụ. Hiểu khách hàng, tư vấn đúng trọng tâm, chốt sale nhẹ nhàng.

---

## 1. Insight & Vấn đề Cần Giải Quyết
- **Khách hàng**: Muốn chat như người thật ("Chào chị Lan" chứ không phải "Chào bạn"), nhớ lịch sử mua ("Em thấy chị đã dùng 2 lọ..."), ghét câu trả lời máy móc.
- **Doanh nghiệp**: Tốn quá nhiều nhân lực trực page. Chatbot cũ (Botcake) không chốt được đơn. Mất khách vì phản hồi chậm.

---

## 2. UC-01: Onboarding Tự động Sau mua (Sale -> Retention)
**Tình huống**: Khách mua xong, không biết dùng, chán nản rồi bỏ.
- **Giải pháp**: AI tự động nhắn tin hướng dẫn sử dụng (HDSD) sau khi nhận hàng.
- **Luồng xử lý**:
  1.  **D+0 (Ngày nhận hàng)**: Gửi lời cảm ơn + Video HDSD ngắn gọn + Lưu ý quan trọng ("Da chị nhạy cảm thì dùng lượng bằng hạt đậu thôi nhé.").
  2.  **D+3 (Ngày dùng thử)**: Hỏi thăm trải nghiệm ("Chị dùng thấy sao rồi ạ? Da có châm chích gì không?").
  3.  **D+7 (Ngày đánh giá)**: Khen ngợi khách hàng chăm chỉ ("Em thấy chị kiên trì dùng đều quá ạ. Da chị chắc chắn sẽ đẹp lên thôi!").
- **Lợi ích**: Tăng sự gắn kết (Engagement). Khách hàng cảm thấy được quan tâm chứ không bị bỏ rơi.

---

## 3. UC-02: Phân luồng Sale/Resale (Tư vấn đúng người)
**Tình huống**: Chatbot cũ gửi kịch bản "Chào bạn mới" cho "Khách hàng thân thiết" -> Mất cảm tình.
- **Giải pháp**: Dify + n8n tự động nhận diện khách hàng.
- **Luồng xử lý**:
  1.  **Khách Mới (Lead)**: Kịch bản tập trung vào USP sản phẩm, cam kết hiệu quả, chốt đơn thử dùng.
  2.  **Khách Cũ (Resale)**: Kịch bản hỏi thăm sức khỏe, nhắc lịch tái khám/tái mua ("Sắp hết liệu trình rồi chị ơi"). Gợi ý sản phẩm bổ sung (Cross-sell: "Chị dùng kem rồi, giờ thêm serum nữa là đẹp").
  3.  **Khách Vip**: Kịch bản chăm sóc đặc biệt, ưu đãi riêng ("Riêng chị Lan hôm nay em tặng thêm...").
- **Lợi ích**: Tăng tỷ lệ chuyển đổi (Conversion Rate). Tối ưu CLV (Giá trị trọn đời khách hàng).

---

## 4. UC-03: Xử lý Khiếu nại & Feedback (New - Critical)
**Tình huống**: Khách phàn nàn trên Chat. Chatbot cũ cứ "Cảm ơn bạn đã phản hồi" mãi. Khách điên tiết.
- **Giải pháp**: AI nhận diện cảm xúc tiêu cực và phản ứng khôn ngoan.
- **Luồng xử lý**:
  1.  **Sentiment Analysis**: AI phát hiện từ khóa "ghét", "lừa đảo", "không hiệu quả", "thái độ".
  2.  **Hành động tức thì**:
      - AI xin lỗi chân thành ("Dạ em rất xin lỗi chị vì trải nghiệm không tốt này ạ. Em hiểu cảm giác của chị lúc này.").
      - AI ngừng kịch bản bán hàng.
      - **Handoff (Chuyển người thật)**: Gửi thông báo khẩn cấp cho Quản lý/Trưởng ca trực vào xử lý ngay.
  3.  **Sau khi xử lý**: AI gửi tin nhắn follow-up xác nhận khách đã hài lòng chưa.
- **Lợi ích**: Ngăn chặn khủng hoảng truyền thông (Crisis Management). Giữ chân khách hàng khó tính.

---

## 5. UC-04: Tư vấn Ngoài Kịch bản (Context-aware FAQ)
- **Tình huống**: Khách hỏi câu "trên trời dưới biển" không có trong kịch bản mẫu.
- **Giải pháp**: Dify sử dụng RAG (Kiến thức doanh nghiệp) để trả lời.
- **Cơ chế**:
  - Tra cứu tài liệu nội bộ (PDF, Word, Web).
  - Trả lời đúng trọng tâm ("Thành phần này bầu dùng được không em?" -> AI tra cứu bảng thành phần và trả lời "Dạ được ạ, vì nó chiết xuất từ thiên nhiên...").
  - Nếu không chắc chắn: "Dạ câu này chuyên sâu quá, để em hỏi Bác sĩ rồi nhắn lại chị ngay nhé." (Trung thực).

---

## 6. Data Flow & Integration
- **Input**: Message từ Facebook/Zalo/Web.
- **Process**: n8n (Webhook) -> Dify (LLM Reasoning + Memory) -> CRM (Check Info) -> n8n (Gửi tin nhắn).
- **Output**: Câu trả lời tự nhiên, đúng ngữ cảnh. Task trên CRM (nếu cần follow-up).
