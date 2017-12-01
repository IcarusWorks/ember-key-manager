import EmberObject, { get, computed } from '@ember/object';
import modifierKeys from '../utils/modifier-keys';

export default EmberObject.extend({
  modifierKeys: computed('keys', {
    get() {
      const keys = get(this, 'keys');
      return keys.filter(k => modifierKeys.includes(k));
    },
  }),

  executionKeys: computed('keys', {
    get() {
      const keys = get(this, 'keys');
      return keys.filter(k => !modifierKeys.includes(k));
    }
  }),
});
