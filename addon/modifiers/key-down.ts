import KeyMacroModifier from './key-macro';

export default class KeyDownModifier extends KeyMacroModifier {
  constructor() {
    super(...arguments);
    this.keyEvent = "keydown";
  }
}
