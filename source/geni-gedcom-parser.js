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

}

module.exports = {
  Parser: GedcomParser,
};
