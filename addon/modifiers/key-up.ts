import KeyMacroModifier from './key-macro';

export default class KeyUpModifier extends KeyMacroModifier {
  constructor() {
    super(...arguments);
    this.keyEvent = "keyup";
  }
}
