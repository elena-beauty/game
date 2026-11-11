import { CHARACTERS } from './keys.js';

// Chỉ số nhân vật — xem PLAN.md mục 2. Chồng: sức bền +10%. Vợ: tốc độ/nhảy +10%.
export const CHARACTER_STATS = {
  [CHARACTERS.HUSBAND]: {
    name: 'Chồng',
    title: 'Anh Chồng Khỏe Mạnh',
    desc: 'Dẻo dai — bơi lâu, leo lâu, chèo khỏe.',
    speed: 230,
    jump: 560,
    stamina: 1.1,
    agility: 1.0,
    color: 0x3d8bfd,
    bars: { speed: 0.65, jump: 0.6, stamina: 0.9 },
    cheers: ['Em giỏi quá!', 'Cố lên em ơi!', 'Anh ở đây rồi!', 'Tuyệt vời!'],
  },
  [CHARACTERS.WIFE]: {
    name: 'Vợ',
    title: 'Cô Vợ Nhanh Nhẹn',
    desc: 'Khéo léo — chạy nhanh, nhảy cao.',
    speed: 255,
    jump: 615,
    stamina: 1.0,
    agility: 1.1,
    color: 0xff6f9f,
    bars: { speed: 0.85, jump: 0.85, stamina: 0.65 },
    cheers: ['Cố lên anh ơi!', 'Anh giỏi quá!', 'Yêu anh!', 'Sắp tới rồi!'],
  },
};

export const otherCharacter = (key) => (key === CHARACTERS.HUSBAND ? CHARACTERS.WIFE : CHARACTERS.HUSBAND);
