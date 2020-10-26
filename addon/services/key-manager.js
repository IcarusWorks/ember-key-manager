import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import Macro from '../utils/macro';
import { TO_MODIFIER, TO_KEY } from '../utils/modifier-keys';
import {
  setProperties,
} from '@ember/object';
import { warn } from '@ember/debug';
import { isPresent } from '@ember/utils';
import {
  MODIFIERS_ON_KEYUP as MODIFIERS_ON_KEYUP_WARNING,
} from 'ember-key-manager/utils/warning-messages';
import { A } from '@ember/array';
import { capitalize } from '@ember/string';

const inputElements = [
  'INPUT',
  'SELECT',
  'TEXTAREA',
];

const isInputElement = (element) => {
  const isContentEditable = element.isContentEditable;
  const isInput = inputElements.includes(element.tagName);

  return isContentEditable || isInput;
};

export default class KeyManagerService extends Service {
  isDisabledOnInput = false; // Config option
  macros = A();

  get keydownMacros() {
    return this.macros.filterBy('keyEvent', 'keydown');
  }

  get keyupMacros() {
    return this.macros.filterBy('keyEvent', 'keyup');
  }

  constructor() {
    super(...arguments);
    this._registerConfigOptions();
  }

  addMacro(options) {
    const macroAttrs = this._mergeConfigDefaults(options);
    const macro = Macro.create();
    macro.setup(macroAttrs);

    const keyEvent = macro.keyEvent;
    this._handleModifiersOnKeyup(macro, keyEvent);
    const element = macro.element;
    this._addEventListener(element, keyEvent);

    const macros = this.macros;
    macros.pushObject(macro);

    return macro;
  }

  _handleModifiersOnKeyup({ modifierKeys }, keyEvent) {
    if (keyEvent === 'keyup' && isPresent(modifierKeys)) {
      warn(MODIFIERS_ON_KEYUP_WARNING, false, {id: 'keyup-with-modifiers'});
    }
  }

  _mergeConfigDefaults(attrs) {
    const isDisabledOnInput = this.isDisabledOnInput;
    return assign({ isDisabledOnInput }, attrs);
  }

  _addEventListener(element, keyEvent) {
    const hasListenerForElementAndKeyEvent = this._findMacroWithElementAndKeyEvent(element, keyEvent);
    if (!hasListenerForElementAndKeyEvent) {
      element.addEventListener(keyEvent, this);
    }
  }

  removeMacro(macro) {
    const element = macro.element;
    const keyEvent = macro.keyEvent;
    const macros = this.macros;

    macros.removeObject(macro);

    this._removeEventListenter(element, keyEvent);
  }

  _removeEventListenter(element, keyEvent) {
    const hasListenerForElementAndKeyEvent = this._findMacroWithElementAndKeyEvent(element, keyEvent);
    if (!hasListenerForElementAndKeyEvent) {
      element.removeEventListener(keyEvent, this);
    }
  }

  disable(recipient) {
    this._setDisabledState(recipient, true);
  }

  enable(recipient) {
    this._setDisabledState(recipient, false);
  }

  handleEvent(event) {
    if (this.isDestroyed || this.isDestroying) {
      return false;
    }

    const isKeydown = event.type === 'keydown';
    const isKeyup = event.type === 'keyup';

    if (isKeydown || isKeyup) {
      const allEventModifierKeys = {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }
      const eventModifierKeys = A(Object.keys(allEventModifierKeys)
        .filter((key) => {
          return allEventModifierKeys[key] !== false;
        }));
      const matchingMacros = this._findMatchingMacros(
        event.target,
        event.key || '',
        eventModifierKeys,
        event.type
      );

      if (isPresent(matchingMacros)) {
        const isTargetInput = isInputElement(event.target);
        event.stopPropagation();

        matchingMacros.forEach((matchingMacro) => {
          const isDisabled = matchingMacro.isDisabled ||
            (matchingMacro.isDisabledOnInput && isTargetInput);

          if (!isDisabled) {
            matchingMacro.callback(event);
          }
        })
      }
    }
  }

  _findMacroWithElementAndKeyEvent(eventElement, eventKeyEvent) {
    var events = eventKeyEvent === "keydown" ? this.keydownMacros : this.keyupMacros;
    return events.find((macro) => {
      const element = macro.element;
      return eventElement === element;
    });
  }

  _findMatchingMacros(eventElement, eventExecutionKey, eventModifierKeys, eventKeyEvent) {
    var events = eventKeyEvent === "keydown" ? this.keydownMacros : this.keyupMacros;
    const matchingMacros = events.filter((macro) => {
      const element = macro.element;
      const executionKey = macro.executionKey;
      const modifierKeys = macro.modifierKeys;
      const hasElementMatch = element === eventElement || element.contains(eventElement);
      const hasExecutionKeyMatch = eventExecutionKey.toLowerCase() === executionKey.toLowerCase();
      const hasModifierKeysMatch = eventModifierKeys.removeObject(TO_MODIFIER[eventExecutionKey])
        .every((key) => {
          return modifierKeys.toArray().map(k => capitalize(k)).includes(TO_KEY[key]);
        });
      const hasModifierKeyCount = eventModifierKeys.length === modifierKeys.length;

      return hasElementMatch &&
        hasExecutionKeyMatch &&
        hasModifierKeysMatch &&
        hasModifierKeyCount;
    });

    const highestPriority = A(matchingMacros).mapBy('priority')
      .reduce((max, priority) => Math.max(max, priority), -Infinity);

    return matchingMacros.filter((macro) => macro.priority === highestPriority);
  }

  _registerConfigOptions() {
    const config = getOwner(this).lookup('main:key-manager-config');

    if (config) {
      setProperties(this, config);
    }
  }

  _setDisabledState(recipient, isDisabled) {
    if (typeof recipient === 'string') {
      this._setGroupDisabledState(recipient, isDisabled);
    } else {
      recipient.isDisabled = isDisabled;
    }
  }

  _setGroupDisabledState(groupName, isDisabled) {
    this.macros.filterBy('groupName', groupName)
      .setEach('isDisabled', isDisabled);
  }
}
