import { module, test } from 'qunit';
import keyCodes from '../../../utils/key-codes';

module('Unit | Utility | key codes');

test('keycodes are defined', function(assert) {
  assert.expect(1);

  const result = keyCodes;
  assert.equal(
    Object.keys(result).length,
    162,
    'codes are defined'
  );
});
