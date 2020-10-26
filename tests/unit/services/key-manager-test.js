import {
  set,
} from '@ember/object';
import { assign } from '@ember/polyfills';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import {
  focus,
} from 'ember-native-dom-helpers';
import { Promise } from 'rsvp';
import {
  triggerKeyEvent,
} from '@ember/test-helpers';
import {
  MODIFIERS_ON_KEYUP as MODIFIERS_ON_KEYUP_WARNING,
} from 'ember-key-manager/utils/warning-messages';
import { registerWarnHandler } from '@ember/debug';

const configOptions = {
  isDisabledOnInput: false,
};
let config;
let warnings;

registerWarnHandler((message, options, next) => {
  warnings.push(message);
  next(message, options);
});

async function dispatchEvent(element, eventDetails) {
  await triggerKeyEvent(element, eventDetails.type, eventDetails.key, eventDetails.modifiers)
  return eventDetails;
}

let firstMacroCallCount = 0;
let secondMacroCallCount = 0;
let thirdMacroCallCount = 0;
let fourthMacroCallCount = 0;
let fifthMacroCallCount = 0;
const div = document.createElement('DIV');

const firstMacroAttrs = {
  callback: function() {
    firstMacroCallCount += 1;
  },
  element: div,
  executionKey: 'Shift',
  keyEvent: 'keydown',
  groupName: 'group 1',
};

const secondMacroAttrs = {
  callback: function() {
    secondMacroCallCount += 1;
  },
  executionKey: 'A',
  modifierKeys: ['Control', 'Alt'],
  priority: 100,
  keyEvent: 'keydown',
  groupName: 'group 1',
};

// thirdMacro
//
// Same as `secondMacro` except:
// * `element` is set to a `div`
// * `executionKey` is set to 'b'
//
const thirdMacroAttrs = {
  callback: function() {
    thirdMacroCallCount += 1;
  },
  element: div,
  executionKey: 'B',
  modifierKeys: ['Control', 'Alt'],
  keyEvent: 'keydown',
};

// fourthMacro
//
// Same as `secondMacro` except:
// * `keyEvent` is set to a `keyup`
//
const fourthMacroAttrs = {
  callback: function() {
    fourthMacroCallCount += 1;
  },
  executionKey: 'A',
  modifierKeys: ['Control', 'Alt'],
  keyEvent: 'keyup',
};

// fifthMacro
//
// Same as `secondMacro` except:
// * `priority` is lower
//
const fifthMacroAttrs = {
  callback: function() {
    fifthMacroCallCount += 1;
  },
  executionKey: 'A',
  modifierKeys: ['Control', 'Alt'],
  priority: 1,
  keyEvent: 'keydown',
};

const firstMacroEvent = {
  type: 'keydown',
  key: 'Shift',
};

const secondMacroEvent = {
  type: 'keydown',
  modifiers: {
    altKey: true,
    ctrlKey: true,
  },
  key: 'A',
};

const thirdMacroEvent = {
  type: 'keydown',
  modifiers: {
    altKey: true,
    ctrlKey: true,
  },
  key: 'B',
};

const fourthMacroEvent = {
  type: 'keyup',
  modifiers: {
    altKey: true,
    ctrlKey: true,
  },
  key: 'A',
};

const fifthMacroEvent = {
  type: 'keydown',
  modifiers: {
    altKey: true,
    ctrlKey: true,
  },
  key: 'A',
};

module('Unit | Service | key manager', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    warnings = [];
    document.body.appendChild(div);
    this.owner.register('main:key-manager-config', configOptions, {
      instantiate: false,
    });
    config = this.owner.lookup('main:key-manager-config');
  });

  hooks.afterEach(function() {
    document.body.removeChild(div);
    div.contentEditable = false;
    firstMacroCallCount = 0;
    secondMacroCallCount = 0;
    thirdMacroCallCount = 0;
    fourthMacroCallCount = 0;
    fifthMacroCallCount = 0;
    set(config, 'isDisabledOnInput', null);
  });

  test('`init()` sets `macros` to an empty array', function(assert) {
    const service = this.owner.lookup('service:key-manager');

    assert.deepEqual(service.macros, []);
  });

  test('`init()` sets defaults from config', function(assert) {
    set(config, 'isDisabledOnInput', true);

    const service = this.owner.lookup('service:key-manager');
    assert.ok(service.isDisabledOnInput, 'isDisabledOnInput is true from config.');
  });

  test('`addMacro()`', async function(assert) {
    assert.expect(15);

    const service = this.owner.lookup('service:key-manager');

    service.addMacro(firstMacroAttrs);
    service.addMacro(secondMacroAttrs);
    service.addMacro(thirdMacroAttrs);
    service.addMacro(fourthMacroAttrs);
    service.addMacro(fifthMacroAttrs);

    assert.equal(
      service.keydownMacros.length,
      4,
      'keydown macros should be set'
    );

    await dispatchEvent(div, firstMacroEvent);             // YES `assert`
    await dispatchEvent(div, firstMacroEvent);             // YES `assert`
    await dispatchEvent(document.body, firstMacroEvent);   // NO  `assert`
    await dispatchEvent(document.body, secondMacroEvent);  // YES `assert`
    await dispatchEvent(document.body, secondMacroEvent);  // YES `assert`
    await dispatchEvent(div, secondMacroEvent);            // YES `assert`
    await dispatchEvent(document.body, fifthMacroEvent);   // YES `assert`

    assert.equal(firstMacroCallCount, 2, 'firstMacro callback is called twice directly');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is called twice directly, once by the event triggered on a `div` within its `element`, once by fifthMacro because it has a higher priority')
    assert.equal(thirdMacroCallCount, 0, 'thirdMacro callback is not called');
    assert.equal(fourthMacroCallCount, 0, 'fourthMacro callback is not called');
    assert.equal(fifthMacroCallCount, 0, 'fifthMacro callback is not called');

    const firstMacro = service.keydownMacros.objectAt(0);
    assert.equal(
      firstMacro.executionKey,
      'shift',
      'firstMacro execution key should be set'
    );
    assert.deepEqual(
      firstMacro.modifierKeys,
      [],
      'firstMacro modifier keys should be set'
    );
    assert.equal(
      firstMacro.element,
      div,
      'element should be set to passed in element'
    );

    const secondMacro = service.keydownMacros.objectAt(1);
    assert.equal(
      secondMacro.executionKey,
      'a',
      'secondMacro execution key should be set'
    );
    assert.deepEqual(
      secondMacro.modifierKeys,
      ['control', 'Alt'],
      'secondMacro modifier keys should be set'
    );
    assert.equal(
      secondMacro.element,
      document.body,
      'element should be set to default'
    );

    const thirdMacro = service.keydownMacros.objectAt(2);
    assert.equal(
      thirdMacro.executionKey,
      'b',
      'thirdMacro execution key should be set'
    );
    assert.deepEqual(
      thirdMacro.modifierKeys,
      ['Control', 'Alt'],
      'thirdMacro modifier keys should be set'
    );
    assert.equal(
      thirdMacro.element,
      div,
      'element should be set to default'
    );
  });

  test('`removeMacro()`', async function(assert) {
    assert.expect(37);

    const service = this.owner.lookup('service:key-manager');

    const firstMacro = service.addMacro(firstMacroAttrs);
    const secondMacro = service.addMacro(secondMacroAttrs);
    const thirdMacro = service.addMacro(thirdMacroAttrs);
    const fourthMacro = service.addMacro(fourthMacroAttrs);
    const fifthMacro = service.addMacro(fifthMacroAttrs);

    assert.equal(
      service.keydownMacros.length,
      4,
      'keydown macros should be set'
    );
    assert.equal(
      service.keyupMacros.length,
      1,
      'keyup macros should be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is called');
    assert.equal(secondMacroCallCount, 2, 'secondMacro callback is called, once by itself, once by fifthMacro because of priority');
    assert.equal(thirdMacroCallCount, 1, 'thirdMacro callback is called');
    assert.equal(fourthMacroCallCount, 1, 'fourthMacro callback is called');
    assert.equal(fifthMacroCallCount, 0, 'fifthMacro callback is not called because of low priority');

    service.removeMacro(firstMacro);

    assert.equal(
      service.keydownMacros.length,
      3,
      'keydown macros should be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is called, once again by itself, once again by fifthMacro because of priority');
    assert.equal(thirdMacroCallCount, 2, 'thirdMacro callback is called');
    assert.equal(fourthMacroCallCount, 2, 'fourthMacro callback is called');
    assert.equal(fifthMacroCallCount, 0, 'fifthMacro callback is not called because of low priority');

    service.removeMacro(secondMacro);

    assert.equal(
      service.keydownMacros.length,
      2,
      'keydown macros should be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(thirdMacroCallCount, 3, 'thirdMacro callback is called');
    assert.equal(fourthMacroCallCount, 3, 'fourthMacro callback is called');
    assert.equal(fifthMacroCallCount, 2, 'fifthMacro callback is called, once by itself, once by secondMacro call');

    service.removeMacro(thirdMacro);

    assert.equal(
      service.keydownMacros.length,
      1,
      'keydown macros should not be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(fourthMacroCallCount, 4, 'fourthMacro callback is called');
    assert.equal(fifthMacroCallCount, 4, 'fifthMacro callback is called, once again by itself, once again by secondMacro call');

    service.removeMacro(fourthMacro);

    assert.equal(
      service.keyupMacros.length,
      0,
      'keyup macros should not be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(fourthMacroCallCount, 4, 'fourthMacro callback is not called again');
    assert.equal(fifthMacroCallCount, 6, 'fifthMacro callback is called, once again by itself, once again by secondMacro call');

    service.removeMacro(fifthMacro);

    assert.equal(
      service.keyupMacros.length,
      0,
      'keyup macros should not be set'
    );

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(document.body, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);
    await dispatchEvent(document.body, fourthMacroEvent);
    await dispatchEvent(document.body, fifthMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(fourthMacroCallCount, 4, 'fourthMacro callback is not called again');
    assert.equal(fifthMacroCallCount, 6, 'fifthMacro callback is not called again');
  });

  test('`isDisabledOnInput` option disables callback on contentEditable elements', async function(assert) {
    assert.expect(2);

    const service = this.owner.lookup('service:key-manager');
    let macroAttrs = assign({}, firstMacroAttrs, { isDisabledOnInput: true });

    service.addMacro(macroAttrs);

    focus(div);
    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'callback is called');

    div.contentEditable = true;

    focus(div);
    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'callback is not called');
  });

  test('`isDisabledOnInput` option disables callback on input elements', async function(assert) {
    const service = this.owner.lookup('service:key-manager');

    const promises = ['input', 'textarea', 'select'].map((elementName) => {
      return new Promise(async(resolve) => {
        const element = document.createElement(elementName);
        document.body.appendChild(element);

        let macroAttrs = assign({}, firstMacroAttrs, { element });
        const macro = service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, firstMacroEvent);


        service.removeMacro(macro);
        macroAttrs = assign(macroAttrs, { isDisabledOnInput: true });
        service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, firstMacroEvent);

        element.remove();
        resolve();
      });
    });

    await Promise.all(promises);

    assert.equal(firstMacroCallCount, 3, 'callback is called the correct number');
  });

  test('`isDisabledOnInput` config option disables callback on contentEditable elements', async function(assert) {
    assert.expect(2);

    set(config, 'isDisabledOnInput', true);

    const service = this.owner.lookup('service:key-manager');

    service.addMacro(firstMacroAttrs);

    focus(div);
    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'callback is called');

    div.contentEditable = true;

    focus(div);
    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'callback is not called');
  });

  test('`isDisabledOnInput` config option disables callback on input elements', async function(assert) {
    assert.expect(3);

    set(config, 'isDisabledOnInput', true);

    const service = this.owner.lookup('service:key-manager');

    const promises = ['input', 'textarea', 'select'].map((elementName) => {
      return new Promise(async(resolve) => {
        const element = document.createElement(elementName);
        document.body.appendChild(element);

        let macroAttrs = assign({}, firstMacroAttrs, { element });
        service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, firstMacroEvent);

        assert.equal(firstMacroCallCount, 0, 'callback is not called');
        element.remove();
        resolve();
      });
    });
    await Promise.all(promises);
  });

  test('dispatchEvent triggers all matching macro callbacks', async function(assert) {
    const service = this.owner.lookup('service:key-manager');

    service.addMacro(firstMacroAttrs);
    service.addMacro(firstMacroAttrs);
    service.addMacro(secondMacroAttrs);

    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 2, 'all matches of firstMacro are called');
    assert.equal(secondMacroCallCount, 0, 'secondMacro callback is not called')
  });

  test('dispatchEvent triggers all matching macro callbacks with highest priority', async function(assert) {
    const service = this.owner.lookup('service:key-manager');

    let isCalled = false;
    const higherPriorityMacro = Object.assign({}, firstMacroAttrs, {
      priority: 100,
      callback() {
        isCalled = true;
      },
    });
    service.addMacro(firstMacroAttrs);
    service.addMacro(firstMacroAttrs);
    service.addMacro(higherPriorityMacro);

    await dispatchEvent(div, firstMacroEvent);

    assert.equal(firstMacroCallCount, 0, 'other firstMacro callbacks are not called');
    assert.ok(isCalled, 'higher priority macro is called');
  });

  test('disabling a macro or group', async function(assert) {
    const service = this.owner.lookup('service:key-manager');

    const macro = service.addMacro(firstMacroAttrs);
    service.addMacro(secondMacroAttrs);
    service.addMacro(thirdMacroAttrs);

    service.disable(macro);

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(div, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);

    assert.equal(firstMacroCallCount, 0, 'firstMacro is disabled');
    assert.equal(secondMacroCallCount, 1, 'secondMacro is not disabled');
    assert.equal(thirdMacroCallCount, 1, 'thirdMacro is not disabled');

    service.disable('group 1');

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(div, secondMacroEvent);
    await dispatchEvent(div, thirdMacroEvent);

    assert.equal(firstMacroCallCount, 0, 'firstMacro is still disabled');
    assert.equal(secondMacroCallCount, 1, 'secondMacro is now disabled');
    assert.equal(thirdMacroCallCount, 2, 'thirdMacro is not disabled');
  });

  test('enabling a macro or group', async function(assert) {
    const service = this.owner.lookup('service:key-manager');

    const macro = service.addMacro(firstMacroAttrs);
    service.addMacro(secondMacroAttrs);
    service.addMacro(thirdMacroAttrs);

    service.disable('group 1');

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(div, secondMacroEvent);

    assert.equal(firstMacroCallCount, 0, 'firstMacro is disabled');
    assert.equal(secondMacroCallCount, 0, 'secondMacro is disabled');

    service.enable(macro);

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(div, secondMacroEvent);

    assert.equal(firstMacroCallCount, 1, 'firstMacro is not disabled');
    assert.equal(secondMacroCallCount, 0, 'secondMacro is still disabled');

    service.enable('group 1');

    await dispatchEvent(div, firstMacroEvent);
    await dispatchEvent(div, secondMacroEvent);

    assert.equal(firstMacroCallCount, 2, 'firstMacro is still not disabled');
    assert.equal(secondMacroCallCount, 1, 'secondMacro is not disabled');
  });

  test('warning is triggered if registering a macro with modifiers and keyup', async function(assert) {
    const service = this.owner.lookup('service:key-manager');
    service.addMacro({
      callback: function() {},
      executionKey: 'a',
      modifierKeys: ['Control', 'Alt'],
      keyEvent: 'keyup',
    });

    assert.ok(warnings, 'warning is present');
    assert.equal(warnings[0], MODIFIERS_ON_KEYUP_WARNING, 'correct warning was sent');
  });

  test('keyboard events that don\'t match still propogate', async function(assert) {
    const service = this.owner.lookup('service:key-manager');
    let listenerCallCount = 0;
    const nonMacroEvent = {
      type: 'keydown',
      modifiers: {
        altKey: true,
      },
      key: 'B',
    };
    const div1 = document.createElement('DIV');
    const container = document.body;
    container.appendChild(div1);
    container.addEventListener('keydown', function() {
      listenerCallCount += 1;
    });

    set(secondMacroAttrs, 'element', div1);
    service.addMacro(secondMacroAttrs);

    await dispatchEvent(div1, secondMacroEvent);
    await dispatchEvent(div1, nonMacroEvent);

    assert.equal(secondMacroCallCount, 1, 'macro is triggered once');
    assert.equal(listenerCallCount, 1, 'non-macro event propogates');
  });
});
