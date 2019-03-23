"use strict";

const Gedcom = require('../source/geni-gedcom-parser');

describe('constructor()', () => {

  it('allows overrides', () => {
    const parser = new Gedcom.Parser('', {userData: 'user data', lineSeparator: '\r\n'});
    expect(parser.userData).toEqual('user data');
    expect(parser.lineSeparator).toEqual('\r\n');
  });

}); // describe constructor()

describe('log()', () => {

  it('takes an arbitray number of arguments', () => {
    const parser     = new Gedcom.Parser();
    global.console = { log: jest.fn() };
    parser.log('one', 'two', 'tre');
    expect(global.console.log).toHaveBeenCalledTimes(1);
    expect(global.console.log).toHaveBeenCalledWith('one', 'two', 'tre');
  });

}); // describe log()
