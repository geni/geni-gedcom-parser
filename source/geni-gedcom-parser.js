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

    /**
     * Level must start with non-negative integer, no leading zeros.
     * Label (optional), if it exists it must be surrounded by '@'
     * Tag must be alphanumeric string
     * Value optional, consists of anything after a space to end of line
     */
    this.lineRegex = /^\s*(0|[1-9]+[0-9]*) (@[^@]+@ |)([A-Za-z0-9_]+) ?([^\n\r]*|)$/;

    /**
     * turn invalid lines into CONT lines
     *
     * Some programs export invalid GEDCOM by not converting data with \r\n
     * into CONT lines.
     */
    this.autoContinueInvalidLines = true;

    this.input = input;
    Object.assign(this, opts);
  }

  /**
   * Parse input and invoke callbacks.
   *
   * @since 1.0
   */
  parse() {
    while (this.isMoreInput()) {
      this.parseRecord();
    }
  }

  /**
   * Parse input and return an array of records.
   *
   * This method will call parseRecord and save the result to an array.
   * Once all input is consumed, the array will be returned.
   *
   * @returns an array of GEDCOM records
   *
   * @since 1.0
   * @see parseRecord method
   */
  parseAllRecords() {
    const records = [];

    while (this.isMoreInput()) {
      records.push(this.parseRecord());
    }

    return records;
  }

  /**
   * Parse a GEDCOM record from the input.
   *
   * This method will call invokeParseRecordCallbacks for the record then return the record to the
   * caller.  It will also invoke the onParseRecordError callback if an invalid record is parsed.
   *
   * @returns the next GEDCOM record
   *
   * @since 1.0
   * @see invokeParseRecordCallbacks method
   * @see invokeCallback method
   */
  parseRecord() {
    if (!this.isMoreInput()) return null;

    const record = this.parseStructure();

    if (record.level !== 0) {
      this.invokeCallback('ParseRecordError', 'Invalid record', record);
      return null;
    }

    this.invokeParseRecordCallbacks(record);

    return record;
  }

  /**
   * Invoke all callbacks resulting from a parseRecord call
   *
   * @since 1.0
   */
  invokeParseRecordCallbacks(record) {
    this.invokeCallback(`Parse${record.tag}Record`, record);
    this.invokeCallback('ParseRecord', record);
  }

  /**
   * Parse a GEDCOM structure from the input.
   *
   * A GEDCOM structure consists of one or more lines of text.
   *
   * This method will call invokeParseStructureCallbacks for every structure parsed.
   *
   * @returns the next GEDCOM structure
   *
   * @since 1.0
   * @see invokeParseStructureCallbacks method
   */
  parseStructure() {

    if (!this.isMoreInput()) {
      /* istanbul ignore next - jest incorrectly reports next line uncovered */
      if (this.nextStructure) {
        this.invokeParseStructureCallbacks(this.nextStructure);
      }

      const shortCircuitReturnValue = this.nextStructure;
      this.nextStructure = null;
      return shortCircuitReturnValue;
    }

    const currentStructure = this.nextStructure || this.parseLine();
    this.nextStructure     = this.parseLine();

    while (this.nextStructure.level > currentStructure.level) {

      if (this.nextStructure.tag.toUpperCase() === 'CONC') {
        currentStructure.data += this.nextStructure.data;

      } else if (this.nextStructure.tag.toUpperCase() === 'CONT') {
        currentStructure.data += `\n${this.nextStructure.data}`;

      } else {
        currentStructure.structures = currentStructure.structures || [];
        currentStructure.structures.push(this.parseStructure());
        if (this.nextStructure) continue; // eslint-disable-line no-continue
      }

      if (this.isMoreInput()) {
        this.nextStructure = this.parseLine();
      } else {
        break;
      }

    } // while

    this.invokeParseStructureCallbacks(currentStructure);
    return currentStructure;
  }

  /**
   * Invoke all callbacks resulting from a parseStructure call.
   *
   * If this.onParse<TAG>Structure is defined, it will be called whenever a structure with a
   * matching tag is parsed. The parsed structure is the only argument passed to the callback.
   *
   * If this.onParseStructure is defined, it will be called whenever a structure is parsed.
   * The parsed structure is the only argument passed to the callback.
   *
   * @since 1.0
   * @see invokeCallback method
   */
  invokeParseStructureCallbacks(structure) {
    this.invokeCallback(`Parse${structure.tag}Structure`, structure);
    this.invokeCallback('ParseStructure', structure);
  }

  /**
   * Parse a line of input and return it as an Object.
   *
   * This method will call invokeParseLineCallbacks for every line parsed.
   *
   * If an error occurs, this.onParseLineError will be called.
   * Two parameters will be passed to the callback: a text description of the error
   * and the line. ie: this.onParseLineError('Invalid line', line);
   *
   * @returns the next GEDCOM line
   *
   * @since 1.0
   * @see invokeParseLineCallbacks method
   * @see invokeCallback method
   */
  parseLine(string) {

    const object = {};
    let     line = string;

    if (this.autoContinueInvalidLines) {
      line = line || this.readLine();
    } else {
      // skip blank lines
      while (!line && this.isMoreInput()) {
        line = this.readLine();
      }
    }

    if (!line || line.length === 0) {
      if (this.autoContinueInvalidLines) {
        object.tag  = 'CONT';
        object.data = line;
        return this.invokeParseLineCallbacks(object);
      }

      return undefined;
    }

    const match = line.match(this.lineRegex);

    if (!match) {
      if (this.autoContinueInvalidLines) {
        object.tag  = 'CONT';
        object.data = line;
        return this.invokeParseLineCallbacks(object);
      }

      this.invokeCallback('ParseLineError', 'Invalid line', line);
      return this.parseLine();
    }

    object.level = parseInt(match[1], 10);

    if (match[2]) {
      object.label = match[2].trim();
    }

    object.tag = match[3].trim();

    if (match[4]) {
      object.data = match[4]; // eslint-disable-line prefer-destructuring
    }

    return this.invokeParseLineCallbacks(object);
  }

  /**
   * Invoke all callbacks resulting from a parseLine call
   *
   * if this.onParse<TAG>Line is defined, it will be called whenever a line with a matching tag is
   * parsed.  The parsed line will be passed as a parameter to the callback.
   *
   * If this.onParseLine is defined, it will be called whenever a line is parsed.  The parsed line
   * will be passed as a parameter to the callback.
   *
   * @since 1.0
   * @see invokeCallback method
   */
  invokeParseLineCallbacks(object) {
    this.invokeCallback(`Parse${object.tag}Line`, object);
    this.invokeCallback('ParseLine', object);

    return object;
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
   * Return true if there is more input.
   *
   * @since 1.0
   */
  isMoreInput() {
    return this.remainingLines(this.lineSeparator).length > 0;
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
