import { KeyEvent } from '@ember/test-helpers/dom/trigger-key-event';
import KeyMacroModifier from './key-macro';

export default class KeyDownModifier extends KeyMacroModifier {
  protected keyEvent: KeyEvent = "keydown";
  protected name: string = 'key-down';
}
