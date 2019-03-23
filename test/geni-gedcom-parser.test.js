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

describe('readLine()', () => {

  it('handles an empty line', () => {
    const parser = new Gedcom.Parser('');
    expect(parser.readLine()).toEqual('');
  });

  it('handles an invalid line', () => {
    const parser = new Gedcom.Parser('invalid');
    expect(parser.readLine()).toEqual('invalid');
  });

  it('handles different line terminators', () => {
    const parser = new Gedcom.Parser('0 ZERO\n1 ONE\r2 TWO\r\n3 THREE');
    expect(parser.readLine()).toEqual('0 ZERO');
    expect(parser.readLine()).toEqual('1 ONE');
    expect(parser.readLine()).toEqual('2 TWO');
    expect(parser.readLine()).toEqual('3 THREE');
    expect(parser.readLine()).toBeFalsy();
  });

  it('updates lineNumber', () => {
    const parser = new Gedcom.Parser('0 ZERO\n1 ONE');
    parser.readLine();
    expect(parser.lineNumber).toBe(1);
    parser.readLine();
    expect(parser.lineNumber).toBe(2);
  });

  it('does not update lineNumber at end of file', () =>{
    const parser = new Gedcom.Parser('');
    parser.readLine();
    expect(parser.lineNumber).toBe(0);
  });

  it('invoke the ReadLine callback', () => {
    const parser = new Gedcom.Parser('0 ZERO');
    parser.onReadLine = jest.fn();
    parser.readLine();
    expect(parser.onReadLine).toHaveBeenCalledTimes(1);
    expect(parser.onReadLine).toHaveBeenCalledWith('0 ZERO');
  });

}); // describe readLine()
