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

}

module.exports = {
  Parser: GedcomParser,
};
