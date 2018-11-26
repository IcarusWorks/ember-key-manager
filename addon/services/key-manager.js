import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';
import Macro from '../utils/macro';
import { TO_MODIFIER, TO_KEY } from '../utils/modifier-keys';
import {
  get,
  getProperties,
  set,
  setProperties,
} from '@ember/object';
import {
  filterBy,
} from '@ember/object/computed';
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

export default Service.extend({
  isDisabledOnInput: false, // Config option

  keydownMacros: filterBy('macros', 'keyEvent', 'keydown'),
  keyupMacros: filterBy('macros', 'keyEvent', 'keyup'),

  init() {
    this._super(...arguments);
    this.macros = A();
    this._registerConfigOptions();
  },

  addMacro(options) {
    const macroAttrs = this._mergeConfigDefaults(options);
    const macro = Macro.create();
    macro.setup(macroAttrs);

    const keyEvent = get(macro, 'keyEvent');
    this._handleModifiersOnKeyup(macro, keyEvent);
    const element = get(macro, 'element');
    this._addEventListener(element, keyEvent);

    const macros = get(this, 'macros');
    macros.pushObject(macro);

    return macro;
  },

  _handleModifiersOnKeyup({ modifierKeys }, keyEvent) {
    if (keyEvent === 'keyup' && isPresent(modifierKeys)) {
      warn(MODIFIERS_ON_KEYUP_WARNING, false, {id: 'keyup-with-modifiers'});
    }
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
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) {
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
        event.key,
        eventModifierKeys,
        event.type
      );

      if (isPresent(matchingMacros)) {
        const isTargetInput = isInputElement(event.target);
        event.stopPropagation();

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
