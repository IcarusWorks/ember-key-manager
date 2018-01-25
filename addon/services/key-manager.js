import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import Macro from '../utils/macro';
import MODIFIER_KEYS from '../utils/modifier-keys';
import {
  get,
  getProperties,
  set,
  setProperties,
} from '@ember/object';
import { debounce } from '@ember/runloop';
import {
  filterBy,
} from '@ember/object/computed';

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

  keydownMacros: filterBy('macros', 'keyEvent', 'keydown'),
  keyupMacros: filterBy('macros', 'keyEvent', 'keyup'),

  init() {
    this.macros = [];
    this._registerConfigOptions();
  },

  addMacro(options) {
    const macroAttrs = this._mergeConfigDefaults(options);
    const macro = Macro.create();
    macro.setup(macroAttrs);

    const keyEvent = get(macro, 'keyEvent');
    const element = get(macro, 'element');
    this._addEventListener(element, keyEvent);

    const macros = get(this, 'macros');
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
    const macros = get(this, 'macros');

    macros.removeObject(macro);

    this._removeEventListenter(element, keyEvent);
  },

  _removeEventListenter(element, keyEvent) {
    const hasListenerForElementAndKeyEvent = this._findMacroWithElementAndKeyEvent(element, keyEvent);
    if (!hasListenerForElementAndKeyEvent) {
      element.removeEventListener(keyEvent, this);
    }
  },

  disable(recipient) {
    this._setDisabledState(recipient, true);
  },

  enable(recipient) {
    this._setDisabledState(recipient, false);
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
      const matchingMacros = this._findMatchingMacros(
        event.target,
        event.key,
        eventModifierKeys,
        event.type
      );

      if (matchingMacros) {
        const isTargetInput = isInputElement(event.target);

        matchingMacros.forEach((matchingMacro) => {
          const isDisabled = get(matchingMacro, 'isDisabled') ||
            (get(matchingMacro, 'isDisabledOnInput') && isTargetInput);

          if (!isDisabled) {
            get(matchingMacro, 'callback')(event);
          }
        })
      }
    }
  },

  _findMacroWithElementAndKeyEvent(eventElement, eventKeyEvent) {
    return get(this, `${eventKeyEvent}Macros`).find((macro) => {
      const element = get(macro, 'element');
      return eventElement === element;
    });
  },

  _findMatchingMacros(eventElement, eventExecutionKey, eventModifierKeys, eventKeyEvent) {
    const matchingMacros = get(this, `${eventKeyEvent}Macros`).filter((macro) => {
      const {
        element,
        executionKey,
        modifierKeys,
      } = getProperties(macro, ['element', 'executionKey', 'modifierKeys']);
      const hasElementMatch = element === eventElement || element.contains(eventElement);
      const hasExecutionKeyMatch = eventExecutionKey === executionKey;
      const hasModifierKeysMatch = eventModifierKeys.every((key) => {
        return modifierKeys.includes(MODIFIER_KEYS[key]);
      });
      const hasModifierKeyCount = eventModifierKeys.length === modifierKeys.length;

      return hasElementMatch &&
        hasExecutionKeyMatch &&
        hasModifierKeysMatch &&
        hasModifierKeyCount;
    });

    const highestPriority = matchingMacros.mapBy('priority')
      .reduce((max, priority) => Math.max(max, priority), -Infinity);

    return matchingMacros.filter((macro) => get(macro, 'priority') === highestPriority);
  },

  _registerConfigOptions() {
    const config = getOwner(this).lookup('main:key-manager-config');

    if (config) {
      setProperties(this, config);
    }
  },

  _setDisabledState(recipient, isDisabled) {
    if (typeof recipient === 'string') {
      this._setGroupDisabledState(recipient, isDisabled);
    } else {
      set(recipient, 'isDisabled', isDisabled);
    }
  },

  _setGroupDisabledState(groupName, isDisabled) {
    get(this, 'macros').filterBy('groupName', groupName)
      .setEach('isDisabled', isDisabled);
  },
});
