import Service from '@ember/service';
import $ from 'jquery';
import { getOwner } from '@ember/application';
import { run } from '@ember/runloop';
import { setProperties, set, get, computed } from '@ember/object';
import keyCodes from '../utils/key-codes';
import modifierKeys from '../utils/modifier-keys';
import modifierKeyCodes from '../utils/modifier-key-codes';
import Combo from '../utils/combo';

const eventNamespace = 'key-manager';
const inputElements = [
  'input',
  'textarea',
  'select',
  `[contenteditable='true']`,
];


export default Service.extend({
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
      const combo = Combo.create({
        callback,
        direction,
        eventName,
        keys,
        name,
        selector,
        priority,
        uid,
        disableOnInput,
      });

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

      modifierKeys.forEach((key) => {
        const prop = `${key}Key`;
        set(this, prop, event[prop]);
      });

      if (!modifierKeyCodes.includes(keyCode)) {
        get(this, 'downKeys').addObject(keyCode);
      }

      return this._findComboByName(eventName);
    } finally {
      this._clearExecutionKeys(event);
    }
  },

  handler(event) {
    if (get(this, 'isDestroyed') || get(this, 'isDestroying')) { return; }

    const combo = this.findMatchingCombo(event);
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
  },

  executionKeys: computed(function() {
    return Object.keys(keyCodes).map((key) => {
      return keyCodes[key];
    }).reject((code) => {
      return modifierKeyCodes.includes(code);
    });
  }),

  _clearExecutionKeys(event) {
    if (event.type === 'keyup') {
      get(this, 'downKeys').removeObject(event.keyCode);
    }
    get(this, 'downKeys').removeObjects(this.get('executionKeys'));
  },

  _findComboByName(eventName) {
    const combos = get(this, 'combos');
    const comboWithName = combos.findBy('eventName', eventName);

    if (!this.isComboKeyMatch(comboWithName)) { return; }

    const highestPriorityCombo = this._combosWithKeys(combos)
      .sortBy('priority')
      .get('lastObject');

    // Matching Event is Combo with Highest Priority
    if (get(comboWithName, 'priority') >= get(highestPriorityCombo, 'priority')) {
      return comboWithName;
    }
  },

  _combosWithKeys(combos) {
    return combos.filter(c => this.isComboKeyMatch(c));
  },

  pressedModifiers: computed('altKey', 'ctrlKey', 'metaKey', 'shiftKey', {
    get() {
      return modifierKeys.filter(key => get(this, `${key}Key`));
    }
  }),

  isComboKeyMatch(combo) {
    if (!combo) { return; }

    const downKeys = get(this, 'downKeys');
    const pressedModifiers = get(this, 'pressedModifiers');

    let comboKeys = get(combo, 'keys');
    let comboModifierKeys = get(combo, 'modifierKeys');
    let comboExecutionKeys = get(combo, 'executionKeys');

    return (comboKeys.length === pressedModifiers.length + downKeys.length) &&
    // Filter Combos with Matching Modifier Keys
    comboModifierKeys.every(k => pressedModifiers.includes(k)) &&
    // Filter Combos with Matching Execution Keys
    comboExecutionKeys.every(k => downKeys.includes(keyCodes[k]));
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
