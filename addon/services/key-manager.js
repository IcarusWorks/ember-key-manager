import Ember from 'ember';
import keyCodes from '../utils/key-codes';
import modifierKeys from '../utils/modifier-keys';
import modifierKeyCodes from '../utils/modifier-key-codes';

const {
  $,
  get,
  getOwner,
  run,
  set,
  setProperties,
} = Ember;
const eventNamespace = 'key-manager';
const inputElements = [
  'input',
  'textarea',
  'select',
  "[contenteditable='true']",
];

export default Ember.Service.extend({
  clearExecutionKeysLater: null,
  executionKeyClearInterval: 2000,
  matchFound: false,
  uid: 0,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,

  // config options
  disableOnInput: false,

  init() {
    this._super(...arguments);
    set(this, 'combos', []);
    this._resetDownKeys();
    this._registerConfig();
  },

  register({keys, name, selector=$(document), downCallback, upCallback, priority=0, disableOnInput}) {
    disableOnInput = disableOnInput || get(this, 'disableOnInput');

    ['up', 'down'].forEach((direction) => {
      const uid = get(this, 'uid');
      const callback = direction === 'up' ? upCallback : downCallback;
      const eventName = `key${direction}.${eventNamespace}.${name}.${uid}`;
      const combo = {
        callback,
        direction,
        eventName,
        keys,
        name,
        selector,
        priority,
        uid,
        disableOnInput,
      };

      get(this, 'combos').pushObject(combo);
      selector.on(eventName, {
        eventName,
      }, run.bind(this, this.handler));
      this.incrementProperty('uid');
    });
  },

  deregister({name}) {
    const combos = get(this, 'combos');
    const comboMatches = combos.filterBy('name', name);

    comboMatches.forEach((comboMatch) => {
      const {
        eventName,
        selector,
      } = comboMatch;

      selector.off(eventName);
      combos.removeObject(comboMatch);
    });
  },

  findMatchingCombo(event) {
    try {
      const { data, keyCode } = event;
      const { eventName = null } = data;

      if (!modifierKeyCodes.includes(keyCode)) {
        get(this, 'downKeys').addObject(keyCode);
      }
      let combo = this._findComboByName(eventName);
      if (!combo) { return; }

      const isNotOnInput = inputElements.every((e) => {
        return !$(document.activeElement).is(e);
      });

      if (!get(combo, 'disableOnInput') || isNotOnInput) {
        const callback = get(combo, 'callback') || function() {};
        callback(event);
      }
    } finally {
      this._clearDownKeys(event);
    }
  },

  handler(event) {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) { return; }

    modifierKeys.forEach((key) => {
      const prop = `${key}Key`;
      set(this, prop, event[prop]);
    });

    this.findMatchingCombo(event);
  },

  executionKeys: Ember.computed(function() {
    return Object.keys(keyCodes).map((key) => {
      return keyCodes[key];
    }).reject((code) => {
      return modifierKeyCodes.includes(code);
    });
  }),

  _clearDownKeys(event) {
    if (event.type === 'keyup') {
      get(this, 'downKeys').removeObject(event.keyCode);
    }

    get(this, 'downKeys').removeObjects(this.get('executionKeys'));
  },

  _findComboByName(eventName) {
    const combos = get(this, 'combos');
    const comboWithName = combos.findBy('eventName', eventName);
    const keyMatchFound = this._combosWithKeys([comboWithName]).length;
    if (!keyMatchFound) { return; }

    const combosWithKeys = this._combosWithKeys(combos).sortBy('priority');
    const highestPriority = get(combosWithKeys, 'lastObject.priority');
    const comboWithNamePriority = get(comboWithName, 'priority');

    if (comboWithNamePriority >= highestPriority) {
      return comboWithName;
    }
  },

  _combosWithKeys(combos) {
    const downKeys = get(this, 'downKeys');
    const pressedModifiers = modifierKeys.filter((key) => {
      return get(this, `${key}Key`);
    });

    return combos.filter((combo) => {
      const keys = get(combo, 'keys').slice();
      const verifyModifiers = pressedModifiers.every(m => keys.includes(m));
      keys.removeObjects(pressedModifiers);

      const sameLength = keys.length === downKeys.length;
      const isMatch = keys.every((key) => {
        return downKeys.includes(keyCodes[key]);
      });

      return sameLength &&
        isMatch &&
        verifyModifiers;
    });
  },

  _resetDownKeys() {
    set(this, 'downKeys', []);
  },

  _registerConfig() {
    const config = getOwner(this).lookup('main:key-manager-config');
    if (config) {
      setProperties(this, config);
    }
  },
});
