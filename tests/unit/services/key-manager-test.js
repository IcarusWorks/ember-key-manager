import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import keyCodes from '../../../utils/key-codes';

const {
  get,
  run,
  set,
} = Ember;
const config = {
  disableOnInput: false,
};
const inputElements = [
  'input',
  'textarea',
  'select',
  "[contenteditable='true']",
];

moduleFor('service:key-manager', 'Unit | Service | key manager', {
  beforeEach() {
    Ember.getOwner(this).register('main:key-manager-config', config, {
      instantiate: false,
    });
  },
});

test('handler() executes callback only if event has highest priority', function(assert) {
  assert.expect(4);

  const service = this.subject();
  let priorityComboCallbackCount = 0;
  const priorityCombo = {
    callback() {
      priorityComboCallbackCount += 1;
      assert.ok(
        true,
        'combo with highest priority is called'
      );
    },
    eventName: 'some.eventName.3',
    keys: [
      'enter',
    ],
    priority: 100,
  };
  const combos = [
    {
      eventName: 'some.eventName.1',
      keys: [
        'enter',
      ],
      priority: 0,
    },
    {
      eventName: 'some.eventName.2',
      keys: [
        'enter',
      ],
      priority: 10,
    },
    priorityCombo,
  ];
  const enterEvent = {
    data: {
      eventName: 'some.eventName.3',
    },
    keyCode: keyCodes.enter,
  };

  set(service, 'combos', combos);
  service.handler(enterEvent);

  assert.equal(
    get(service, 'downKeys').length,
    0,
    'enter event key should not be stored'
  );
  assert.equal(
    priorityComboCallbackCount,
    1,
    'highest priority combo callback called once'
  );

  set(priorityCombo, 'priority', 0);
  service.handler(enterEvent);

  assert.equal(
    priorityComboCallbackCount,
    1,
    'highest priority combo callback still only called once, not again'
  );
});

test('register()', function(assert) {
  assert.expect(10);

  const service = this.subject();
  let hasBeenCalled = false;

  service.register({
    keys: ['shift'],
    name: 'workout-select-manager',
    downCallback: () => {},
    upCallback: () => {},
    selector: {
      on(name, data, handler) {
        if (!hasBeenCalled) {
          assert.equal(arguments.length, 3, 'three args should be passed');
          assert.equal(
            name,
            'keyup.key-manager.workout-select-manager.0',
            'name is set'
          );
          assert.ok(
            typeof handler === 'function',
            'handler is a function'
          );
          hasBeenCalled = true;
        }
      },
    },
  });

  assert.equal(
    get(service, 'combos').length,
    2,
    'up and down combo should be set'
  );
  assert.ok(
    get(service, 'combos.lastObject.callback'),
    'combo callback should be set'
  );
  assert.equal(
    get(service, 'combos.lastObject.direction'),
    'down',
    'combo direction should be set'
  );
  assert.equal(
    get(service, 'combos.lastObject.eventName'),
    'keydown.key-manager.workout-select-manager.1',
    'combo eventName should be set'
  );
  assert.equal(
    get(service, 'combos.lastObject.name'),
    'workout-select-manager',
    'combo name should be set'
  );
  assert.deepEqual(
    get(service, 'combos.lastObject.keys'),
    ['shift'],
    'combo keys should be set'
  );
  assert.ok(
    get(service, 'combos.lastObject.selector'),
    'combo selector should be set'
  );
});

test('deregister()', function(assert) {
  assert.expect(5);

  const service = this.subject();
  set(service, 'combos', [
    {
      name: 'name1',
      eventName: 'eventName1',
      selector: {
        off(eventName) {
          assert.equal(
            eventName,
            'eventName1',
            'off is called with correct event name'
          );
        },
      },
    },
    {
      name: 'name1',
      eventName: 'eventName1.stuff',
      selector: {
        off(eventName) {
          assert.equal(
            eventName,
            'eventName1.stuff',
            'off is called with correct event name'
          );
        },
      },
    },
    {
      name: 'name2',
      eventName: 'eventName2',
      selector: {
      },
    },
    {
      name: 'name3',
      eventName: 'eventName3',
      selector: {
        off(eventName) {
          assert.equal(
            eventName,
            'eventName3',
            'off is called with correct event name'
          );
        },
      },
    },
  ]);
  assert.equal(
    get(service, 'combos').length,
    4,
    'should have 4 combos to start'
  );

  service.deregister({name: 'name1'});
  service.deregister({name: 'name3'});

  assert.equal(
    get(service, 'combos').length,
    1,
    'should have 1 combo after deregisters'
  );
});

test('clears execution keys', function(assert) {
  assert.expect(3);

  const service = this.subject({
    _clearExecutionKeysOnInterval() {
      assert.ok(true, 'start interval called once on init, once on clear execution');
    },
  });
  set(service, 'downKeys', [keyCodes.p, keyCodes.a, keyCodes.l, keyCodes.shift]);
  service._clearExecutionKeys(true);
  assert.deepEqual(
    get(service, 'downKeys'),
    [keyCodes.shift],
    'execution keys should be cleared'
  );
});

test('sets defaults on init', function(assert) {
  assert.expect(1);

  const config = Ember.getOwner(this).lookup('main:key-manager-config');
  set(config, 'disableOnInput', true);

  const service = this.subject();
  assert.ok(get(service, 'disableOnInput'), 'disableOnInput is true from config.');
});

test('disableOnInput disables callback if focused on input', function(assert) {
  assert.expect(1);
  const done = assert.async();

  const service = this.subject();
  const combo = {
    callback() {
      assert.ok(true, 'callback is invoked only once.');
    },
    eventName: 'some.eventName.1',
    keys: [
      'enter',
    ],
    disableOnInput: true,
    priority: 0,
  };
  const combos = [
    combo,
  ];

  set(service, 'combos', combos);

  const enterEvent = {
    data: {
      eventName: 'some.eventName.1',
    },
    keyCode: keyCodes.enter,
  };

  service.handler(enterEvent);

  inputElements.forEach((e, i) => {
    $().add('input').focus();
    run.next(() => {
      service.handler(enterEvent);
      if (i === (inputElements.length - 1)) {
        done();
      }
    });
  });
});
