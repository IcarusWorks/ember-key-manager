import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import KeyManagerService from 'ember-key-manager/services/key-manager';
import Macro from 'ember-key-manager/utils/macro';

module('Integration | Modifier | key-up', function(hooks) {
  setupRenderingTest(hooks);

  test('it creates a keyup macro in the key manager service', async function(assert: Assert) {
    await render(hbs`<div data-test-host {{key-up executionKey="S" modifierKeys=(array "Ctrl" "Cmd") }}></div>`);
    var service: KeyManagerService = this.owner.lookup("service:key-manager");
    assert.equal(service.keyupMacros.length, 1);
    var macro = service.keyupMacros[0] as Macro;
    assert.equal(macro.executionKey, "S");
    assert.deepEqual(macro.modifierKeys, ["Ctrl", "Cmd"]);
  });

});
