class GedcomParser {

  /**
   * Construct an instance that will parse GEDOM text.
   *
   * @since 1.0
   * @param {type} input  String or stream of input
   * @param {type} opts   Configuration overrides
   */
  constructor(input, opts = {}) {

    /**
     * End of line defined by combination of \n or \r
     */
    this.lineSeparator = /[\r\n]+/;

    this.input = input;
    Object.assign(this, opts);
  }

  /**
   * Read an input text line.
   *
   * This method will invoke callbacks for every line read:
   *
   * If this.onReadLine is defined, it will be called whenever a line is read.
   * The line will be parsed as a parameter to the callback.
   *
   * @returns the next line of text from the input
   *
   * @since 1.0
   * @see invokeCallback method
   */
  readLine() {
    this.lastLine = this.remainingLines(this.lineSeparator).shift();

    if (this.lastLine) {
      this.lineNumber += 1;
    }

    this.invokeCallback('ReadLine', this.lastLine);
    return this.lastLine;
  }

  /**
   * Return the remaining input lines.
   *
   * @since 1.0
   */
  remainingLines() {
    if (!this.lines) {
      this.lines      = this.input.split(this.lineSeparator);
      this.lineNumber = 0;
    }

    return this.lines;
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
