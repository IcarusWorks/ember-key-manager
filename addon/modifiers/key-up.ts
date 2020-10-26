import { KeyEvent } from '@ember/test-helpers/dom/trigger-key-event';
import KeyMacroModifier from './key-macro';

export default class KeyUpModifier extends KeyMacroModifier {
  protected keyEvent: KeyEvent = "keyup";
  protected name: string = 'key-up';
}
