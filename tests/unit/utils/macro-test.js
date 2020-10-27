import Macro from 'dummy/utils/macro';
import { module, test } from 'qunit';

module('Unit | Utility | macro', function() {
  const mockAttrs = {
    callback: null,
    executionKey: 'a',
    modifierKeys: ['shift', 'cmd'],
    priority: 100,
    type: 'keydown',
  }

  test('it sets properties correctly', function(assert) {
    assert.expect(8);

    const macro = new Macro({
      callback: () => {
        assert.ok(true);
      },
      executionKey: mockAttrs.executionKey,
      modifierKeys: mockAttrs.modifierKeys,
      priority: mockAttrs.priority,
      keyEvent: mockAttrs.type
    });

    macro.callback();

    assert.ok(typeof macro.callback === 'function');
    assert.equal(macro.element, document.body);
    assert.equal(macro.executionKey, mockAttrs.executionKey);
    assert.equal(macro.isDisabledOnInput, false);
    assert.deepEqual(macro.modifierKeys, mockAttrs.modifierKeys);
    assert.equal(macro.priority, mockAttrs.priority);
    assert.equal(macro.keyEvent, mockAttrs.type);
  });
});
