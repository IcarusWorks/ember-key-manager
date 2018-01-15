import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import Macro from '../utils/macro';
import {
  get,
  getProperties,
  set,
  setProperties,
} from '@ember/object';
import { debounce } from '@ember/runloop';

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

export default Service.extend({
  isDisabledOnInput: false, // Config option

  init() {
    this.keydownMacros = [];
    this.keyupMacros = [];
    this._registerConfigOptions();
  },

  addMacro(options) {
    const macroAttrs = this._mergeConfigDefaults(options);
    const macro = Macro.create();
    macro.setup(macroAttrs);

    const keyEvent = get(macro, 'keyEvent');
    const element = get(macro, 'element');
    this._addEventListener(element, keyEvent);

    const macros = get(this, `${keyEvent}Macros`);
    macros.pushObject(macro);

    return macro;
  },

  _mergeConfigDefaults(attrs) {
    const isDisabledOnInput = get(this, 'isDisabledOnInput');
    return assign({ isDisabledOnInput }, attrs);
  },

  _addEventListener(element, keyEvent) {
    const hasListenerForElementAndKeyEvent = this._findMacroWithElementAndKeyEvent(element, keyEvent);
    if (!hasListenerForElementAndKeyEvent) {
      element.addEventListener(keyEvent, this);
    }
  },

  removeMacro(macro) {
    const element = get(macro, 'element');
    const keyEvent = get(macro, 'keyEvent');
    const macros = get(this, `${keyEvent}Macros`);

    macros.removeObject(macro);

    this._removeEventListenter(element, keyEvent);
  },

  _removeEventListenter(element, keyEvent) {
    const hasListenerForElementAndKeyEvent = this._findMacroWithElementAndKeyEvent(element, keyEvent);
    if (!hasListenerForElementAndKeyEvent) {
      element.removeEventListener(keyEvent, this);
    }
  },

  handleEvent(event) {
    const isServiceDestroyed = get(this, 'isDestroyed') || get(this, 'isDestroying');

    if (isServiceDestroyed) {
      return false;
    }

    set(this, 'event', event);

    debounce(this, this._handleEvent, 100);
  },

  _handleEvent() {
    const event = get(this, 'event');
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
      const matchingMacro = this._findMatchingMacro(
        event.target,
        event.key,
        eventModifierKeys,
        event.type
      );

      if (matchingMacro) {
        const isTargetInput = isInputElement(event.target);
        const isDisabled = get(matchingMacro, 'isDisabledOnInput') && isTargetInput;

        if (!isDisabled) {
          get(matchingMacro, 'callback')(event);
        }
      }
    }
  },

  _findMacroWithElementAndKeyEvent(eventElement, eventKeyEvent) {
    return get(this, `${eventKeyEvent}Macros`).find((macro) => {
      const element = get(macro, 'element');
      return eventElement === element;
    });
  },

  _findMatchingMacro(eventElement, eventExecutionKey, eventModifierKeys, eventKeyEvent) {
    const matchingMacros = get(this, `${eventKeyEvent}Macros`).filter((macro) => {
      const {
        element,
        executionKey,
        modifierKeys,
      } = getProperties(macro, ['element', 'executionKey', 'modifierKeys']);
      const hasElementMatch = element === eventElement || element.contains(eventElement);
      const hasExecutionKeyMatch = eventExecutionKey === executionKey;
      const hasModifierKeysMatch = eventModifierKeys.every((key) => {
        return modifierKeys.includes(key);
      });
      const hasModifierKeyCount = eventModifierKeys.length === modifierKeys.length;

      return hasElementMatch &&
        hasExecutionKeyMatch &&
        hasModifierKeysMatch &&
        hasModifierKeyCount;
    });
    const sortedMatchingMacros = matchingMacros.sort((a, b) => {
      return get(b, 'priority') - get(a, 'priority');
    });

    return sortedMatchingMacros[0];
  },

  _registerConfigOptions() {
    const config = getOwner(this).lookup('main:key-manager-config');

    if (config) {
      setProperties(this, config);
    }
  },
});
