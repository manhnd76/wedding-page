# Request - 20261007-wedding-page

> Nguyên văn yêu cầu của người dùng (2026-10-07). File tham khảo đính kèm: `E:\claudecode\wedding-site\data\config.js` (dự án cũ `E:\claudecode\wedding-site`, chỉ để tham khảo).

phase này chưa cần code, hãy cùng solution-designer và ui-ux bàn về giải pháp.

t có ý tưởng:
xây dựng 1 website landing page cho thiệp mời cưới - wedding-page
Yêu cầu:

* 100% webappp, k cần backend
* webapp gồm 2 phần
   * webapp cho người dùng vào - xem thiệp
   * trang admin cho phép cấu hình (sẽ nói rõ hơn ở bên dưới)
* Phần webapp thiệp mời:
   * tập trung chú trong ui-ux, đặc biệt trên thiết bị moblie
   * tất cả thông tin trên web đều được đưa ra cấu hình (*) có thể tham khảo file config.js đính kèm
   * giao diện chia thành từng section -> dễ dàng cấu hình on/off
   * có âm nhạc
   * vào trang web đầu tiên nên là giao diện như thiệp mời, sau khi ấn mở thiệp thì tới trang landding page (1)
   * chọn font chữ đáp ứng tốt tiếng việt phù hợp cho thiệp cưới
   * Tên khách mời riêng theo từng đường link dạng query (phục vụ cho (1))
```
https://wedpage.com/?to=gia-đình-anh-Mạnh
```
→ hiển thị: **Gia đình anh Mạnh**
   * ưu tiên nhiều animation trên giao diện
   * 1 trang có thể tham khảo: https://thiepmoicuoi.vn/thiep/tran-hieu-tran-dung-sugar/moi/gd-ac-manh-huong
* Trang admin pannel:
   * cho phép cấu hình trang webapp
   * được phép chỉnh sửa tất cả cấu hình như: theme, fonts, màu chủ đạo, animation, thông tin text hiển thị, các section hiển thị,
   * Chỉnh sửa ảnh: upload ảnh lên asset của web luôn -> có thể chấp nhận ghi đè ảnh cũ, nếu có thể thì ghi đè ảnh và để lại 1 ảnh backup - nếu đc thì thêm nút restore lại phiên bản chỉnh sửa gần nhất
   * nếu cần bảo mật login thì để pass hardcode ở biến môi trường hoặc hardcode trực tiếp cũng đc
