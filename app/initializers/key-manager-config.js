import config from '../config/environment';
import Ember from 'ember';

const {
  get,
} = Ember;

export function initialize(application) {
  const keyManagerConfig = get(config, 'keyManagerConfig') || {};
  application.register('main:key-manager-config', keyManagerConfig, {
    instantiate: false,
  });
}

export default {
  name: 'key-manager-config',
  initialize,
};
