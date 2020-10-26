import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import KeyManagerService from 'ember-key-manager/services/key-manager';
import Macro from 'ember-key-manager/utils/macro';

module('Integration | Modifier | key-down', function(hooks) {
  setupRenderingTest(hooks);

  test('it creates a keydown macro in the key manager service', async function(assert: Assert) {
    await render(hbs`<div data-test-host {{key-down executionKey="Q" modifierKeys=(array "Shift" "Cmd") }}></div>`);
    var service: KeyManagerService = this.owner.lookup("service:key-manager");
    assert.equal(service.keydownMacros.length, 1);
    var macro = service.keydownMacros[0] as Macro;
    assert.equal(macro.executionKey, "Q");
    assert.deepEqual(macro.modifierKeys, ["Shift", "Cmd"]);
  });
});
