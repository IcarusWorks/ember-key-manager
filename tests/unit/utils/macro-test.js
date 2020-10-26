import { get } from '@ember/object';
import { assign } from '@ember/polyfills';
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

    const macro = Macro.create();
    const callback = () => {
      assert.ok(true);
    }
    const attrs = assign(mockAttrs, {
      callback,
    });

    macro.setup(attrs);
    macro.callback();

    assert.ok(typeof get(macro, 'callback') === 'function');
    assert.equal(get(macro, 'element'), document.body);
    assert.equal(get(macro, 'executionKey'), mockAttrs.executionKey);
    assert.equal(get(macro, 'isDisabledOnInput'), false);
    assert.deepEqual(get(macro, 'modifierKeys'), mockAttrs.modifierKeys);
    assert.equal(get(macro, 'priority'), mockAttrs.priority);
    assert.equal(get(macro, 'type'), mockAttrs.type);
  });
});
