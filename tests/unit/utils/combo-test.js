import Combo from 'dummy/utils/combo';
import Ember from 'ember';
import { module, test } from 'qunit';

const { get } = Ember;

module('Unit | Utility | combo');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = Combo.create({});
  assert.ok(result);
});

test('with keys', function(assert) {
  let combo = Combo.create({
    keys: ['alt', 'b']
  });
  assert.deepEqual(get(combo, 'executionKeys'), ['b']);
  assert.deepEqual(get(combo, 'modifierKeys'), ['alt']);
});
