// Tên scene, nhân vật, event dùng chung — tránh gõ sai chuỗi.
export const SCENES = {
  BOOT: 'Boot',
  PRELOAD: 'Preload',
  MAIN_MENU: 'MainMenu',
  CHARACTER_SELECT: 'CharacterSelect',
  TRAVEL_MAP: 'TravelMap',
  RESULT: 'Result',
  ALBUM: 'Album',
  HUD: 'HUD',
};

export const CHARACTERS = {
  HUSBAND: 'husband',
  WIFE: 'wife',
};

export const EVENTS = {
  HUD_UPDATE: 'hud-update', // payload: getHudState()
  TOAST: 'toast', // payload: { text, color }
  PLAY_START: 'play-start',
};
