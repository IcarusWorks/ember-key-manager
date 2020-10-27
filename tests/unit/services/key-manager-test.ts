import { assign } from '@ember/polyfills';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import {
  focus,
  triggerKeyEvent
} from '@ember/test-helpers';
import {
  MODIFIERS_ON_KEYUP as MODIFIERS_ON_KEYUP_WARNING,
} from 'ember-key-manager/utils/warning-messages';
import { TestContext } from 'ember-test-helpers';
import { registerWarnHandler } from '@ember/debug';
import KeyManagerConfig from 'ember-key-manager/utils/config';
import { MacroOptions } from 'ember-key-manager/utils/macro';
import { KeyManagerEvent } from 'ember-key-manager/utils/key-manager-event';

async function dispatchEvent(element: HTMLElement, eventDetails: KeyManagerEvent) {
  await triggerKeyEvent(element, eventDetails.type, eventDetails.key, {
    ctrlKey: eventDetails.ctrlKey,
    altKey: eventDetails.altKey,
    shiftKey: eventDetails.shiftKey,
    metaKey: eventDetails.metaKey
  })
  return eventDetails;
}

type Context = TestContext & {
  targetElement: HTMLElement;
  warnings: string[];
  config: KeyManagerConfig;
  firstMacroCallCount: number;
  secondMacroCallCount: number;
  thirdMacroCallCount: number;
  fourthMacroCallCount: number;
  fifthMacroCallCount: number;

  firstMacroAttrs: MacroOptions;
  secondMacroAttrs: MacroOptions;
  thirdMacroAttrs: MacroOptions;
  fourthMacroAttrs: MacroOptions;
  fifthMacroAttrs: MacroOptions;

  firstMacroEvent: KeyManagerEvent;
  secondMacroEvent: KeyManagerEvent;
  thirdMacroEvent: KeyManagerEvent;
  fourthMacroEvent: KeyManagerEvent;
  fifthMacroEvent: KeyManagerEvent;
}

module('Unit | Service | key manager', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function(this:Context) {
    this.targetElement = document.createElement('div');
    document.body.appendChild(this.targetElement);

    this.warnings = [];
    registerWarnHandler((message, options, next) => {
      this.warnings.push(message);
      next(message, options);
    });

    this.firstMacroCallCount = 0;
    this.secondMacroCallCount = 0;
    this.thirdMacroCallCount = 0;
    this.fourthMacroCallCount = 0;
    this.fifthMacroCallCount = 0;

    var test = this;

    this.firstMacroAttrs = {
      callback: function() {
        test.firstMacroCallCount += 1;
      },
      element: this.targetElement,
      executionKey: 'Shift',
      keyEvent: 'keydown',
      groupName: 'group 1',
    };

    this.secondMacroAttrs = {
      callback: function() {
        test.secondMacroCallCount += 1;
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
    // * `element` is set to a `this.targetElement`
    // * `executionKey` is set to 'B'
    //
    this.thirdMacroAttrs = {
      callback: function() {
        test.thirdMacroCallCount += 1;
      },
      element: this.targetElement,
      executionKey: 'B',
      modifierKeys: ['Control', 'Alt'],
      keyEvent: 'keydown',
    };
    
    // fourthMacro
    //
    // Same as `secondMacro` except:
    // * `keyEvent` is set to a `keyup`
    //
    this.fourthMacroAttrs = {
      callback: function() {
        test.fourthMacroCallCount += 1;
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
    this.fifthMacroAttrs = {
      callback: function() {
        test.fifthMacroCallCount += 1;
      },
      executionKey: 'A',
      modifierKeys: ['Control', 'Alt'],
      priority: 1,
      keyEvent: 'keydown',
    };

    this.firstMacroEvent = {
      type: 'keydown',
      key: 'Shift',
    };
    
    this.secondMacroEvent = {
      type: 'keydown',
      altKey: true,
      ctrlKey: true,
      key: 'A',
    };
    
    this.thirdMacroEvent = {
      type: 'keydown',
      altKey: true,
      ctrlKey: true,
      key: 'B',
    };
    
    this.fourthMacroEvent = {
      type: 'keyup',
      altKey: true,
      ctrlKey: true,
      key: 'A',
    };
    
    this.fifthMacroEvent = {
      type: 'keydown',
      altKey: true,
      ctrlKey: true,
      key: 'A',
    };    
    
    this.config = this.owner.lookup('service:config');
  });

  hooks.afterEach(function(this:Context) {
    document.body.removeChild(this.targetElement);
  });

  test('`init()` sets `macros` to an empty array', function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    assert.deepEqual(service.keydownMacros, []);
    assert.deepEqual(service.keyupMacros, []);
  });

  test('`init()` sets defaults from config', function(this: Context, assert) {
    this.config.isDisabledOnInput = true;

    const service = this.owner.lookup('service:key-manager');
    assert.ok(service.isDisabledOnInput, 'isDisabledOnInput is true from config.');
  });

  test('`addMacro()`', async function(this: Context, assert) {
    assert.expect(15);

    const service = this.owner.lookup('service:key-manager');

    service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.secondMacroAttrs);
    service.addMacro(this.thirdMacroAttrs);
    service.addMacro(this.fourthMacroAttrs);
    service.addMacro(this.fifthMacroAttrs);

    assert.equal(
      service.keydownMacros.length,
      4,
      'keydown macros should be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);             // YES `assert`
    await dispatchEvent(this.targetElement, this.firstMacroEvent);             // YES `assert`
    await dispatchEvent(document.body, this.firstMacroEvent);   // NO  `assert`
    await dispatchEvent(document.body, this.secondMacroEvent);  // YES `assert`
    await dispatchEvent(document.body, this.secondMacroEvent);  // YES `assert`
    await dispatchEvent(this.targetElement, this.secondMacroEvent);            // YES `assert`
    await dispatchEvent(document.body, this.fifthMacroEvent);   // YES `assert`

    assert.equal(this.firstMacroCallCount, 2, 'firstMacro callback is called twice directly');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is called twice directly, once by the event triggered on a `this.targetElement` within its `element`, once by fifthMacro because it has a higher priority')
    assert.equal(this.thirdMacroCallCount, 0, 'thirdMacro callback is not called');
    assert.equal(this.fourthMacroCallCount, 0, 'fourthMacro callback is not called');
    assert.equal(this.fifthMacroCallCount, 0, 'fifthMacro callback is not called');

    const firstMacro = service.keydownMacros.objectAt(0);
    assert.equal(
      firstMacro.executionKey,
      'Shift',
      'firstMacro execution key should be set'
    );
    assert.deepEqual(
      firstMacro.modifierKeys,
      [],
      'firstMacro modifier keys should be set'
    );
    assert.equal(
      firstMacro.element,
      this.targetElement,
      'element should be set to passed in element'
    );

    const secondMacro = service.keydownMacros.objectAt(1);
    assert.equal(
      secondMacro.executionKey,
      'A',
      'secondMacro execution key should be set'
    );
    assert.deepEqual(
      secondMacro.modifierKeys,
      ['Control', 'Alt'],
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
      'B',
      'thirdMacro execution key should be set'
    );
    assert.deepEqual(
      thirdMacro.modifierKeys,
      ['Control', 'Alt'],
      'thirdMacro modifier keys should be set'
    );
    assert.equal(
      thirdMacro.element,
      this.targetElement,
      'element should be set to default'
    );
  });

  test('`removeMacro()`', async function(this: Context, assert) {
    assert.expect(37);

    const service = this.owner.lookup('service:key-manager');

    const firstMacro = service.addMacro(this.firstMacroAttrs);
    const secondMacro = service.addMacro(this.secondMacroAttrs);
    const thirdMacro = service.addMacro(this.thirdMacroAttrs);
    const fourthMacro = service.addMacro(this.fourthMacroAttrs);
    const fifthMacro = service.addMacro(this.fifthMacroAttrs);

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

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is called');
    assert.equal(this.secondMacroCallCount, 2, 'secondMacro callback is called, once by itself, once by fifthMacro because of priority');
    assert.equal(this.thirdMacroCallCount, 1, 'thirdMacro callback is called');
    assert.equal(this.fourthMacroCallCount, 1, 'fourthMacro callback is called');
    assert.equal(this.fifthMacroCallCount, 0, 'fifthMacro callback is not called because of low priority');

    service.removeMacro(firstMacro);

    assert.equal(
      service.keydownMacros.length,
      3,
      'keydown macros should be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is called, once again by itself, once again by fifthMacro because of priority');
    assert.equal(this.thirdMacroCallCount, 2, 'thirdMacro callback is called');
    assert.equal(this.fourthMacroCallCount, 2, 'fourthMacro callback is called');
    assert.equal(this.fifthMacroCallCount, 0, 'fifthMacro callback is not called because of low priority');

    service.removeMacro(secondMacro);

    assert.equal(
      service.keydownMacros.length,
      2,
      'keydown macros should be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(this.thirdMacroCallCount, 3, 'thirdMacro callback is called');
    assert.equal(this.fourthMacroCallCount, 3, 'fourthMacro callback is called');
    assert.equal(this.fifthMacroCallCount, 2, 'fifthMacro callback is called, once by itself, once by secondMacro call');

    service.removeMacro(thirdMacro);

    assert.equal(
      service.keydownMacros.length,
      1,
      'keydown macros should not be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(this.thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(this.fourthMacroCallCount, 4, 'fourthMacro callback is called');
    assert.equal(this.fifthMacroCallCount, 4, 'fifthMacro callback is called, once again by itself, once again by secondMacro call');

    service.removeMacro(fourthMacro);

    assert.equal(
      service.keyupMacros.length,
      0,
      'keyup macros should not be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(this.thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(this.fourthMacroCallCount, 4, 'fourthMacro callback is not called again');
    assert.equal(this.fifthMacroCallCount, 6, 'fifthMacro callback is called, once again by itself, once again by secondMacro call');

    service.removeMacro(fifthMacro);

    assert.equal(
      service.keyupMacros.length,
      0,
      'keyup macros should not be set'
    );

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(document.body, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);
    await dispatchEvent(document.body, this.fourthMacroEvent);
    await dispatchEvent(document.body, this.fifthMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro callback is not called again');
    assert.equal(this.secondMacroCallCount, 4, 'secondMacro callback is not called again');
    assert.equal(this.thirdMacroCallCount, 3, 'thirdMacro callback is not called again');
    assert.equal(this.fourthMacroCallCount, 4, 'fourthMacro callback is not called again');
    assert.equal(this.fifthMacroCallCount, 6, 'fifthMacro callback is not called again');
  });

  test('`isDisabledOnInput` option disables callback on contentEditable elements', async function(this: Context, assert) {
    assert.expect(2);

    const service = this.owner.lookup('service:key-manager');
    const element = document.createElement('a');
    document.body.appendChild(element);

    let macroAttrs = assign({}, this.firstMacroAttrs, {
      element,
      isDisabledOnInput: true
    });
    service.addMacro(macroAttrs);

    focus(element);
    await dispatchEvent(element, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'callback is called');

    element.contentEditable = "true";

    focus(element);
    await dispatchEvent(element, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'callback is not called');
  });

  test('`isDisabledOnInput` option disables callback on input elements', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    const promises = ['input', 'textarea', 'select'].map((elementName) => {
      return new Promise(async(resolve) => {
        const element = document.createElement(elementName);
        document.body.appendChild(element);

        let macroAttrs = assign({}, this.firstMacroAttrs, { element });
        const macro = service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, this.firstMacroEvent);

        service.removeMacro(macro);
        macroAttrs = assign(macroAttrs, { isDisabledOnInput: true });
        service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, this.firstMacroEvent);

        element.remove();
        resolve();
      });
    });

    await Promise.all(promises);

    assert.equal(this.firstMacroCallCount, 3, 'callback is called the correct number');
  });

  test('`isDisabledOnInput` config option disables callback on contentEditable elements', async function(this: Context, assert) {
    assert.expect(2);

    this.config.isDisabledOnInput = true;

    const service = this.owner.lookup('service:key-manager');
    const element = document.createElement('a');
    document.body.appendChild(element);

    let macroAttrs = assign({}, this.firstMacroAttrs, {
      element
    });
    service.addMacro(macroAttrs);

    focus(element);
    await dispatchEvent(element, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'callback is called');

    element.contentEditable = "true";

    focus(element);
    await dispatchEvent(element, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'callback is not called');

  });

  test('`isDisabledOnInput` config option disables callback on input elements', async function(this: Context, assert) {
    assert.expect(3);

    this.config.isDisabledOnInput = true;

    const service = this.owner.lookup('service:key-manager');

    const promises = ['input', 'textarea', 'select'].map((elementName) => {
      return new Promise(async(resolve) => {
        const element = document.createElement(elementName);
        document.body.appendChild(element);

        let macroAttrs = assign({}, this.firstMacroAttrs, { element });
        service.addMacro(macroAttrs);

        focus(element);
        await dispatchEvent(element, this.firstMacroEvent);

        assert.equal(this.firstMacroCallCount, 0, 'callback is not called');
        element.remove();
        resolve();
      });
    });
    await Promise.all(promises);
  });

  test('dispatchEvent triggers all matching macro callbacks', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.secondMacroAttrs);

    await dispatchEvent(this.targetElement, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 2, 'all matches of firstMacro are called');
    assert.equal(this.secondMacroCallCount, 0, 'secondMacro callback is not called')
  });

  test('dispatchEvent triggers all matching macro callbacks with highest priority', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    let isCalled = false;
    const higherPriorityMacro = Object.assign({}, this.firstMacroAttrs, {
      priority: 100,
      callback() {
        isCalled = true;
      },
    });
    service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.firstMacroAttrs);
    service.addMacro(higherPriorityMacro);

    await dispatchEvent(this.targetElement, this.firstMacroEvent);

    assert.equal(this.firstMacroCallCount, 0, 'other firstMacro callbacks are not called');
    assert.ok(isCalled, 'higher priority macro is called');
  });

  test('disabling a macro or group', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    const macro = service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.secondMacroAttrs);
    service.addMacro(this.thirdMacroAttrs);

    service.disable(macro);

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(this.targetElement, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);

    assert.equal(this.firstMacroCallCount, 0, 'firstMacro is disabled');
    assert.equal(this.secondMacroCallCount, 1, 'secondMacro is not disabled');
    assert.equal(this.thirdMacroCallCount, 1, 'thirdMacro is not disabled');

    service.disable('group 1');

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(this.targetElement, this.secondMacroEvent);
    await dispatchEvent(this.targetElement, this.thirdMacroEvent);

    assert.equal(this.firstMacroCallCount, 0, 'firstMacro is still disabled');
    assert.equal(this.secondMacroCallCount, 1, 'secondMacro is now disabled');
    assert.equal(this.thirdMacroCallCount, 2, 'thirdMacro is not disabled');
  });

  test('enabling a macro or group', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');

    const macro = service.addMacro(this.firstMacroAttrs);
    service.addMacro(this.secondMacroAttrs);
    service.addMacro(this.thirdMacroAttrs);

    service.disable('group 1');

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(this.targetElement, this.secondMacroEvent);

    assert.equal(this.firstMacroCallCount, 0, 'firstMacro is disabled');
    assert.equal(this.secondMacroCallCount, 0, 'secondMacro is disabled');

    service.enable(macro);

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(this.targetElement, this.secondMacroEvent);

    assert.equal(this.firstMacroCallCount, 1, 'firstMacro is not disabled');
    assert.equal(this.secondMacroCallCount, 0, 'secondMacro is still disabled');

    service.enable('group 1');

    await dispatchEvent(this.targetElement, this.firstMacroEvent);
    await dispatchEvent(this.targetElement, this.secondMacroEvent);

    assert.equal(this.firstMacroCallCount, 2, 'firstMacro is still not disabled');
    assert.equal(this.secondMacroCallCount, 1, 'secondMacro is not disabled');
  });

  test('warning is triggered if registering a macro with modifiers and keyup', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');
    service.addMacro({
      callback: function() {},
      executionKey: 'A',
      modifierKeys: ['Control', 'Alt'],
      keyEvent: 'keyup',
    });

    assert.ok(this.warnings, 'warning is present');
    assert.equal(this.warnings[0], MODIFIERS_ON_KEYUP_WARNING, 'correct warning was sent');
  });

  test('keyboard events that don\'t match still propogate', async function(this: Context, assert) {
    const service = this.owner.lookup('service:key-manager');
    let listenerCallCount = 0;
    const nonMacroEvent: KeyManagerEvent = {
      type: 'keydown',
      altKey: true,
      key: 'B',
    };
    const div1 = document.createElement('DIV');
    const container = document.body;
    container.appendChild(div1);
    container.addEventListener('keydown', function() {
      listenerCallCount += 1;
    });

    this.secondMacroAttrs.element = div1;
    service.addMacro(this.secondMacroAttrs);

    await dispatchEvent(div1, this.secondMacroEvent);
    await dispatchEvent(div1, nonMacroEvent);

    assert.equal(this.secondMacroCallCount, 1, 'macro is triggered once');
    assert.equal(listenerCallCount, 1, 'non-macro event propogates');
  });
});
