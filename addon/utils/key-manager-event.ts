import { KeyEvent } from "@ember/test-helpers/dom/trigger-key-event";

export interface KeyManagerEvent {
  type: KeyEvent;
  altKey?: boolean,
  ctrlKey?: boolean,
  shiftKey?: boolean,
  metaKey?: boolean,
  key: string,
}