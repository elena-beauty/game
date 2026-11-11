# Du Lịch Cùng Khủng Long

Game trình duyệt xây bằng **[Phaser](https://phaser.io/) 4** + **[Vite](https://vite.dev/)**.
Người chơi chọn **Chồng** hoặc **Vợ**, cùng nhau đi qua các địa điểm du lịch, mỗi địa điểm là một ván (level) với thử thách riêng.

- Ý tưởng, kiến trúc, lộ trình: [PLAN.md](./PLAN.md)
- Đặc tả từng ván: [CHALLENGES.md](./CHALLENGES.md)

> **Lưu ý:** PLAN.md viết theo hướng Three.js (3D). Dự án hiện dùng **Phaser (2D)**, nên các gợi ý kỹ thuật Three.js trong tài liệu được chuyển sang tương đương Phaser (Arcade Physics, Tween, Particles, Tilemap...).

---

## 1. Yêu cầu

| Công cụ | Phiên bản |
|---|---|
| Node.js | ≥ 20 (khuyến nghị 22 LTS hoặc mới hơn) |
| npm | ≥ 10 |
| Trình duyệt | Chrome / Firefox / Edge / Safari bản mới |

Kiểm tra:

```bash
node -v
npm -v
```

## 2. Cài đặt

```bash
# 1. Vào thư mục dự án
cd game

# 2. Cài dependency (phaser, vite)
npm install
```

## 3. Chạy & build

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy dev server tại <http://localhost:8080> (tự mở trình duyệt, hot reload) |
| `npm run build` | Build production ra thư mục `dist/` |
| `npm run preview` | Chạy thử bản build trong `dist/` |

Thư mục `dist/` là web tĩnh — có thể deploy lên GitHub Pages, Netlify, Vercel, itch.io (đã đặt `base: './'` trong `vite.config.js` nên chạy được ở thư mục con).

## 4. Cấu trúc thư mục

```
game/
├── index.html                  # Trang gốc, chứa #game-container + font Baloo 2 (Google Fonts)
├── package.json
├── vite.config.js              # Cấu hình Vite (port 8080, tách chunk Phaser)
├── PLAN.md / CHALLENGES.md     # Tài liệu thiết kế
├── public/
│   └── assets/                 # Asset tĩnh (ảnh, spritesheet, tilemap, âm thanh, font)
└── src/
    ├── main.js                 # Khởi tạo Phaser.Game (dev: window.__game để debug)
    ├── style.css
    ├── art/                    # Đồ họa vẽ bằng code (Canvas 2D → texture)
    │   ├── CharacterArt.js     # Nhân vật chibi Chồng / Vợ + animation
    │   ├── CommonArt.js        # Sao, tim, mây, cây dừa, cây thông, ghim bản đồ...
    │   └── levels/             # Art riêng của từng ván (nếu tách file)
    ├── config/
    │   ├── gameConfig.js       # Kích thước, physics, danh sách scene
    │   ├── keys.js             # Hằng số: tên scene, nhân vật, event
    │   ├── characters.js       # Chỉ số + câu cổ vũ của Chồng / Vợ
    │   └── levels.json         # 9 địa điểm: mô tả, điều khiển, điều kiện sao, vị trí trên bản đồ
    ├── scenes/
    │   ├── BootScene.js        # Chờ font tải
    │   ├── PreloadScene.js     # Tạo texture dùng chung
    │   ├── MainMenuScene.js    # Bãi biển hoàng hôn
    │   ├── CharacterSelectScene.js
    │   ├── TravelMapScene.js   # Bản đồ Việt Nam + Singapore, thẻ thông tin địa điểm
    │   ├── HUDScene.js         # Bảng giới thiệu ván, đếm ngược, đồng hồ, thanh chỉ số, tạm dừng (Esc)
    │   ├── ResultScene.js      # Sao + ảnh kỷ niệm polaroid
    │   ├── AlbumScene.js       # Album ảnh kỷ niệm
    │   └── levels/             # BaseLevel + 9 ván
    │       ├── BaseLevel.js
    │       ├── HaNoiLevel.js       QuyNhonLevel.js    CatBaLevel.js
    │       ├── DaLatLevel.js       NinhThuanLevel.js  HaLongLevel.js
    │       └── DaNangLevel.js      PhuQuocLevel.js    SingaporeLevel.js
    ├── objects/
    │   ├── Player.js           # Nhân vật người chơi (topdown / platformer / swim)
    │   └── Companion.js        # Bạn đồng hành: đi theo, nói chuyện, cổ vũ
    ├── systems/
    │   ├── InputManager.js     # WASD / mũi tên / Space / Shift / E / F / Tab / Esc
    │   ├── SaveSystem.js       # Lưu sao, ảnh album, nhân vật (localStorage)
    │   └── AudioManager.js
    ├── ui/
    │   ├── theme.js            # Màu, font, style chữ
    │   ├── Button.js           # Nút gradient 3D
    │   └── Panel.js            # Panel, hàng sao, bóng thoại
    └── utils/
        ├── canvas.js           # Helper vẽ texture: gradient, bo góc, bầu trời, dãy núi...
        ├── fx.js               # Hạt nổ, chữ bay, mây trôi
        └── math.js
```

Toàn bộ hình ảnh hiện được **vẽ bằng code** (Canvas 2D) nên không cần file ảnh. Khi có art thật, đặt vào `public/assets/` và load trong `PreloadScene` với cùng key texture.

### Luồng scene

```
Boot → Preload → MainMenu → CharacterSelect → TravelMap ⇄ Level (+ HUD) → Result → TravelMap
                     ↘ Album
```

## 5. Thêm một ván mới

1. Tạo `src/scenes/levels/<Key>Level.js` kế thừa `BaseLevel`:

   ```js
   import { BaseLevel } from './BaseLevel.js';

   export class HueLevel extends BaseLevel {
     constructor() { super('Hue'); }        // key trùng levels.json
     buildLevel() {}                         // dựng map, this.player, this.companion
     updateLevel(dt) {}                      // logic mỗi frame
     isWin() { return false; }
     isLose() { return false; }              // đặt this.loseReason để hiện lý do thua
     getStars() { return 1; }                // 1–3 sao
     getHudState() {                         // HUD tự vẽ thanh & bộ đếm
       return { bars: [{ key: 'hp', label: 'Sức', value: 50, max: 100, color: '#33b36b' }],
                counters: [{ key: 'coin', icon: 'star', value: 1, max: 3 }], hint: '' };
     }
     getSummary() { return ['Thời gian: 30s']; }
   }
   ```

2. Thêm mục vào `src/config/levels.json` (tên, mô tả, điều khiển, 3 điều kiện sao, toạ độ `map` trên bản đồ).
3. Thêm class vào `LEVEL_SCENES` trong `src/config/gameConfig.js`.

## 6. Điều khiển (mặc định)

| Hành động | Phím |
|---|---|
| Di chuyển | `WASD` / mũi tên |
| Hành động chính (nhảy, lặn...) | `Space` |
| Hành động phụ (lướt, bám...) | `Shift` |
| Tương tác / mua đồ | `E` |
| Chụp ảnh (Phú Quốc) | `F` |
| Đổi nhân vật (Singapore) | `Tab` |
| Tạm dừng | `Esc` |

## 7. Ảnh thật (khuôn mặt & kỷ niệm)

- **Khuôn mặt nhân vật:** `public/assets/images/characters/boy.png` (Chồng), `girl.png` (Vợ). Vùng mặt cắt tròn chỉnh ở `PHOTOS` trong `src/art/CharacterArt.js`.
- **Ảnh kỷ niệm theo địa điểm:** khai báo `"memoryPhoto"` trong `src/config/levels.json`, ví dụ `"memoryPhoto": "images/characters/quynhon.png"`. Hiện có: Quy Nhơn, Đà Nẵng, Phú Quốc, Singapore.
  - Ảnh **mở khóa khi thắng ván**, hiện ở màn kết quả, thẻ địa điểm trên bản đồ và Album (bấm để xem to).
  - Viền đen của ảnh được tự cắt; ảnh dọc hiện đủ trên nền mờ.
  - Địa điểm chưa có ảnh thật dùng ảnh chụp màn hình lúc thắng.

## 8. Ghi chú phát triển

- Mỗi ván có điều khiển riêng — xem bảng giới thiệu đầu ván hoặc `levels.json`.
- Debug nhanh trong DevTools (chế độ dev): `__game.scene.start('HaLong')` để vào thẳng một ván.
- Bật khung va chạm khi debug: đặt `physics.arcade.debug: true` trong `src/config/gameConfig.js`.
- Xóa tiến trình đã lưu: mở DevTools console, chạy `localStorage.removeItem('di-du-lich-cung-vo:save')`.
