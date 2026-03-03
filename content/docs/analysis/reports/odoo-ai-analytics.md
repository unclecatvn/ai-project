# Đề xuất Triển khai AI Analytics cho Odoo (Mô hình Uber Finch)

## 1. Tổng quan & Mục tiêu
Dựa trên bài học từ hệ thống **Finch** của Uber, chúng ta sẽ xây dựng một **AI Data Analyst** cho hệ thống ERP Odoo. Mục tiêu là thay thế việc nhân sự phải xuất Excel thủ công hoặc chờ IT viết query, bằng việc hỏi đáp ngôn ngữ tự nhiên (Natural Language to SQL).

- **Mô hình tham chiếu**: Uber Finch (Multi-Agent Text-to-SQL).
- **Hệ thống đích**: Odoo ERP (PostgreSQL).
- **Công cụ triển khai**: Dify (Orchestrator) + n8n (Integrator) + PostgreSQL Views.

---

## 2. Kiến trúc Ánh xạ: Từ Uber sang Odoo

Để áp dụng thành công, chúng ta cần "phiên dịch" các thành phần kỹ thuật của Uber sang môi trường Odoo:

| Thành phần Uber | Giải pháp tương ứng cho Odoo | Giải thích |
| :--- | :--- | :--- |
| **Data Flattening** | **PostgreSQL Views / Materialized Views** | Thay vì để AI join 10 bảng Odoo (`sale_order`, `sale_order_line`, `res_partner`...), ta tạo 1 View phẳng `report_doanh_thu_tong_hop`. |
| **Semantic Search** | **Dify Knowledge Base (RAG)** | Lưu trữ metadata: "Doanh thu" = cột `amount_total`, "Khách nợ" = cột `amount_residual` trong bảng `account_move`. |
| **Supervisor Agent** | **Dify Agent (Router)** | Phân loại câu hỏi: Đây là câu hỏi về "Kho", "Bán hàng" hay "Kế toán" để chọn bảng dữ liệu phù hợp. |
| **SQL Writer** | **LLM (Claude 3.5 Sonnet / GPT-4o)** | Viết câu lệnh SQL dựa trên Schema của View đã được làm phẳng. |
| **Self-Correction** | **n8n Workflow** | Nếu SQL lỗi, n8n gửi mã lỗi lại cho LLM để viết lại query mới (Loop). |

---

## 3. Luồng nghiệp vụ xử lý (Business Flow)

### Bước 1: Tiếp nhận & Phân loại (Supervisor)
- **User (trên Slack/Tele/Zalo)**: "Cho anh xem doanh thu top 5 khách hàng tháng này."
- **AI Router**: Nhận diện từ khóa "doanh thu", "khách hàng" -> Điều hướng sang **Sales Analyst Agent**.

### Bước 2: Tra cứu Ngữ nghĩa (Semantic Context)
- AI không query trực tiếp vào bảng `res_partner`. Nó tra cứu từ điển dữ liệu (Data Dictionary):
  - *Context*: "Doanh thu" trong Odoo là tổng tiền các invoice đã `posted` (vào sổ), loại `out_invoice`.
  - *Mapping*: Cần query vào View `v_sales_analysis_flat`.

### Bước 3: Tạo & Thực thi SQL (SQL Generation)
- **Prompt**: "Viết query lấy `partner_name`, sum(`amount_untaxed`) từ `v_sales_analysis_flat` where `date` trong tháng hiện tại, group by `partner_name`, order by desc limit 5."
- **Execution**:
  - Hệ thống chạy lệnh SQL với user **Read-only** (để đảm bảo an toàn, không được phép DELETE/UPDATE).
  - **Cơ chế Self-Correction**: Nếu Odoo báo lỗi (VD: sai tên cột), Agent tự đọc lỗi và sửa lại query ngay lập tức (trong < 3s).

### Bước 4: Trả kết quả & Visualizing
- Trả về Text: "Top 1 là Công ty ABC với 500tr..."
- Trả về File: Link tải file CSV/Excel chi tiết.
- Trả về Chart (Nâng cao): Vẽ biểu đồ cột ngay trong chat.

---

## 4. Chiến lược "Làm phẳng dữ liệu" (Data Flattening Strategy)

Đây là **chìa khóa thành công** của Uber. Odoo có hàng nghìn bảng, nếu ném cả Schema vào LLM, nó sẽ bị "ảo giác". Chúng ta cần tạo lớp trung gian.

### Ví dụ: Bài toán Báo cáo Bán hàng
Thay vì bắt AI join: `sale_order` + `sale_order_line` + `product_product` + `product_template` + `res_partner` + `crm_team`.

Chúng ta tạo **SQL View** `v_ai_sales_report`:
```sql
CREATE VIEW v_ai_sales_report AS
SELECT
    so.name as order_ref,
    rp.name as customer_name,
    pt.name as product_name,
    sol.product_uom_qty as quantity,
    sol.price_subtotal as revenue,
    so.date_order as order_date,
    ct.name as sales_team
FROM sale_order_line sol
JOIN sale_order so ON sol.order_id = so.id
JOIN res_partner rp ON so.partner_id = rp.id
-- ... các join khác
WHERE so.state = 'sale';
```

**Lợi ích**:
1.  **AI dễ hiểu**: Chỉ cần `SELECT * FROM v_ai_sales_report WHERE customer_name ILIKE '%ABC%'`.
2.  **Bảo mật**: View chỉ chứa các cột được phép công khai, ẩn các cột nhạy cảm (giá vốn, lợi nhuận gộp).
3.  **Tốc độ**: Có thể chuyển thành Materialized View và refresh định kỳ để query cực nhanh.

---

## 5. Kế hoạch triển khai (Implementation Plan)

### Giai đoạn 1: Xây dựng nền móng (2 tuần)
1.  **Hạ tầng**: Tạo user PostgreSQL `read_only_user`.
2.  **Data Flattening**: Tạo 3 Views cốt lõi:
    - `v_ai_sales` (Bán hàng).
    - `v_ai_inventory` (Tồn kho).
    - `v_ai_debt` (Công nợ).
3.  **Prompt Engineering**: Viết System Prompt cho Dify, cung cấp schema của 3 views trên.

### Giai đoạn 2: Tích hợp & Human-in-the-loop (2 tuần)
1.  **n8n Workflow**: Kết nối Chatbot -> Dify -> PostgreSQL -> Trả kết quả.
2.  **Testing**: Chạy bộ test "Golden Queries" (các câu hỏi mẫu đã biết trước đáp án) để tinh chỉnh độ chính xác.
3.  **Feedback Loop**: Thêm nút "Báo cáo sai" dưới mỗi câu trả lời của AI để nhân viên log lại lỗi cho team kỹ thuật sửa.

### Giai đoạn 3: Mở rộng (Multi-Agent)
1.  Tách Agent chuyên biệt: Agent Kế toán riêng, Agent Kho riêng.
2.  Tích hợp Chart/Graph visualization.

---

## 6. Rủi ro & Giải pháp (Mitigation)

| Rủi ro | Giải pháp |
| :--- | :--- |
| **Bảo mật dữ liệu** | Chỉ dùng user Read-only. Áp dụng Row-Level Security (RLS) nếu cần phân quyền theo Sale Team. |
| **SQL chậm/treo DB** | Set `statement_timeout` cho user AI là 5s. Chỉ query trên View hoặc Replica DB. |
| **AI "bịa" số liệu** | Buộc AI phải giải thích logic ("Tôi lấy số liệu từ bảng X, cột Y"). Luôn cung cấp link file raw data để đối chiếu. |

---

## 7. Kết luận

Mô hình Uber Finch hoàn toàn khả thi với Odoo nếu chúng ta áp dụng đúng chiến lược **Data Flattening**. Thay vì kỳ vọng AI hiểu hết 5000 bảng của Odoo, chúng ta "dọn cỗ" sẵn bằng các SQL Views sạch sẽ.

Kết quả: Sếp có thể hỏi "Doanh thu tuần này thế nào?" và nhận câu trả lời chính xác trong 3 giây thay vì chờ báo cáo vào thứ Hai tuần sau.
