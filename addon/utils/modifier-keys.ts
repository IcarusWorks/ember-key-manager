export const ALT_MODIFIER = 'altKey';
export const CTRL_MODIFIER = 'ctrlKey';
export const META_MODIFIER = 'metaKey';
export const SHIFT_MODIFIER = 'shiftKey';

export const ALT_KEY = 'Alt';
export const CTRL_KEY = 'Control';
export const META_KEY = 'Meta';
export const SHIFT_KEY = 'Shift';

export const TO_MODIFIER: {[index: string]: string} = {
  [ALT_KEY]: ALT_MODIFIER,
  [CTRL_KEY]: CTRL_MODIFIER,
  [META_KEY]: META_MODIFIER,
  [SHIFT_KEY]: SHIFT_MODIFIER,
}

export const TO_KEY: {[index: string]: string} = {
  [ALT_MODIFIER]: ALT_KEY,
  [CTRL_MODIFIER]: CTRL_KEY,
  [META_MODIFIER]: META_KEY,
  [SHIFT_MODIFIER]: SHIFT_KEY,
}
