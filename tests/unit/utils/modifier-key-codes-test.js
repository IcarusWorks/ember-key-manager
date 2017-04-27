import { module, test } from 'qunit';
import modifierKeyCodes from '../../../utils/modifier-key-codes';
import modifierKeys from '../../../utils/modifier-key-codes';

module('Unit | Utility | modifier key codes');

test('modifiers are defined', function(assert) {
  assert.expect(2);

  assert.equal(
    modifierKeys.length,
    4,
    'codes are defined'
  );
  assert.equal(
    modifierKeyCodes.length,
    4,
    'codes are defined'
  );
});
