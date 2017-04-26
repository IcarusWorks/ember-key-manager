import Ember from 'ember';
import keyCodes from '../utils/key-codes';
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

  // config options
  disableOnInput: false,

  init() {
    this._super(...arguments);
    set(this, 'combos', []);
    this._resetDownKeys();
    document.addEventListener(
      'visibilitychange',
      run.bind(this, this._handleVisibilityChange),
      false
    );
    window.onblur = () => {
      this._resetDownKeys();
    };
    this._clearExecutionKeysOnInterval();
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

    const { data } = event;

    get(this, 'downKeys').addObject(event.keyCode);

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

  _clearExecutionKeys(onInterval) {
    const executionKeys = Object.keys(keyCodes).map((key) => {
        return keyCodes[key];
      })
      .reject((code) => {
        return modifierKeyCodes.includes(code);
      });
    get(this, 'downKeys').removeObjects(executionKeys);

    if (onInterval) {
      this._clearExecutionKeysOnInterval();
    }
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
      const keys = get(combo, 'keys');
      const sameLength = keys.length === downKeys.length;
      return sameLength && keys.every((key) => {
        return downKeys.includes(keyCodes[key]);
      });
    });
  },

  _handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this._resetDownKeys();
    }
  },

  _resetDownKeys() {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) {
      return;
    }

    set(this, 'downKeys', []);
  },

  _clearExecutionKeysOnInterval() {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) {
      return;
    }

    const previousLater = get(this, 'clearExecutionKeysLater');
    run.cancel(previousLater);

    const interval = get(this, 'executionKeyClearInterval');
    const clearLater = run.later(() => {
      this._clearExecutionKeys(true);
    }, interval);
    set(this, 'clearExecutionKeysLater', clearLater);
  },

  _registerConfig() {
    const config = getOwner(this).lookup('main:key-manager-config');
    if (config) {
      setProperties(this, config);
    }
  },
});
