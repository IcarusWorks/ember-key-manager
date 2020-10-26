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
  positional: [executionKey: string, callback: KeyMacroModifierCallback];
  named: {
    modifierKeys?: ModifierKey[];
    priority?: number;
    disabledOnInput?: boolean;
  }
}

export default abstract class KeyMacroModifier extends Modifier<KeyMacroModifierArgs> {
  @service keyManager!: KeyManagerService;

  private macro: any;
  protected abstract keyEvent: KeyEvent;
  protected abstract name: string;

  private addMacro() {
    this.macro = this.keyManager.addMacro({
      element: this.element as HTMLElement,
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
    assert(`A callback function must be supplied as the second parameter of a ${this.name} modifier`, this.args.positional.length > 1);
    return this.args.positional[1] as KeyMacroModifierCallback;
  }

  get executionKey(): string {
    assert(`executionKey must be supplied as the first parameter of a ${this.name} modifier`, this.args.positional.length > 0);
    return this.args.positional[0] as string;
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

  public didReceiveArguments() {
    this.removeMacro();
    this.addMacro();
  }

  public willDestroy() {
    this.removeMacro();
  }
}
