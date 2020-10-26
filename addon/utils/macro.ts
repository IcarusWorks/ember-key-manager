import { A } from '@ember/array';

export interface MacroOptions {
  callback: Function;
  executionKey: string;
  modifierKeys?: string[],
  keyEvent?: string;
  element?: HTMLElement;
  isDisabledOnInput?: boolean;
  priority?: number;
  groupName?: string | null;
  isDisabled?: boolean;
}

export default class Macro {
  keyEvent: string = 'keydown';
  callback: Function = () => {};
  element: HTMLElement = document.body;
  executionKey: string = '';
  isDisabledOnInput: boolean = false;
  modifierKeys: string[] = [];
  priority: number = 0;
  groupName: string | null = null;
  isDisabled: boolean = false;

  constructor(options: MacroOptions) {
    if (options.modifierKeys !== undefined) {
      this.modifierKeys = A(options.modifierKeys);
    }
    if (options.element !== undefined) {
      this.element = options.element;
    }
    this.callback = options.callback;
    this.executionKey = options.executionKey;
    if (options.keyEvent) {
      this.keyEvent = options.keyEvent;
    }
    if (options.isDisabledOnInput !== undefined) {
      this.isDisabledOnInput = options.isDisabledOnInput;
    }
    if (options.priority !== undefined) {
      this.priority = options.priority;
    }
    if (options.groupName !== undefined) {
      this.groupName = options.groupName;
    }
    if (options.isDisabled !== undefined) {
      this.isDisabled = options.isDisabled;
    }
  }
}
