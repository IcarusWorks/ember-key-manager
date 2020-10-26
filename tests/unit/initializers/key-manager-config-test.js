import Application from '@ember/application';
import { run } from '@ember/runloop';
import { initialize } from 'dummy/initializers/key-manager-config';
import { module, test } from 'qunit';

module('Unit | Initializer | key manager config', function(hooks) {
  hooks.beforeEach(function() {
    run(() => {
      this.application = Application.create();
      this.application.deferReadiness();
    });
  });

  hooks.afterEach(function() {
    run(this.application, 'destroy');
  });

  test('it registers the config', function(assert) {
    assert.expect(1);

    initialize(this.application);

    const config = this.application.__container__.lookup('main:key-manager-config');
    assert.ok(!!config, 'config is registered on the container.');
  });
});
