import Application from '@ember/application';
import { run } from '@ember/runloop';
import { initialize } from 'dummy/initializers/key-manager-config';
import { module, test } from 'qunit';
import destroyApp from '../../helpers/destroy-app';

module('Unit | Initializer | key manager config', {
  beforeEach() {
    run(() => {
      this.application = Application.create();
      this.application.deferReadiness();
    });
  },
  afterEach() {
    destroyApp(this.application);
  }
});

test('it registers the config', function(assert) {
  assert.expect(1);

  initialize(this.application);

  const config = this.application.__container__.lookup('main:key-manager-config');
  assert.ok(!!config, 'config is registered on the container.');
});
