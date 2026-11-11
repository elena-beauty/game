# CHALLENGES — Thử thách theo từng điểm đến

> Mỗi địa điểm du lịch = 1 ván với cơ chế riêng, lấy cảm hứng từ đặc trưng thật của nơi đó. Người chơi điều khiển nhân vật đã chọn (**Chồng** hoặc **Vợ**), người còn lại là bạn đồng hành hỗ trợ.
> Kiến trúc & lộ trình: xem [PLAN.md](./PLAN.md).

Độ khó tăng dần theo thứ tự bên dưới. Mỗi ván ghi rõ: **Mục tiêu · Điều khiển · Chướng ngại · Vai trò bạn đồng hành · Điều kiện sao · Gợi ý kỹ thuật Three.js**.

---

## 1. Hà Nội — Phố cổ & qua đường đông xe

- **Bối cảnh:** Phố cổ buổi tối, chợ đêm Hàng Đào, kết thúc ở Hồ Gươm, cầu Thê Húc đỏ.
- **Mục tiêu:** Nắm tay nhau đi qua phố cổ, **mua đủ món ăn** (phở, bún chả, kem Tràng Tiền, cà phê trứng) rồi tới cầu Thê Húc chụp ảnh.
- **Điều khiển:** `WASD` di chuyển; `E` mua đồ ở quầy; `Space` gọi to (người kia quay lại tìm); `Shift` đi nhanh.
- **Chướng ngại:**
  - **Qua đường kiểu Hà Nội:** dòng xe máy liên tục — đi đều, chậm, không dừng đột ngột (đứng khựng giữa đường dễ bị "suýt va").
  - Đám đông chợ đêm đi ngược chiều.
  - Hàng rong gánh đồ cắt ngang.
- **Cơ chế đặc biệt:** Thanh **"Kết nối"** giảm khi xa nhau quá xa; về 0 = lạc nhau = thua.
- **Bạn đồng hành:** Cầm danh sách món ăn, chỉ quầy kế tiếp.
- **Sao:** ⭐ mua đủ món + tới cầu · ⭐⭐ thanh Kết nối luôn > 50% · ⭐⭐⭐ không lần "suýt va" xe nào.
- **Kỹ thuật:** `InstancedMesh` cho đám đông & xe máy, xe chạy theo `CatmullRomCurve3`; đèn lồng phố cổ dùng vật liệu emissive + `UnrealBloomPass`.

## 2. Quy Nhơn — Bơi vượt sóng ở Kỳ Co

- **Bối cảnh:** Bãi Kỳ Co nước xanh ngọc, có cầu cảng gỗ và đảo nhỏ ngoài khơi.
- **Mục tiêu:** Bơi từ bờ ra phao nơi người kia đang chờ trên thuyền thúng, không bị sóng đánh trôi.
- **Điều khiển:** `WASD` bơi; `Space` **lặn** qua con sóng lớn (hơi có hạn); `Shift` sải nhanh (tốn sức).
- **Chướng ngại:**
  - Sóng lớn đến theo nhịp — phải lặn đúng lúc.
  - Dòng chảy ngang kéo lệch hướng.
  - Sứa (chạm vào bị chậm), ca nô chở khách chạy ngang.
- **Thanh chỉ số:** Stamina, Hơi thở.
- **Bạn đồng hành:** Đứng trên thuyền thúng vẫy tay chỉ hướng; ném phao cứu sinh khi bạn sắp đuối (1 lần/ván).
- **Sao:** ⭐ tới phao · ⭐⭐ dưới 60s · ⭐⭐⭐ không bị sóng đánh + nhặt 3 vỏ sò.
- **Kỹ thuật:** Mặt nước `PlaneGeometry` + vertex shader sóng sin; sóng lớn là mesh chạy theo trục Z, va chạm khi `player.y` cao hơn ngưỡng lặn.

## 3. Cát Bà — Leo núi nhảy đá trong rừng quốc gia

- **Bối cảnh:** Vườn quốc gia Cát Bà, đường mòn lên đỉnh Ngự Lâm, nhìn ra vịnh Lan Hạ.
- **Mục tiêu:** Leo lên đỉnh ngắm toàn cảnh vịnh cùng nhau.
- **Điều khiển:** `WASD` di chuyển; `Space` nhảy (giữ lâu nhảy xa hơn — thanh lực); `Shift` bám mép đá.
- **Chướng ngại:**
  - Đá vôi lởm chởm nổi trên khe suối, một số **lung lay** (rơi sau 1s).
  - Đá ướt rêu trơn.
  - **Voọc / khỉ** nhảy ra giật đồ (mất vật phẩm nếu không né).
  - Rễ cây chắn ngang phải nhảy qua.
- **Checkpoint:** Các trạm nghỉ trên đường mòn.
- **Bạn đồng hành:** Đi trước nhảy mẫu; đoạn quá xa có QTE "kéo tay".
- **Sao:** ⭐ lên đỉnh · ⭐⭐ té ≤ 2 lần · ⭐⭐⭐ không té + nhặt đủ 5 bông hoa rừng.
- **Kỹ thuật:** cannon-es body cho đá; đá lung lay đổi `mass` 0 → >0 sau timer; coyote time + jump buffer.

## 4. Đà Lạt — Máng trượt Datanla & đạp xe đôi trong sương

- **Bối cảnh:** Rừng thông, sương mù, thác Datanla, hồ Xuân Hương.
- **Phần A – Máng trượt (alpine coaster):** Hai người ngồi chung xe trượt lao xuống thác.
  - **Điều khiển:** `S` phanh; `W` thả phanh.
  - **Mục tiêu:** Phanh vừa đủ ở khúc cua (quá nhanh → văng cảnh báo, quá chậm → mất điểm tốc độ).
- **Phần B – Đạp xe đôi quanh hồ Xuân Hương:**
  - **Điều khiển:** `A`/`D` **luân phiên theo nhịp** để đạp (đúng nhịp với người kia → xe chạy nhanh), `Q`/`E` lái.
  - **Chướng ngại:** Sương mù dày giảm tầm nhìn, dốc lên/xuống, xe ngựa, người đi bộ.
- **Bạn đồng hành:** Hô nhịp "Một — Hai!"; ở phần A hét báo khúc cua sắp tới.
- **Sao:** ⭐ hoàn thành 2 phần · ⭐⭐ đúng nhịp ≥ 80% · ⭐⭐⭐ không lần nào quá tốc độ ở khúc cua.
- **Kỹ thuật:** Máng trượt là `TubeGeometry` theo spline, xe chạy theo tham số `t`; sương bằng `scene.fog = new THREE.FogExp2(...)`; rừng thông `InstancedMesh`.

## 5. Ninh Thuận — Lái jeep trên đồi cát Nam Cương

- **Bối cảnh:** Đồi cát vàng, cánh đồng điện gió, vườn nho, hoàng hôn rực.
- **Mục tiêu:** Lái xe jeep vượt đồi cát đến điểm ngắm hoàng hôn **trước khi mặt trời lặn**, dọc đường ghé vườn nho hái nho.
- **Điều khiển:** `W` ga, `S` lùi, `A`/`D` lái; `Space` tăng tốc (có hạn); `E` hái nho khi dừng ở vườn.
- **Chướng ngại:**
  - Cồn cát dốc (dễ lật nếu lên lệch).
  - **Gió mạnh** (vùng điện gió) đẩy xe ngang — có chỉ báo hướng gió trên HUD.
  - Bão cát nhỏ giảm tầm nhìn; xương rồng, đàn cừu đi ngang.
- **Bạn đồng hành:** Ngồi ghế phụ cầm bản đồ, mũi tên chỉ hướng; nhắc khi đi sai.
- **Sao:** ⭐ kịp hoàng hôn · ⭐⭐ không lật xe · ⭐⭐⭐ hái đủ 3 chùm nho.
- **Kỹ thuật:** `RaycastVehicle` (cannon-es); địa hình đồi cát từ heightmap/noise; mặt trời là `DirectionalLight` hạ dần + `Sky` shader đổi màu theo thời gian còn lại; cối xay gió quay bằng `rotation.z`.

## 6. Hạ Long — Chèo kayak qua hang theo thủy triều

- **Bối cảnh:** Vịnh Hạ Long, hàng nghìn đảo đá vôi, hang Luồn, làng chài nổi.
- **Mục tiêu:** Chèo kayak đôi xuyên qua hang Luồn và các đảo đá để tới du thuyền **trước khi thủy triều lên** đóng lối hang.
- **Điều khiển:** `A`/`D` chèo trái/phải luân phiên (chèo lệch → kayak xoay); `Space` **cúi người** qua trần hang thấp; `Shift` thả trôi giảm tốc.
- **Chướng ngại:**
  - **Thủy triều:** mực nước dâng dần, trần hang càng thấp — vào hang muộn phải cúi nhiều lần hơn.
  - Sóng do tàu du lịch lớn chạy qua làm kayak chao.
  - Lưới đánh cá của làng chài, bè nuôi cá.
  - Nhũ đá thả xuống trong hang.
- **Bạn đồng hành:** Ngồi mũi kayak hô nhịp, cầm đèn soi trong hang.
- **Sao:** ⭐ tới du thuyền · ⭐⭐ không va trần hang · ⭐⭐⭐ đúng nhịp ≥ 85% + chụp được 3 hòn đá nổi tiếng (Hòn Trống Mái…).
- **Kỹ thuật:** Đảo đá dùng geometry low-poly kéo dài theo trục Y + noise; mực nước là `waterMesh.position.y` tăng theo thời gian; vật lý kayak tự viết (lực đẩy + mô-men xoay).

## 7. Đà Nẵng — Lướt ván biển Mỹ Khê & Cầu Rồng phun lửa

- **Bối cảnh:** Biển Mỹ Khê ban ngày, tối đến Cầu Rồng sông Hàn.
- **Phần A – Lướt ván (ban ngày):**
  - **Điều khiển:** `A`/`D` nghiêng ván; `W` chồm tới bắt sóng; `Space` bật nhảy trên đỉnh sóng.
  - **Mục tiêu:** Giữ **thanh thăng bằng** ở vùng xanh, cưỡi sóng càng lâu càng nhiều điểm.
- **Phần B – Cầu Rồng (buổi tối, 21h):**
  - **Mục tiêu:** Dắt người kia len qua đám đông tới **vị trí chụp ảnh đẹp nhất** trước khi rồng phun lửa.
  - **Chướng ngại:** Đám đông, **rồng phun nước** ướt người (né theo cảnh báo).
  - Chụp ảnh đúng khoảnh khắc lửa phun (QTE timing) → ảnh album đẹp.
- **Bạn đồng hành:** Phần A ngồi trên bờ cổ vũ; phần B giữ tay, nhắc khi lạc.
- **Sao:** ⭐ hoàn thành 2 phần · ⭐⭐ ≥ 1500 điểm lướt sóng · ⭐⭐⭐ chụp ảnh "Perfect" lúc rồng phun lửa + không bị ướt.
- **Kỹ thuật:** Sóng lướt dùng mặt cong động (shader) + kiểm tra góc ván so với pháp tuyến sóng; lửa/nước phun bằng `Points` particle + bloom.

## 8. Phú Quốc — Lặn ngắm san hô & câu mực đêm

- **Bối cảnh:** Quần đảo An Thới, Hòn Thơm, Sunset Town, biển đêm có đèn thuyền câu.
- **Phần A – Lặn ngắm san hô (snorkel):**
  - **Điều khiển:** `WASD` bơi 3D; `Space` lặn sâu; `Shift` nổi lên lấy hơi; `F` chụp ảnh dưới nước.
  - **Mục tiêu:** Chụp đủ 5 loài sinh vật (cá hề, sao biển, rùa biển, cá ngựa, san hô não) trước khi hết **bình oxy**.
  - **Chướng ngại:** Nhím biển (chạm mất máu), dòng nước ngầm, cá mú lớn rượt đuổi vui.
- **Phần B – Câu mực đêm:**
  - **Điều khiển:** `Space` thả/giật cần đúng lúc (thanh timing); `A`/`D` giữ dây không đứt.
  - **Mục tiêu:** Câu đủ số mực trong 90s để cùng nướng ăn trên thuyền.
- **Bạn đồng hành:** Phần A bơi cạnh chỉ sinh vật bằng tay; phần B soi đèn thu hút mực (tăng tỉ lệ cắn câu).
- **Sao:** ⭐ hoàn thành 2 phần · ⭐⭐ chụp đủ 5 loài · ⭐⭐⭐ câu ≥ 10 con + không chạm nhím biển.
- **Kỹ thuật:** Dưới nước dùng `FogExp2` xanh + caustics texture chiếu lên đáy; ánh sáng ban đêm từ `PointLight` trên thuyền, mặt biển phản chiếu bằng `Water` (three/examples).

## 9. Singapore — Chặng cuối: Chạy đua cả thành phố

- **Mở khóa:** Hoàn thành 8 ván trong nước (hoặc đạt ≥ 16 sao).
- **Bối cảnh:** Vườn công nghệ với các "siêu cây" phát sáng, tàu điện ngầm (MRT), khu vịnh Marina, đảo nghỉ dưỡng phía nam.
- **Mục tiêu:** Đi hết lịch trình 1 ngày để kịp **show ánh sáng – nhạc nước ở vịnh lúc 20h**. Ván tổng hợp nhiều cơ chế:
  1. **Sân bay → MRT:** Lên đúng chuyến tàu (timing cửa đóng), đứng giữ thăng bằng khi tàu tăng/giảm tốc.
  2. **Cầu đi bộ trên cao giữa các siêu cây:** Cầu rung nhẹ khi đông người — giữ thăng bằng, nhảy qua đoạn đang bảo trì.
  3. **Đảo nghỉ dưỡng:** Trượt máng cáp (zipline) ra biển, lái hướng để rơi trúng phao.
  4. **Vịnh Marina:** Len qua đám đông, chụp ảnh khoảnh khắc nhạc nước đẹp nhất.
- **Cơ chế đặc biệt:** Có thể **đổi nhân vật giữa chừng** (`Tab`) — đoạn cần sức bền dùng Chồng, đoạn cần khéo léo dùng Vợ.
- **Luật:** Phạt tiền ảo nếu xả rác / ăn uống trên MRT (vật phẩm "kẹo cao su" xuất hiện làm bẫy — đừng nhặt!).
- **Sao:** ⭐ kịp show 20h · ⭐⭐ không bị phạt · ⭐⭐⭐ còn > 10 phút dư + ảnh "Perfect".
- **Phần thưởng:** Ảnh kỷ niệm cuối + credits chạy với toàn bộ ảnh trong album.
- **Kỹ thuật:** Siêu cây là `CylinderGeometry` + đèn emissive thay đổi theo nhạc (`AudioAnalyser`); nhạc nước bằng particle `Points` + laser (`Line` additive blending).

---

## Bảng tổng hợp

| # | Địa điểm | Cơ chế chính | Độ khó | Ưu tiên MVP |
|---|---|---|---|---|
| 1 | Hà Nội | Qua đường, giữ khoảng cách, mua đồ | ★☆☆☆☆ | |
| 2 | Quy Nhơn | Bơi, lặn né sóng (timing) | ★☆☆☆☆ | ✅ |
| 3 | Cát Bà | Platformer nhảy đá | ★★☆☆☆ | ✅ |
| 4 | Đà Lạt | Phanh máng trượt + đạp xe theo nhịp | ★★☆☆☆ | |
| 5 | Ninh Thuận | Lái jeep đồi cát, chống gió | ★★★☆☆ | |
| 6 | Hạ Long | Chèo kayak, thủy triều | ★★★☆☆ | |
| 7 | Đà Nẵng | Lướt ván thăng bằng + chụp ảnh timing | ★★★☆☆ | |
| 8 | Phú Quốc | Lặn 3D, oxy + câu mực timing | ★★★★☆ | |
| 9 | Singapore | Tổng hợp + đổi nhân vật | ★★★★★ | |

## Ý tưởng mở rộng

- **Thử thách hằng ngày:** biến thể ngẫu nhiên 1 ván (sóng Quy Nhơn to gấp đôi, gió Ninh Thuận đổi hướng liên tục...).
- **Sự kiện tình cảm:** giữa ván có lựa chọn nhỏ (mua kem cho người kia → +Độ Hạnh Phúc nhưng mất 5s).
- **Đặc sản sưu tầm:** mỗi địa điểm có 1 món đặc sản ẩn (bánh mì Phú Quốc, nho Ninh Thuận, bánh xèo Quy Nhơn, mì Quảng Đà Nẵng, atiso Đà Lạt...).
- **Chế độ co-op 2 người:** Chồng `WASD`, Vợ mũi tên — Hà Nội, Đà Lạt (xe đôi), Hạ Long (kayak đôi) đặc biệt hợp.
