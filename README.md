# ember-key-manager

[![NPM release][npm-badge]][npm-badge-url]
[![Build][travis-badge]][travis-badge-url]
[![Ember Observer][ember-observer-badge]][ember-observer-badge-url]

[npm-badge]: https://img.shields.io/npm/v/ember-key-manager.svg
[npm-badge-url]: https://www.npmjs.com/package/ember-key-manager
[travis-badge]: https://travis-ci.org/IcarusWorks/ember-key-manager.svg?branch=master
[travis-badge-url]: https://travis-ci.org/IcarusWorks/ember-key-manager
[ember-observer-badge]: http://emberobserver.com/badges/ember-key-manager.svg
[ember-observer-badge-url]: http://emberobserver.com/addons/ember-key-manager

A service for (un)binding keyboard `keyup` and `keydown` events.

## Installation

* `ember install ember-key-manager`

## Usage

Bind key event anywhere services are available e.g., routes, models, controllers, components.

### Config

Set global options in a `keyManagerConfig` object in your application's `config/environment.js`:

```js
  keyManagerConfig: {
    isDisabledOnInput: true,
  },
```

#### `isDisabledOnInput`

Defaults to false. Set the global option to true to change the default. The
`isDisabledOnInput` option available on each macro takes precedence over this
global config option.


### Public Methods

#### `addMacro({callback, element=document.body, executionKey, isDisabledOnInput, modifierKeys, priority=0, keyEvent})`

A 'macro' is made of a combination of: zero or more `modifierKeys`, one `executionKey`, a callback function to execute when the macro is matched, the type of `keyEvent`, and a few optional attributes described below. `addMacro()` sets up this binding between keys and callback. When the exact combination of the `executionKey`, `modifierKeys`, and `eventType` are matched, the callback is triggered.

`addMacro()` accepts an object with the following attributes:

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `callback` | `Function` | Yes | `null` | A function to be called when the macro keys are matched, the `keyEvent` event is fired, and the scope defined by `element` is correct. When called, the `callback` is called with the keyboard `event` that triggered the macro. |
| `element` | `Element` | No | `document.body` | A DOM element by which to scope the macro. Events triggered on _or_ within this element will fire the macro's callback. |
| `executionKey` | `String` | Yes | `''` | A case-insensitive string that's the value of the key that triggers the macro's callback e.g., to make letter A the execution key, set `executionKey` to `a`. If unsure of a key's value, [use this tool](https://codepen.io/patrickberkeley/full/PEexPY) to it test out. This can be a modifier key. |
| `isDisabledOnInput` | `Boolean` | No | `false` | A boolean to determine if a macro's the callback should be fired when a `contentEditable`, `input`, `textarea`, or `select` element is focused. |
| `modifierKeys` | `Array` | No | `[]` | An array of modifier key names of case-insensitive strings. Options are `Alt`, `Control`, `Meta`, `Shift`. A warning will be logged if trying to use modifierKeys on a keyup event since this keyEvent will never match. |
| `priority` | `Number` | No | `0` | An integer used to prioritize macros if there's more than one macro with the same `keys` listening at the same time. For example, you add a macro with the `escape` key on a route and the route's template renders a component that also binds a macro with the `escape` key. Highest priority takes precedence. |
| `keyEvent` | `String` | Yes | `null` | Dictates which key event is used for the macro. Options are: `keydown`, `keyup`.
| `groupName` | `String` | No | `null` | Used with disabling and enabling a group of macros.
| `isDisabled` | `String` | No | `false` | Determines whether the macro's callback will be triggered on keyEvent match.

#### `removeMacro(macro)`

Accepts a macro object that is returned from calling `addMacro()`.

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `macro` | `Object` | Yes | `undefined` | A macro object that is returned from calling `addMacro()`. |

#### `disable(macro or groupName)`

Accepts a macro object that is returned from calling `addMacro()` or a string as a group name. If a macro, it disables the callback for that individual macro from being called on match. If it is a group name, it looks for all macros with a matching group name and disables them. When a macro is disabled, it will remain disabled till you call `enable()`.

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `macro` | `Object` | Yes (or `groupName`) | `undefined` | A macro object that is returned from calling `addMacro()`. |
| `groupName` | `String` | Yes (or `macro`) | `undefined` | A string that was used as a `groupName` on one or more of the macros added with `addMacro()`.

#### `enable(macro or groupName)`

Accepts a macro object that is returned from calling `addMacro()` or a string as a group name. If a macro, it enables the callback for that individual macro, ensuring that the callback is called on match. If it is a group name, it looks for all macros with a matching group name and enables them.

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `macro` | `Object` | Yes (or `groupName`) | `undefined` | A macro object that is returned from calling `addMacro()`. |
| `groupName` | `String` | Yes (or `macro`) | `undefined` | A string that was used as a `groupName` on one or more of the macros added with `addMacro()`.

### Key Names

A string that's the value of the key that triggers the macro's callback e.g., to make letter A the execution key, set `executionKey` to `a`. If unsure of a key's value, [use this tool](https://codepen.io/patrickberkeley/full/PEexPY) to it test out.

Allowed modifier key names are: `Alt`, `Control`, `Meta`, `Shift`.

### Examples

Here's an example usage on a component:

```js
import Component from '@ember/component';
import {
  get,
  set,
} from '@ember/object';
import { inject as injectService } from '@ember/service';
import {
  bind,
} from '@ember/runloop';

export default Component.extend({
  keyManager: injectService(),

  didInsertElement() {
    const closeModalMacro = get(this, 'keyManager').addMacro({
      callback: bind(this, function() {
        this.send('toggleModal');
      }),
      executionKey: 'Escape',
      priority: 10,
      keyEvent: 'keydown',
    });
    set(this, 'closeModalMacro', closeModalMacro);
  },

  willDestroyElement() {
    const closeModalMacro = get(this, 'closeModalMacro');
    get(this, 'keyManager').removeMacro(closeModalMacro);
  },

  actions: {
    toggleModal(){
      this.sendAction('toggleModalAction');
    },
  },
});
```

And an example on a route:

```js
import Route from '@ember/routing/route';
import { inject as injectService } from '@ember/service';
import { get, set } from '@ember/object';

export default Route.extend({
  keyManager: injectService(),

  actions: {
    didTransition() {
      this._super(...arguments);

      const redirectMacro = get(this, 'keyManager').addMacro({
        callback: bind(this, this._redirectToLaLaLand),
        executionKey: 'Escape',
        priority: 100,
        keyEvent: 'keydown',
      });
      set(this, 'redirectMacro', redirectMacro);
    },

    willTransition() {
      this._super(...arguments);

      const redirectMacro = get(this, 'redirectMacro');
      get(this, 'keyManager').removeMacro(redirectMacro);
    },
  },

  // The `callback` is called with the keyboard `event`.
  _redirectToLaLaLand(event) {
    if (event) {
      event.preventDefault();
    }
    this.transitionTo('main.la-la-land');
  },
});
```

## Developing

### Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`
