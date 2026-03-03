# Báo cáo Technical Due Diligence: Perplexity AI


## 📋 Thông tin Tổng quan (Executive Summary)
- **Phân loại Công nghệ**: AI-Powered Conversational Search Engine
- **Liên kết Chính thức**: https://www.perplexity.ai
- **Tech Stack**: Hệ sinh thái Transformer đa mô hình (Sonar độc quyền, GPT-4, Claude 3, Gemini), Kiến trúc phân tán (Distributed Architecture), Công cụ cào dữ liệu thời gian thực (Real-time Crawler).
- **Tác giả / Đơn vị chủ quản**: Perplexity AI (Thành lập bởi Aravind Srinivas, Denis Yarats, Johnny Ho, Andy Konwinski).
- **Business Use Case**: Nghiên cứu thị trường chuyên sâu, tổng hợp dữ liệu doanh nghiệp đa nguồn, thay thế hệ thống RAG nội bộ cho các tác vụ truy vấn thông tin cơ bản.
- **Lịch sử hình thành**: Khởi xướng tháng 08/2022. Sinh ra để giải quyết vấn đề của các cỗ máy tìm kiếm truyền thống: giảm thiểu quảng cáo rác và cung cấp câu trả lời có ngữ cảnh, đính kèm nguồn trích dẫn rõ ràng.
- **Khuyến nghị**: Chấp thuận có điều kiện (Conditional Approval).
- **Ngày đánh giá**: 2026-02-27

---

## 🧰 Các Tính năng Cốt lõi (Core Features)
- **Trích dẫn theo thời gian thực (Cited Answers)**: Trả về câu trả lời kèm theo nguồn kiểm chứng ngay tại thời điểm truy vấn. Giải quyết tận gốc vấn đề "ảo giác" (hallucination) vô căn cứ của nhóm LLM truyền thống.
- **Điều hướng Model linh hoạt (Hybrid Model Routing)**: Cho phép chuyển đổi linh hoạt thiết kế suy luận giữa các mô hình như Sonar, GPT-4, Claude 3. Loại bỏ điểm nghẽn vendor lock-in ở tầng mô hình ngôn ngữ.
- **Luồng công việc tự động (Perplexity Computer)**: Phối hợp đồng thời nhiều model (lên đến 19 models) để xử lý các phân đoạn công việc phức tạp như nghiên cứu sâu, thiết kế hình ảnh, lập trình.
- **Tổ chức dữ liệu (Spaces)**: Thiết lập không gian làm việc biệt lập theo dự án, cho phép gắn tài liệu nội bộ (PDF, CSV) làm ngữ cảnh.

---

## 🚦 Đánh giá Rủi ro & Mức độ Sẵn sàng (Readiness Scoring)
| Hạng mục Đánh giá            | Điểm (1-5) | Trạng thái | Đánh giá trọng tâm                                                                                  |
| :--------------------------- | :--------: | :--------: | :-------------------------------------------------------------------------------------------------- |
| **Market Viability**         |     5      | Chấp nhận  | Định giá 20 tỷ USD (09/2025). Nền tảng tài chính cực mạnh. Quỹ đạo phát triển rõ ràng.              |
| **Kiến trúc (Architecture)** |     4      | Chấp nhận  | High scalability. Hệ thống routing tự động. Nhược điểm: Phụ thuộc uptime của các model API đối tác. |
| **Bảo mật & Supply Chain**   |     3      |  Cảnh báo  | Gói miễn phí dùng dữ liệu để train. Cần nâng cấp Enterprise để đạt chuẩn bảo mật/SOC2.              |
| **Chi phí Tổng thể (TCO)**   |     5      | Tuyệt vời  | Thay thế hiệu quả chi phí xây dựng và bảo trì hạ tầng RAG nội bộ. Rẻ và sẵn sàng triển khai.        |
| **Đội ngũ (DX & Readiness)** |     5      | Tuyệt vời  | Không yêu cầu đường cong học tập (learning curve). API dễ tích hợp.                                 |

*Chú giải điểm số: 1 (Critical Risk / Rủi ro cao), 5 (Best-in-Class / Lựa chọn chiến lược)*

---

## 🔍 Đánh giá Chi tiết

### 1. Vị thế Thị trường & Mức độ bền vững (Market Viability)
- **Đơn vị hậu thuẫn (Backing)**: Được hỗ trợ tài chính bởi Nvidia, Jeff Bezos và các quỹ VC lớn hàng đầu. Định giá đạt 20 tỷ USD tính đến tháng 09/2025. Rủi ro phá sản bằng không trong ngắn và trung hạn.
- **Timeline Analysis**: 08/2022 (Thành lập) -> 2024 (Đạt 1 tỷ USD) -> 2025 (Doanh nghiệp hóa, ra mắt Perplexity Computer). Tốc độ ra mắt tính năng nhanh, đi đúng trọng tâm B2B.
- **Verified Use Cases**: 
  - Thay thế trực tiếp cho Google Search trong việc tổng hợp báo cáo ngành. Sử dụng bởi các nhà nghiên cứu, nhà báo, và các tổ chức cần rà soát pháp lý, tài chính diện rộng.
  - Tích hợp sâu trên thiết bị Samsung (Multi-Agent Ecosystem): Ghi nhận mới nhất (02/2026), Perplexity được nhúng thẳng vào hệ điều hành (OS level) của các dòng Galaxy mới (như S26 series). Việc "hợp tác song hành cùng Bixby" có sự phân vai rõ ràng: Bixby thao tác điều khiển phần cứng, trong khi Perplexity can thiệp đọc dữ liệu các ứng dụng lõi (Notes, Calendar, Gallery) để thực hiện tư duy, tìm kiếm và trả lời qua lệnh thoại riêng ("Hey Plex"). Sự kiện này biến Perplexity từ một ứng dụng web thành trình tìm kiếm mặc định trên hàng trăm triệu thiết bị phần cứng.
- **Sức mạnh Cộng đồng**: Không theo mô hình cộng đồng mã nguồn mở truyền thống, nhưng lượng người dùng Enterprise tăng vọt chứng minh nhu cầu thực tế thay vì hype công nghệ.

### 2. Kiến trúc & Hiệu năng cốt lõi (Architecture & Performance)
- **Triết lý Thiết kế**: Modular và Aggregator. Hệ thống tách biệt hoàn toàn giữa tác vụ bò dữ liệu mạng (web crawler) và LLM suy luận. Không phụ thuộc sống còn vào một LLM duy nhất.
- **Comparative Benchmarks**: Ở tốc độ trả kết quả nghiên cứu tổng hợp (Deep Research), độ trễ thấp hơn so với việc tự xây RAG nội bộ. Thông lượng truy xuất API ở mức cao và ổn định.

### 3. Bảo mật, Tuân thủ & Chuỗi cung ứng (Security & Supply Chain)
- **Phân tích Bảo mật**: Chưa ghi nhận CVE nghiêm trọng liên quan đến nền tảng. Có tranh cãi pháp lý về việc bộ cào dữ liệu (crawler) phớt lờ `robots.txt` của báo chí, nhưng đây là rủi ro pháp lý của nhà cung cấp, không phải của người sử dụng đầu cuối.
- **Transitive Risk**: Rủi ro lớn nhất là Single Point of Failure nếu OpenAI hoặc Anthropic gặp sự cố hệ thống diện rộng, ảnh hưởng đến tùy chọn sử dụng model cao cấp.

### 4. Phân tích Chi phí Tổng thể (TCO)
*(Thời điểm đánh giá: 02/2026)*
- **Initial Capex**: $0 (Không chi phí phần cứng, giấy phép ban đầu hay thời gian setup hạ tầng).
- **Ongoing Opex**:
  - Gói Enterprise Pro: $40/user/tháng ($480/năm).
  - Gói Enterprise Max: $325/user/tháng (Truy cập không giới hạn Labs và nghiên cứu sâu).
  - API (Sonar): $0.2 đến $5 trên 1 triệu token.
- **Chi phí Nhân sự**: Tại thị trường Việt Nam (02/2026), việc thuê một Kỹ sư AI/Data Senior để tự xây dựng và bảo trì một hệ thống RAG nội bộ có mức lương dao động từ 40,000,000 - 60,000,000 VNĐ/tháng. Đầu tư tài khoản Perplexity Enterprise ($40) là một phương án cắt giảm OPEX hiệu quả và giải phóng nguồn lực nhân sự. Zero training cost cho người dùng không thuộc team kỹ thuật.
- **Technical Debt Tax**: Thấp. Không cần di chuyển hạ tầng phức tạp nếu muốn ngừng sử dụng.

### 5. Trải nghiệm Developer & Năng lực Đội ngũ (Developer Experience - DX)
- **Time-to-Production**: Phút. Giao diện trực quan. Việc sử dụng API để tự động hóa nghiên cứu tích hợp mất chưa đến 1 tuần cho các kịch bản thực tế.
- **Tooling Maturity**: Documentation API rõ ràng, đầy đủ các chuẩn RESTful. Tích hợp sẵn trong các IDE chuẩn qua extension (hoặc sử dụng như trình duyệt chính thức qua Comet Browser).

---

## 🏗️ Phương án Phòng rủi ro (Mitigation Strategy)
- **Rò rỉ Dữ liệu Nhạy cảm nội bộ**: 
  - **Phương án**: TUYỆT ĐỐI KHÔNG cấp quyền cho nhân sự sử dụng bản Free/Pro cá nhân để tải lên (upload) mã nguồn tệp tin chứa dữ liệu bí mật kinh doanh, PII (Personally Identifiable Information). Bắt buộc phải triển khai gói Enterprise Pro để kích hoạt điều khoản cam kết "Không sử dụng dữ liệu để huấn luyện (No model training on customer data)" và có báo cáo tuân thủ SOC 2.
- **Ảo giác Liên đới (Citation Hallucination)**:
  - **Phương án**: Đưa vào quy trình SOP (Standard Operating Procedure): Mọi báo cáo tạo ra từ Perplexity khi gửi cho đối tác bên thứ 3 bắt buộc phải có một mắt xích con người đánh giá lại đường dẫn trích dẫn.

---

## 🎓 Kết luận & Khuyến nghị tổng thể
**Approve với điều kiện sử dụng phân quyền hợp lý.**

Về mặt cốt lõi, Perplexity giải quyết một vấn đề: Tốc độ xử lý thông tin. Trừ khi tổ chức của bạn sở hữu những luồng dữ liệu đóng cực kỳ khổng lồ cần RAG thiết kế riêng, còn lại, tự xây dựng RAG để tra cứu thông tin chung trên internet là một sự lãng phí tiền bạc và vòng đời dự án. 

Kiến trúc hybrid cho phép chuyển đổi model linh hoạt đảm bảo bạn không bao giờ bị khóa chặt (lock-in) vào năng lực của một nhà cung cấp LLM cụ thể. Chi phí bỏ ra là quá rẻ so với chi phí thời gian nghiên cứu thủ công chuẩn mực. Bắt tay vào làm và sử dụng bản Enterprise nếu có tải tài liệu bảo mật. Chấm dứt thảo luận dài dòng.

---

## 📚 Chú thích Từ khóa (Glossary)
- **TCO (Total Cost of Ownership)**: Tổng chi phí sở hữu, bao gồm mọi phí ngầm (bảo trì, nhân sự, rủi ro) thay vì chỉ tính giá mua ban đầu.
- **RAG (Retrieval-Augmented Generation)**: Cấu trúc kỹ thuật truy xuất dữ liệu ngoài nguồn để cung cấp thêm ngữ cảnh cho LLM trước khi tạo sinh câu trả lời.
- **Capex / Opex**: Chi phí đầu tư ban đầu (Capital Expenditure) và Chi phí vận hành thường xuyên (Operational Expenditure).
- **Vendor Lock-in**: Tình trạng phụ thuộc hoàn toàn vào công nghệ của một nhà cung cấp, chi phí chuyển đổi sang nền tảng khác quá lớn.
- **SOC 2**: Tiêu chuẩn đánh giá độc lập về kiểm soát bảo mật, tính khả dụng và bảo mật dữ liệu khách hàng.
