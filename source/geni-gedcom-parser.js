class GedcomParser {

  /**
   * Construct an instance that will parse GEDOM text.
   *
   * @since 1.0
   * @param {type} input  String or stream of input
   * @param {type} opts   Configuration overrides
   */
  constructor(input, opts = {}) {
    this.input = input;
    Object.assign(this, opts);
  }

  /**
   * Write logging information.
   *
   * It is intended that this method be overwritten to get
   * it to call another logging service (eg. log4js).
   *
   * @since 1.0
   */
  log(...args) { // eslint-disable-line class-methods-use-this
    console.log(...args); // eslint-disable-line no-console
  }

  /**
   * Invoke a callback if it's defined.
   *
   * @param event - the event causing the callback.
   *
   * The actual name of the callback is on<event>.
   *
   * @example this.invokeCallback('Foo', 'bar', 'baz', 'bunch') will call
   * this.onFoo('bar', 'baz', 'bunch')
   *
   * @since 1.0
   */
  invokeCallback(event, ...args) {
    const callback = `on${event}`;
    if (this[callback]) this[callback](...args);
  }
}

module.exports = {
  Parser: GedcomParser,
};
