import Ember from 'ember';
import modifierKeys from '../utils/modifier-keys';

const {
  computed,
  get,
} = Ember;

export default Ember.Object.extend({
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
