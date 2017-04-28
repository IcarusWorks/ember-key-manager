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
  ctrlKey: false,
  metaKey: false,

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

  handler(event) {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) {
      return;
    }
    const {
      data,
      keyCode,
    } = event;

    if (!modifierKeyCodes.includes(keyCode)) {
      get(this, 'downKeys').addObject(keyCode);
    }

    modifierKeys.forEach((key) => {
      const prop = `${key}Key`;
      set(this, prop, event[prop]);
    });

    if (data) {
      const { eventName } = data;
      const combo = this._findComboByName(eventName);
      const runLoopGuard = !get(this, 'matchFound');

      if (combo && runLoopGuard) {
        set(this, 'matchFound', true);
        run.next(() => {
          set(this, 'matchFound', false);
        });

        const isNotOnInput = inputElements.every(e => !$(document.activeElement).is(e));
        if (!get(combo, 'disableOnInput') || isNotOnInput) {
          const callback = get(combo, 'callback');
          if (callback) {
            callback(event);
          }
        }
      }
    }

    if (event.type === 'keyup') {
      get(this, 'downKeys').removeObject(event.keyCode);
    }

    this._clearExecutionKeys();
  },

  _clearExecutionKeys() {
    const executionKeys = Object.keys(keyCodes).map((key) => {
        return keyCodes[key];
      })
      .reject((code) => {
        return modifierKeyCodes.includes(code);
      });
    get(this, 'downKeys').removeObjects(executionKeys);
  },

  _findComboByName(eventName) {
    const combos = get(this, 'combos');
    const combosWithKeys = this._combosWithKeys(combos)
      .sortBy('priority');
    const comboWithName = combosWithKeys.findBy('eventName', eventName);

    if (!comboWithName) {
      return false;
    }

    const highestPriority = get(combosWithKeys, 'lastObject.priority');
    const comboWithNamePriority = get(comboWithName, 'priority');

    if (comboWithNamePriority >= highestPriority) {
      return comboWithName;
    }
  },

  _combosWithKeys(combos) {
    const downKeys = get(this, 'downKeys');
    return combos.filter((combo) => {
      const keys = get(combo, 'keys').slice();

      const verifyModifiers = modifierKeys.every((key) => {
        return !get(this, `${key}Key`) || keys.includes(key);
      });
      keys.removeObjects(modifierKeys);

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
