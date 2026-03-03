# Use Case: AI Gọi Điện Tư Vấn Bán Hàng & Chăm Sóc (Inbound/Outbound)

> **Mục tiêu**: Giải phóng nhân sự khỏi các cuộc gọi lặp lại, đảm bảo 100% khách hàng được nghe máy tức thì và chăm sóc đúng kịch bản.

---

## 1. Insight & Vấn đề Cần Giải Quyết
- **Khách hàng**: Muốn được hỗ trợ ngay lập tức (Zero-wait time), ghét nghe nhạc chờ, ghét nhân viên ấp úng hoặc thái độ lồi lõm.
- **Doanh nghiệp**: Tốn chi phí telesale (lương + thưởng + chỗ ngồi) nhưng hiệu suất thấp (chỉ 10-20% cuộc gọi có người nghe). Mất kiểm soát chất lượng tư vấn.

---

## 2. UC-01: Inbound Tư vấn Sản phẩm (Tự động 24/7)
**Tình huống**: Khách gọi hotline lúc nửa đêm hoặc giờ cao điểm. Nhân viên bận/ngủ.
- **Giải pháp**: AI nghe máy ngay lập tức.
- **Luồng xử lý**:
  1.  AI chào hỏi + Xác định nhu cầu (Mua hàng/Khiếu nại/Hỏi thông tin).
  2.  AI tư vấn theo Kịch bản Sales (Chốt đơn/Hẹn lịch).
  3.  Nếu khách hỏi khó/cần người thật -> Chuyển tiếp (Handoff) + Gửi tóm tắt cuộc gọi cho nhân viên trực ca sau.
- **Lợi ích**: Không bỏ lỡ bất kỳ lead nào. Khách hàng ấn tượng vì sự chuyên nghiệp.

---

## 3. UC-02: Outbound Chăm sóc & Upsell (Chủ động)
**Tình huống**: Có danh sách 1000 khách cũ cần gọi mời mua lại (Resale) hoặc nhắc lịch hẹn. Telesale gọi không xuể, dễ nản.
- **Giải pháp**: AI tự động gọi theo danh sách được lọc từ CRM/OpenClaw.
- **Luồng xử lý**:
  1.  AI gọi + Xác nhận người nghe ("Alo, có phải chị Lan không ạ?").
  2.  AI vào đề (Ngắn gọn, đi thẳng vào lợi ích: "Em thấy gói dịch vụ của chị sắp hết hạn...").
  3.  Xử lý từ chối cơ bản ("Dạ em hiểu, nhưng bên em đang có ưu đãi X...").
  4.  Kết thúc: Chốt đơn/Hẹn gọi lại/Gửi Zalo thông tin chi tiết.
- **Lợi ích**: Lọc sạch danh sách rác. Nhân viên chỉ cần tập trung vào các khách "Say Yes". Tiết kiệm 80% thời gian gọi.

---

## 4. UC-03: Thu thập Feedback Sau Mua (Mới - Quan trọng)
**Tình huống**: Khách mua xong im lặng. Không biết họ hài lòng hay không để cải thiện. Gọi thủ công thì tốn kém.
- **Giải pháp**: AI gọi khảo sát nhanh (1-2 phút) sau 3-5 ngày nhận hàng.
- **Luồng xử lý**:
  1.  AI hỏi thăm trải nghiệm sử dụng ("Chị dùng kem chống nắng thấy sao ạ?").
  2.  **Phân tích Sentiment (Real-time)**:
      - Nếu Tích cực: "Dạ tuyệt quá! Chị nhớ dùng đều nhé. Em gửi tặng chị mã giảm giá 10% cho đơn sau qua Zalo ạ." -> **Upsell/Retention**.
      - Nếu Tiêu cực ("Bị dị ứng", "Giao sai hàng"): "Dạ em xin lỗi chị nhiều ạ. Em đã ghi nhận và báo bộ phận CSKH gọi lại xử lý cho chị ngay trong 15 phút nữa ạ." -> **Cứu vãn khách hàng (Churn Prevention)**.
  3.  Ghi âm + Transcript tự động đẩy về CRM/OpenClaw để báo cáo.
- **Lợi ích**: Đo lường được CSAT/NPS thực tế. Phát hiện sớm khủng hoảng truyền thông.

---

## 5. UC-04: Xử lý Lỗi & Sự cố (Technical)
- **Mục tiêu**: Đảm bảo trải nghiệm mượt mà dù mạng lag hay AI chậm.
- **Cơ chế**:
  - **Silence Detection**: Khách im lặng -> AI gợi ý ("Alo, chị còn đó không ạ?").
  - **Fallback**: Nếu AI lỗi/không hiểu -> Chuyển ngay sang nhạc chờ và nối máy cho nhân viên (kèm lời xin lỗi).
  - **Retry**: Gọi lại vào khung giờ khác nếu khách không bắt máy (tối đa 3 lần).

---

## 6. Yêu cầu Kỹ thuật & Data Flow
- **Input**: Số điện thoại, Tên khách, Lịch sử mua (từ CRM).
- **Process**: Twilio (Voice) <-> Gateway (Stream) <-> Deepgram (STT) <-> LLM (Brain) <-> ElevenLabs/OpenAI (TTS).
- **Output**: File ghi âm, Transcript (Văn bản), Nhãn hội thoại (Tag: Quan tâm/Giận dữ/Hẹn gọi lại).
