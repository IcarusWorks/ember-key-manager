import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import {
  set,
  setProperties,
} from '@ember/object';
import {
  bind,
} from '@ember/runloop';
import { isPresent } from '@ember/utils';
import {
  empty,
  equal,
} from '@ember/object/computed';

const defaults = {
  executionKey: null,
  modifierKeys: '',
  priority: 0,
  keyEvent: 'keydown',
  groupName: null,
};

export default Controller.extend({
  keyManager: service(),

  macro: null,

  init() {
    this._super(...arguments);
    this.reset();
  },

  isKeydown: equal('keyEvent', 'keydown'),
  hasNoExecutionKey: empty('executionKey'),
  hasNoMacro: empty('macro'),

  actions: {
    addMacro({executionKey, modifierKeys, priority, keyEvent, groupName}) {
      this.send('removeMacro', this.macro);
      modifierKeys = isPresent(modifierKeys) ? modifierKeys.split(',') : [];

      let count = 0;

      const macro = this.keyManager.addMacro({
        callback: bind(this, function() {
          count++;
          this.callbackMessage = `Callback is invoked ${count} times.`;
        }),
        executionKey,
        priority,
        keyEvent,
        modifierKeys,
        groupName,
      });
      set(this, 'macro', macro);
      set(this, 'callbackMessage', null);
      this.reset();
    },

    removeMacro(macro) {
      if (macro) {
        this.keyManager.removeMacro(macro);
        set(this, 'macro', null);
      }
    },
  },

  reset() {
    setProperties(this, defaults);
  },
});
