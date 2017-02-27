import { module, test } from 'qunit';
import modifierKeyCodes from '../../../utils/modifier-key-codes';

module('Unit | Utility | modifier key codes');

test('modifiers are defined', function(assert) {
  assert.expect(1);

  const result = modifierKeyCodes;
  assert.equal(
    result.length,
    7,
    'codes are defined'
  );
});
