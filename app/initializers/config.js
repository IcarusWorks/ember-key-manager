import config from '../config/environment';

export function initialize(application) {
  application.register('main:config', config, {instantiate: false});
}

export default {
  name: 'config',
  initialize,
};
