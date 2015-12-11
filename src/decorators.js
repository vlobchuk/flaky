import angular from 'angular';
import {Utils} from './core/Utils';
import {flaky} from './flaky';

/**
 * Add controller
 * @param config
 * @returns {decorator}
 */
export function controller(config = false) {
  return function decorator(target) {
    if (config !== false) {
      flaky.module.addRoute(false, config, controller.name);
    }

    flaky.module.addController(target);
  };
}

/**
 * Add service
 * @returns {decorator}
 */
export function service() {
  return function decorator(target) {
    flaky.module.addService(target);
  };
}

/**
 * Add component
 * @param options
 * @returns {decorator}
 */
export function component(options = {}) {
  return function decorator(target) {
    flaky.module.addComponent(target, options);
    flaky.module.addController(target);
  };
}

/**
 * Add directive
 * @param options
 * @returns {decorator}
 */
export function directive(options = {}) {
  return function decorator(target) {
    flaky.module.addDirective(target, options);
    flaky.module.addController(target);
  };
}

/**
 * Add filter
 * @returns {decorator}
 */
export function filter() {
  return function decorator(target) {
    flaky.module.addFilter(target);
  };
}

/**
 * Add interceptor
 * @param type type of interceptor (request, requestError, response, responseError)
 * @returns {decorator}
 */
export function interceptor(type) {
  return function decorator(target) {
    flaky.module.addInterceptor(target, type);
  }
}

/**
 * Inject dependencies for services, directives, controllers, filters
 * @param dependencies
 * @returns {decorator}
 */
export function inject(...dependencies) {
  return function decorator(target) {
    abstractInject('$inject', target, dependencies);
  };
}

/**
 * Inject for module method config
 * @param dependencies
 * @returns {decorator}
 */
export function injectConfig(...dependencies) {
  return function decorator(target) {
    abstractInject('$injectConfig', target, dependencies);
  };
}

/**
 * Inject for module method run
 * @param dependencies
 * @returns {decorator}
 */
export function injectRun(...dependencies) {
  return function decorator(target) {
    abstractInject('$injectRun', target, dependencies);
  };
}

/**
 * Add specific inject property to target
 * @param name
 * @param target
 * @param dependencies
 */
function abstractInject(name, target, dependencies) {
  let targetDependencies = [];
  let extendsProto = Object.getPrototypeOf(target);

  if (Utils.isArray(extendsProto[name])) {
    targetDependencies = extendsProto[name];
  }

  target[name] = targetDependencies.concat(dependencies);
}
