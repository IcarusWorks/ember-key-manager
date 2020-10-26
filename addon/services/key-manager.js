import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import Macro from '../utils/macro';
import { TO_MODIFIER, TO_KEY } from '../utils/modifier-keys';
import {
  get,
  getProperties,
  setProperties,
} from '@ember/object';
import { A } from '@ember/array';
import { warn } from '@ember/debug';
import { isPresent, } from '@ember/utils';
import {
  MODIFIERS_ON_KEYUP as MODIFIERS_ON_KEYUP_WARNING,
} from 'ember-key-manager/utils/warning-messages';

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

  constructor(...args) {
    super(...args);
    this._registerConfigOptions();
  }

  get keydownMacros() {
    return this.macros.filter(m => m.keyEvent === 'keydown');
  }
  get keyupMacros() {
    return this.macros.filter(m => m.keyEvent === 'keyup');
  }

  addMacro(options) {
    const macroAttrs = this._mergeConfigDefaults(options);
    const macro = Macro.create();
    macro.setup(macroAttrs);

    const keyEvent = macro.keyEvent;
    this._handleModifiersOnKeyup(macro, keyEvent);
    const element = macro.element;
    this._addEventListener(element, keyEvent);

    this.macros.pushObject(macro);

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

    this.macros.removeObject(macro);

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
      const eventModifierKeys = Object.keys(allEventModifierKeys)
        .filter((key) => {
          return allEventModifierKeys[key] !== false;
        });
      const matchingMacros = this._findMatchingMacros(
        event.target,
        event.key,
        A(eventModifierKeys),
        event.type
      );

      if (matchingMacros) {
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
    const isKeydown = eventKeyEvent === 'keydown';
    const macros = isKeydown ? this.keydownMacros : this.keyupMacros;
    return macros.find((macro) => {
      const element = macro.element;
      return eventElement === element;
    });
  }

  _findMatchingMacros(eventElement, eventExecutionKey, eventModifierKeys, eventKeyEvent) {
    const isKeydown = eventKeyEvent === 'keydown';
    const macros = isKeydown ? this.keydownMacros : this.keyupMacros;
    const matchingMacros = macros.filter((macro) => {
      const {
        element,
        executionKey,
        modifierKeys,
      } = getProperties(macro, ['element', 'executionKey', 'modifierKeys']);
      const hasElementMatch = element === eventElement || element.contains(eventElement);
      const hasExecutionKeyMatch = eventExecutionKey.toLowerCase() === executionKey.toLowerCase();
      const hasModifierKeysMatch = eventModifierKeys.removeObject(TO_MODIFIER[eventExecutionKey])
        .every((key) => {
          return modifierKeys.map(k => k.capitalize()).includes(TO_KEY[key]);
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
};
