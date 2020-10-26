import Modifier from 'ember-modifier';
import {inject as service} from '@ember/service';
import {assert} from '@ember/debug';

export type IKeyMacro = {} | null;

export interface IKeyManager {
  addMacro(args: any): IKeyMacro;
  removeMacro(macro: any): void;
}

const isMac: boolean = window.navigator.platform === "MacIntel";
export const cmdKey: string = isMac ? 'Meta' : 'Control';

export default class KeyMacroModifier extends Modifier {
  @service keyManager!: IKeyManager;

  private macro: any;
  protected keyEvent!: string;

  private addMacro() {
    this.macro = this.keyManager.addMacro({
      callback: this.callback,
      executionKey: this.executionKey,
      modifierKeys: this.modifierKeys,
      priority: this.priority,
      keyEvent: this.keyEvent,
      isDisabledOnInput: this.isDisabledOnInput
    });
  }

  private removeMacro() {
    if (this.macro) {
      this.keyManager.removeMacro(this.macro);
    }
  }

  get callback() {
    return this.args.named.callback;
  }

  get executionKey() {
    assert("executionKey must be supplied in key-macro modifier", this.args.named.executionKey);
    return this.args.named.executionKey;
  }

  get modifierKeys() {
    return this.args.named.modifierKeys || [];
  }

  get priority() {
    return this.args.named.priority || 0;
  }

  get isDisabledOnInput() {
    return this.args.named.disabledOnInput;
  }

  didReceiveArguments() {
    this.removeMacro();
    this.addMacro();
  }

  willDestroy() {
    this.removeMacro();
  }
}
