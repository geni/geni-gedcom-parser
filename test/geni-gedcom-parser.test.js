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

describe('invokeCallback()', () => {

  it('does nothing if the callback is undefined', () => {
    const parser = new Gedcom.Parser();
    parser.invokeCallback('Foo', 'arg1', 'arg2');
  });

  it('invokes a named callback with arbitrary parameters', () => {
    const parser = new Gedcom.Parser();
    parser.onFoo = function(arg1, arg2) {
      expect(arg1).toEqual('arg1');
      expect(arg2).toEqual('arg2');
    }
    parser.invokeCallback('Foo', 'arg1', 'arg2');
  });

  it('value of "this" is the parser', () => {
    const parser = new Gedcom.Parser();
    parser.onFoo = function() {
      expect(this).toEqual(parser);
    }
    parser.invokeCallback('Foo');
  });

}); // describe invokeCallback()
