# PLAN — Game "Du Lịch Cùng Khủng Long"

> Game 3D chạy trên trình duyệt, xây bằng **Three.js**, quản lý & chạy bằng **npm** (Vite).
> Người chơi chọn **Chồng** hoặc **Vợ**, cùng nhau đi du lịch qua nhiều địa điểm. Mỗi địa điểm là một **ván (level)** với một thử thách riêng.
> Chi tiết các thử thách: xem [CHALLENGES.md](./CHALLENGES.md).

---

## 1. Ý tưởng cốt lõi

- **Thể loại:** Casual 3D / mini-game theo chặng (giống tuyển tập mini-game nối thành một chuyến đi).
- **Cảm xúc chủ đạo:** Vui, lãng mạn, nhẹ nhàng — thất bại không bị phạt nặng, có nhiều khoảnh khắc dễ thương giữa hai vợ chồng.
- **Vòng lặp chơi (core loop):**
  1. Chọn điểm đến trên **bản đồ chuyến đi**.
  2. Xem cutscene ngắn (2 vợ chồng đến nơi, chụp ảnh).
  3. Chơi thử thách của địa điểm (30s – 2 phút).
  4. Nhận **sao (1–3)** + **ảnh kỷ niệm** cho album.
  5. Mở khóa địa điểm tiếp theo.
- **Mục tiêu dài hạn:** Hoàn thành **Album Kỷ Niệm** (sưu tầm đủ ảnh ở mọi địa điểm) và thanh **"Độ Hạnh Phúc"** đầy.

## 2. Nhân vật

| Nhân vật | Mô tả | Chỉ số khác biệt nhẹ (tùy chọn) |
|---|---|---|
| **Chồng** | Khỏe, chạy hơi chậm | Sức bền +10% (bơi lâu hơn, leo lâu hơn) |
| **Vợ** | Nhanh nhẹn, khéo léo | Tốc độ/độ nhảy +10% |

- Màn **Chọn Nhân Vật** đầu game: xoay model 3D, nút "Chọn".
- Nhân vật **không được chọn** sẽ là **NPC đồng hành**: đi theo, cổ vũ, đôi khi hỗ trợ (ném phao, chỉ đường, giữ tay ở đoạn khó).
- Tùy biến nhẹ: màu áo, mũ, kính râm (mở khóa bằng sao).
- **Chế độ 2 người chơi (giai đoạn sau):** cùng một bàn phím — Chồng dùng `WASD`, Vợ dùng phím mũi tên.

## 3. Điều khiển

| Hành động | Bàn phím | Mobile (giai đoạn sau) |
|---|---|---|
| Di chuyển | `WASD` / mũi tên | Joystick ảo |
| Nhảy / Lặn / Hành động chính | `Space` | Nút A |
| Hành động phụ (lướt, né, cúi) | `Shift` | Nút B |
| Tạm dừng | `Esc` | Nút Pause |

Mỗi ván có thể "map lại" ý nghĩa của Space/Shift (ví dụ ở Quy Nhơn: Space = lặn qua sóng).

## 4. Công nghệ

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Build tool | **Vite** (`npm create vite@latest`) | Dev server nhanh, HMR, build gọn |
| Ngôn ngữ | JavaScript (có thể chuyển TypeScript) | Đơn giản để bắt đầu |
| Render 3D | **three** | Yêu cầu dự án |
| Vật lý | **cannon-es** (hoặc **@dimforge/rapier3d-compat**) | Va chạm, nhảy, trọng lực |
| Tween/animation | **gsap** hoặc `@tweenjs/tween.js` | Camera, UI, cutscene |
| Âm thanh | `THREE.Audio` / **howler** | Nhạc nền, SFX |
| Model 3D | `.glb` (GLTFLoader) — low-poly, ví dụ tự làm bằng Blender hoặc pack miễn phí (Kenney, Quaternius – CC0) | Nhẹ, đẹp, đúng phong cách |
| UI | HTML/CSS overlay trên canvas | Nhanh, dễ chỉnh |
| Lưu tiến trình | `localStorage` | Không cần server |
| Debug | **lil-gui**, `stats.js` | Tinh chỉnh tham số khi chơi |

### Lệnh npm dự kiến

```bash
npm create vite@latest . -- --template vanilla
npm install three cannon-es gsap howler
npm install -D lil-gui stats.js
npm run dev      # chạy local
npm run build    # build production
npm run preview  # xem bản build
```

## 5. Kiến trúc mã nguồn

```
game/
├── index.html
├── package.json
├── public/
│   ├── models/        # .glb nhân vật, địa hình
│   ├── textures/
│   └── audio/
└── src/
    ├── main.js                 # khởi tạo renderer, vòng lặp
    ├── core/
    │   ├── Game.js             # state machine: Menu → Select → Map → Level → Result
    │   ├── SceneManager.js     # load/unload scene từng ván
    │   ├── Input.js            # bàn phím, touch, gamepad
    │   ├── Physics.js          # wrapper cannon-es
    │   ├── AudioManager.js
    │   └── SaveSystem.js       # localStorage
    ├── entities/
    │   ├── Player.js           # điều khiển nhân vật được chọn
    │   ├── Companion.js        # AI người đồng hành
    │   └── CharacterFactory.js # tạo Chồng / Vợ
    ├── levels/
    │   ├── BaseLevel.js        # interface: init(), update(dt), isWin(), isLose(), dispose()
    │   ├── QuyNhonLevel.js     # bơi vượt sóng
    │   ├── CatBaLevel.js       # leo núi nhảy đá
    │   ├── ...                 # HaNoi, DaLat, NinhThuan, HaLong, DaNang, PhuQuoc, Singapore — xem CHALLENGES.md
    ├── ui/
    │   ├── MainMenu.js
    │   ├── CharacterSelect.js
    │   ├── TravelMap.js
    │   ├── HUD.js              # thời gian, máu/stamina, sao
    │   └── Album.js
    └── config/
        └── levels.json         # tham số từng ván: độ khó, thời gian, mục tiêu sao
```

### State machine

```
Boot → MainMenu → CharacterSelect → TravelMap ⇄ Level → Result → TravelMap
                                         ↘ Album / Settings
```

### Hợp đồng `BaseLevel`

```js
export class BaseLevel {
  constructor(game, config) {}
  async init() {}          // load model, dựng scene, đặt player
  update(dt) {}            // logic mỗi frame
  isWin() {}               // điều kiện thắng
  isLose() {}              // điều kiện thua
  getStars() {}            // 1–3 sao dựa trên thời gian/điểm
  dispose() {}             // giải phóng geometry, material, texture
}
```

Thêm ván mới = tạo 1 class kế thừa `BaseLevel` + 1 mục trong `levels.json`.

## 6. Phong cách hình ảnh & âm thanh

- **Low-poly, màu pastel**, ánh sáng ấm (golden hour).
- Camera góc 3/4 từ sau lưng, bám theo mượt (lerp).
- Hiệu ứng: nước dùng shader đơn giản (sóng sin), sương mù (`scene.fog`) cho núi, particle tuyết/hoa.
- Nhạc nền riêng từng địa điểm; SFX: nhảy, té nước, cổ vũ của vợ/chồng ("Cố lên anh ơi!", "Em giỏi quá!").

## 7. Hệ thống tiến trình

- **Sao:** 1 sao = hoàn thành, 2 sao = đạt thời gian/điểm, 3 sao = hoàn hảo (không té, nhặt đủ vật phẩm).
- **Độ Hạnh Phúc:** tổng sao; mở khóa địa điểm mới & trang phục.
- **Album Kỷ Niệm:** cuối mỗi ván chụp "ảnh" bằng cách render canvas thành ảnh (`renderer.domElement.toDataURL()`), lưu vào album.
- **Chặng cuối Singapore:** đạt tối thiểu 2 sao ở mọi địa điểm trong nước → mở khóa (xem CHALLENGES.md).

## 8. Lộ trình phát triển (Milestones)

| Giai đoạn | Nội dung | Ước lượng |
|---|---|---|
| **M0 – Khung** | Vite + Three.js, vòng lặp game, input, camera follow, state machine | 2–3 ngày |
| **M1 – Nhân vật** | Model Chồng/Vợ (tạm dùng capsule), màn chọn nhân vật, animation đi/nhảy | 3 ngày |
| **M2 – Ván Quy Nhơn** | Bơi né sóng, HUD, thắng/thua, sao | 4 ngày |
| **M3 – Ván Cát Bà** | Nhảy đá, vật lý, checkpoint | 4 ngày |
| **M4 – Bản đồ & Lưu** | Travel map, save/load, album | 3 ngày |
| **M5 – Mở rộng ván** | Thêm các ván Hà Nội, Đà Lạt, Ninh Thuận, Hạ Long, Đà Nẵng, Phú Quốc | 2–3 ngày/ván |
| **M6 – Đánh bóng** | Âm thanh, hiệu ứng, cutscene, tối ưu, mobile touch | 1 tuần |
| **M7 – 2 người chơi** | Co-op cùng bàn phím | 1 tuần |

**MVP = M0 → M4** (2 ván Quy Nhơn + Cát Bà, chọn nhân vật, bản đồ, lưu tiến trình).

## 9. Hiệu năng & rủi ro

- Giữ mỗi scene < ~100k tam giác, dùng `InstancedMesh` cho đá/cây/sóng lặp lại.
- Luôn `dispose()` khi rời ván để tránh rò bộ nhớ GPU.
- Giới hạn `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Rủi ro: vật lý nhảy cảm giác "cứng" → thêm *coyote time* & *jump buffer* (~100ms).
- Rủi ro: model 3D tốn thời gian → bắt đầu bằng hình khối cơ bản, thay model sau.

## 10. Bước tiếp theo

1. Khởi tạo dự án Vite + cài `three`.
2. Làm M0: scene, camera, nhân vật capsule di chuyển được.
3. Làm màn chọn nhân vật.
4. Dựng ván Quy Nhơn theo đặc tả trong [CHALLENGES.md](./CHALLENGES.md#2-quy-nhơn--bơi-vượt-sóng-ở-kỳ-co).
