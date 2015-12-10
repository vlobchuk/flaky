import angular from 'angular';
import {injectConfig} from './core/decorators'

@injectConfig('$stateProvider')
export class Module {

  constructor(name) {
    this._name = name;
    this._angularModule = null;
    this._vendors = [];
    this._controllers = [];
    this._routes = [];
    this._services = [];
    this._components = [];
    this._directives = [];
    this._filters = [];
    this._modules = [];
  }

  run() {
  }

  config(stateProvider) {
    for (let [name, config] of this._routes) {
      stateProvider.state(name, config);
    }
  }

  load() {
    let modules = [];

    for (let module of this._modules) {
      modules.push(module.load());
    }

    this._angularModule = angular.module(this._name, this._vendors.concat(modules));

    this.initRunAndConfig();

    this.loadControllers();
    this.loadComponents();
    this.loadDirectives();
    this.loadServices();
    this.loadFilters();

    return this._angularModule.name;
  }

  /**
   * Initialization application methods run and config (analog angular.module functions)
   */
  initRunAndConfig() {
    let injectConfig = [];
    let injectRun = [];

    if (angular.isArray(this.constructor.$injectConfig)) {
      injectConfig = injectConfig.concat(this.constructor.$injectConfig);
    }

    if (angular.isArray(this.constructor.$injectRun)) {
      injectRun = injectRun.concat(this.constructor.$injectRun);
    }

    this._angularModule.config(Module.createInjectedFunction((...dependencies) => {
      if (angular.isFunction(this.config)) {
        this.config.apply(this, dependencies);
      }
    }, injectConfig));

    this._angularModule.run(Module.createInjectedFunction((...dependencies) => {
      if (angular.isFunction(this.run)) {
        this.run.apply(this, dependencies);
      }
    }, injectRun));
  }

  /**
   * Initialization controllers (AngularJS controller)
   */
  loadControllers() {
    for (let controller of this._controllers) {
      this._angularModule.controller(controller.name, controller);
    }
  }

  /**
   * Initialization components (AngularJS directive set "restrict" to element)
   */
  loadComponents() {
    for (let [component, options] of this._components) {
      let componentOptions = angular.extend({
        restrict: 'E',
        bindToController: true,
        controller: component.name + ' as ' + Module.normalizeComponentAsName(component.name)
      }, options);

      this._angularModule.directive(Module.normalizeComponentName(component.name), () => {
        return componentOptions;
      });
    }
  }

  /**
   * Initialization components (AngularJS directive set "restrict" to attribute)
   */
  loadDirectives() {
    for (let [directive, options] of this._directives) {
      let directiveOptions = angular.extend({
        restrict: 'A',
        bindToController: true,
        controller: directive.name + ' as ' + Module.normalizeDirectiveAsName(directive.name)
      }, options);

      this._angularModule.directive(Module.normalizeDirectiveName(directive.name), () => {
        return directiveOptions;
      });
    }
  }

  /**
   * Initialization components (AngularJS service)
   */
  loadServices() {
    for (let service of this._services) {
      this._angularModule.service(Module.normalizeServiceName(service.name), service);
    }
  }

  /**
   * Initialization components (AngularJS filter)
   */
  loadFilters() {
    for (let filter of this._filters) {


      this._angularModule.filter(Module.normalizeFilterName(filter.name, Module.createInjectedFunction((...dependencies) => {

        //let filterInstance = Object.create(filter.prototype);
        //filter.apply(filterInstance, dependencies);
        //
        //if(!angular.isFunction(filterInstance.run)) {
        //  throw new Error('Filter "' + filter.name + '" has not a run() function');
        //}
        return function(){return 1};
      },  filter.$inject)));
    }
  }

  /**
   * Add controller
   * @param controller {string|function}
   * @returns {Module}
   */
  addController(controller) {
    this._controllers.push(controller);
    return this;
  }

  /**
   * Add service
   * @param service
   * @returns {Module}
   */
  addService(service) {
    this._services.push(service);
    return this;
  }

  /**
   * Add component
   * @param component
   * @param options
   * @returns {Module}
   */
  addComponent(component, options = {}) {
    this._components.push([component, options]);
    return this;
  }

  /**
   * Add directive
   * @param directive
   * @param options
   * @returns {Module}
   */
  addDirective(directive, options = {}) {
    this._directives.push([directive, options]);
    return this;
  }

  /**
   * Add filter
   * @param filter
   * @returns {Module}
   */
  addFilter(filter) {
    this._filters.push(filter);
    return this;
  }

  /**
   * Add route
   * @param name
   * @param config
   * @param controller
   * @returns {Module}
   */
  addRoute(name, config, controller = false) {
    if (controller !== false) {
      if (!angular.isFunction(controller)) {

        if (name === false) {
          name = Module.normalizeRouteName(controller);
        }

        controller = controller + ' as ' + Module.normalizeControllerAsName(controller);
      }

      config = angular.extend({
        controller: controller
      }, config);
    }

    if (name === false) {
      throw new Error('Not set route name');
    }

    this._routes.push([name, config]);

    return this;
  }

  /**
   * Add module
   * @param module {Module}
   * @returns {Module}
   */
  addModule(module) {
    this._modules.push(module);
    return this;
  }

  static normalizeByPatternName(name, patternRegexp, type = false) {
    let firstChar = name.charAt(0);
    let normalizeName = patternRegexp !== false ? name.replace(new RegExp(patternRegexp), '') : name;

    switch (type) {
      case 'lo':
        firstChar = firstChar.toLowerCase();
      break;
      case 'up':
        firstChar = firstChar.toUpperCase();
      break;
    }

    return firstChar + normalizeName.slice(1);
  }

  static normalizeComponentName(name) {
    return Module.normalizeByPatternName(name, 'Component', 'lo');
  }

  static normalizeDirectiveName(name) {
    return Module.normalizeByPatternName(name, 'Directive', 'lo');
  }

  static normalizeControllerAsName(name) {
    return 'ctrl' + Module.normalizeByPatternName(name, 'Controller', 'up');
  }

  static normalizeDirectiveAsName(name) {
    return 'dt' + Module.normalizeByPatternName(name, 'Directive', 'up');
  }

  static normalizeComponentAsName(name) {
    return 'cp' + Module.normalizeByPatternName(name, 'Component', 'up');
  }

  static normalizeRouteName(name) {
    return Module.normalizeByPatternName(name, 'Controller', 'lo');
  }

  static normalizeServiceName(name) {
    return '$' + Module.normalizeByPatternName(name, false, 'lo');
  }

  static normalizeFilterName(filterName) {
    return filterName.charAt(0).toLowerCase() + filterName.slice(1);
  }

  static createInjectedFunction(callback, inject) {
    callback.$inject = inject;
    return callback;
  }

  /**
   * Set modules name
   * @param vendors
   * @returns {Module}
     */
  setVendors(vendors) {
    this._vendors = vendors;
    return this;
  }

  get name() {
    return this._name;
  }

  get routes() {
    return this._routes;
  }

  get controllers() {
    return this._controllers;
  }

  get services() {
    return this._services;
  }

  get components() {
    return this._components;
  }

  get directives() {
    return this._directives;
  }

  get filters() {
    return this._filters;
  }

  get modules() {
    return this._modules;
  }

  get vendors() {
    return this._vendors;
  }
}
