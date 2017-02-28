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

A service for (un)binding keyboard up and down events.

## Installation

* `ember install ember-key-manager`

## Usage

Bind key event anywhere services are available e.g., routes, models, controllers, components.

### Public Methods

#### `register({keys, name, selector=$(document), downCallback, upCallback, priority=0})`

Accepts an object with the following attributes:

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `keys`     | array of strings | Yes      | `<none>` | An array of keys that comprise the shortcut e.g., `['cmd', 'enter']`. `keys` can contain one or more modifier keys and _must_ contain at least one non-modifier key. |
| `name`     | string | Yes      | `<none>` | A unique string by which you can identify – and `deregister` – the shortcut. |
| `selector`     | jQuery selector | No      | `$(document)` | A jQuery selector by which to scope the shortcut. |
| `downCallback`     | function | No      | `<none>` | A function to be called when the shortcut keys are matched and the keydown event is fired. |
| `upCallback`     | function | No      | `<none>` | A function to be called when the shortcut keys are matched and the keyup event is fired. |
| `priority`     | integer | No      | `0` | An integer used to prioritize shortcuts should the shortcuts with the same `keys` be bound at the same time. For example, you bind the `escape` key on a route and the route's template renders a component that also binds the `escape` key. Highest priority takes precedence. |

#### `deregister({name})`

Accepts an object with the following attribute:

| Name       | Type          | Required | Default  | Description
| ---------- | ------------- | -------- | -------- | --------- |
| `name`     | string | Yes      | `<none>` | The same string with which the shortcut was registered in the `register()` call. |

### Key Names

The list of the possible key names can be [found here](https://github.com/IcarusWorks/ember-key-manager/blob/master/addon/utils/key-codes.js). The modifier keys – those that don't trigger a shortcut to execute – are:

```
altLeft
cmd
contextMenu
control
shift
windowLeft
windowRight
```

### Examples

Here's an example usage on a component:

```js
import Ember from 'ember';

const {
  get,
  inject,
} = Ember;

export default Ember.Component.extend({
  keyManager: inject.service(),

  didInsertElement() {
    get(this, 'keyManager').register({
      keys: ['escape'],
      name: 'search-modal',
      downCallback: run.bind(this, function() {
        this.send('toggleModal');
      }),
      priority: 10,
    });
  },

  willDestroyElement() {
    get(this, 'keyManager').deregister({
      name: 'search-modal', // This name must match the name the binding was registered with above.
    });
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
import Ember from 'ember';

const {
  get,
  inject,
} = Ember;

export default Ember.Route.extend({
  keyManager: inject.service(),

  actions: {
    didTransition() {
      this._super(...arguments);

      get(this, 'keyManager').register({
        keys: ['escape'],
        name: 'fancy-route',
        downCallback: run.bind(this, this._redirectToLaLaLand),
        priority: 100,
      });
    },

    willTransition() {
      this._super(...arguments);

      get(this, 'keyManager').deregister({
        name: 'fancy-route',
      });
    },
  },

  // The `event` that's returned as a parameter here is the JS keyboard event.
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
