import Modifier, { ModifierArgs } from 'ember-modifier';
import {inject as service} from '@ember/service';
import {assert} from '@ember/debug';
import { KeyEvent } from '@ember/test-helpers/dom/trigger-key-event';
import KeyManagerService from 'dummy/services/key-manager';
import { KeyMacroModifierCallback } from 'ember-key-manager/utils/callback';

export type IKeyMacro = {} | null;

const isMac: boolean = window.navigator.platform === "MacIntel";
export const cmdKey: string = isMac ? 'Meta' : 'Control';

type ModifierKey = 'Alt' | 'Control' | 'Shift' | 'Meta';

interface KeyMacroModifierArgs extends ModifierArgs {
  named: {
    callback: KeyMacroModifierCallback;
    executionKey: string;
    modifierKeys?: ModifierKey[];
    priority?: number;
    disabledOnInput?: boolean;
  }
}

export default abstract class KeyMacroModifier extends Modifier<KeyMacroModifierArgs> {
  @service keyManager!: KeyManagerService;

  private macro: any;
  protected abstract keyEvent: KeyEvent;

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

  get callback(): KeyMacroModifierCallback {
    return this.args.named.callback;
  }

  get executionKey(): string {
    assert("executionKey must be supplied in key-macro modifier", this.args.named.executionKey);
    return this.args.named.executionKey;
  }

  get modifierKeys(): string[] {
    return this.args.named.modifierKeys || [];
  }

  get priority(): number {
    return this.args.named.priority || 0;
  }

  get isDisabledOnInput(): boolean {
    return this.args.named.disabledOnInput || false;
  }

  didReceiveArguments() {
    this.removeMacro();
    this.addMacro();
  }

  willDestroy() {
    this.removeMacro();
  }
}
