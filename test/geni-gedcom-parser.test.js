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

describe('parseLine()', () => {

  it('handles LEVEL TAG', () => {
    const parser = new Gedcom.Parser('0 TAG');
    expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG'});
  });

  it('handles LEVEL TAG DATA', () => {
    const parser = new Gedcom.Parser('0 TAG DATA');
    expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG', data: 'DATA'});
  });

  it('handles LEVEL TAG DATA DATA', () => {
    const parser = new Gedcom.Parser('0 TAG DATA DATA');
    expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG', data: 'DATA DATA'});
  });

  it('handles LEVEL LABEL TAG', () => {
    const parser = new Gedcom.Parser('0 @LABEL@ TAG');
    expect(parser.parseLine()).toEqual({level: 0, label: '@LABEL@', tag: 'TAG'});
  });

  it('handles LEVEL LABEL TAG DATA', () => {
    const parser = new Gedcom.Parser('0 @LABEL@ TAG DATA');
    expect(parser.parseLine()).toEqual({level: 0, label: '@LABEL@', tag: 'TAG', data: 'DATA'});
  });

  it('handles LEVEL LABEL TAG DATA DATA', () => {
    const parser = new Gedcom.Parser('0 @LABEL@ TAG DATA DATA');
    expect(parser.parseLine()).toEqual({level: 0, label: '@LABEL@', tag: 'TAG', data: 'DATA DATA'});
  });

  it('invokes the ParseLine callbacks', () => {
    const parser = new Gedcom.Parser('0 ZERO');
    parser.onParseZEROLine = jest.fn();
    parser.onParseLine = jest.fn();

    parser.parseLine();

    const expected = {level: 0, tag: 'ZERO'};
    expect(parser.onParseZEROLine).toHaveBeenCalledTimes(1);
    expect(parser.onParseZEROLine).toHaveBeenCalledWith(expected);
    expect(parser.onParseLine).toHaveBeenCalledTimes(1);
    expect(parser.onParseLine).toHaveBeenCalledWith(expected);
  });

  describe('when autoContinueInvalidLines is false', () => {
    let parser;

    function createParser(input) {
      return new Gedcom.Parser(input, {autoContinueInvalidLines: false});
    }

    afterEach( () => {
      expect(parser.autoContinueInvalidLines).toBe(false);
    });

    it('skips blank lines', () => {
      parser = createParser('\r\n \r\n0 TAG');
      expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG'});
    });

    test.each([
      ['A', 'Invalid line', 'A'],
      ['1492Columbus', 'Invalid line', '1492Columbus'],
    ])('invokes onParseLineError for invalid line "%s"', (invalidLine, ...expectedArguments) => {
      parser = createParser(invalidLine);
      parser.onParseLineError = jest.fn();
      expect(parser.parseLine()).toBeUndefined();
      expect(parser.onParseLineError).toHaveBeenCalledTimes(1);
      expect(parser.onParseLineError).toHaveBeenCalledWith(...expectedArguments);
    });

  }); // describe when autoContinueInvalidLines is false

  describe('when autoContinueInvalidLines is true', () => {
    let parser;

    function createParser(input) {
      return new Gedcom.Parser(input, {autoContinueInvalidLines: true});
    }

    afterEach( () => {
      expect(parser.autoContinueInvalidLines).toBe(true);
    });

    it('turns blank lines into CONT', () => {
      parser = createParser('\r\n \r\n0 TAG');
      expect(parser.parseLine()).toEqual({tag: 'CONT', data: ''});
      expect(parser.parseLine()).toEqual({tag: 'CONT', data: ' '});
      expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG'});
    });

    it('autocontinues invalid lines', () => {
      parser = createParser("0 TAG\r\ncontinued\r\n1 TAG\r\n\r\n1492Columbus\r\n");
      expect(parser.parseLine()).toEqual({level: 0, tag: 'TAG'});
      expect(parser.parseLine()).toEqual({tag: 'CONT', data: 'continued'});
      expect(parser.parseLine()).toEqual({level: 1, tag: 'TAG'});
      expect(parser.parseLine()).toEqual({tag: 'CONT', data: '1492Columbus'});
    });

  }); // describe when autoContinueInvalidLines is false

}); // describe parseLine()

describe('parseStructure()', () => {

  it('handles CONT', () => {
    const parser = new Gedcom.Parser('0 TAG line 1\r\n1 CONT line 2');
    expect(parser.parseStructure()).toEqual({level: 0, tag: 'TAG', data: 'line 1\nline 2'});
  });

  it('handles CONC', () => {
    const parser = new Gedcom.Parser('0 TAG line 1\r\n1 CONC  line 2');
    expect(parser.parseStructure()).toEqual({level: 0, tag: 'TAG', data: 'line 1 line 2'});
  });

  it('handles CONC and CONT', () => {
    const parser = new Gedcom.Parser('0 TAG line 1\r\n1 CONC  part 2\r\n1 CONT line 2');
    expect(parser.parseStructure()).toEqual({level: 0, tag: 'TAG', data: 'line 1 part 2\nline 2'});
  });

  it('handles nested structures', () => {
    const parser   = new Gedcom.Parser('0 INDI\n1 NAME First /Last/\n1 BIRT\n2 DATE 21 MAY 1968\n2 PLAC Florida, US\n1 BAPT\n2 DATE 22 MAY 1968\n2 PLAC Florida, US');
    const expected = { level: 0, tag: 'INDI',
      structures: [
        {level: 1, tag: 'NAME', data: 'First /Last/'},
        {level: 1, tag: 'BIRT',
          structures: [
            {level: 2, tag: 'DATE', data: '21 MAY 1968'},
            {level: 2, tag: 'PLAC', data: 'Florida, US'},
          ]
        },
        {level: 1, tag: 'BAPT',
          structures: [
            {level: 2, tag: 'DATE', data: '22 MAY 1968'},
            {level: 2, tag: 'PLAC', data: 'Florida, US'},
          ]
        },
      ]
    };
    expect(parser.parseStructure()).toEqual(expected);
  });

  it('invokes callbacks', () => {
    const parser = new Gedcom.Parser('0 INDI\n1 NAME First /Last/\n');
    parser.onParseStructure = jest.fn();
    parser.onParseINDIStructure = jest.fn();
    parser.onParseNAMEStructure = jest.fn();

    parser.parseStructure();

    expect(parser.onParseStructure).toHaveBeenCalledTimes(2);

    expect(parser.onParseINDIStructure).toHaveBeenCalledTimes(1);
    const expectedINDIRecord = {level:0, tag:'INDI', structures:[{level:1, tag:'NAME', data:'First /Last/'}]};
    expect(parser.onParseINDIStructure).toHaveBeenCalledWith(expectedINDIRecord);

    expect(parser.onParseNAMEStructure).toHaveBeenCalledTimes(1);
    const expectedNAMERecord = {level:1, tag:'NAME', data:'First /Last/'};
    expect(parser.onParseNAMEStructure).toHaveBeenCalledWith(expectedNAMERecord);
  });


}); // describe parseStructure()

describe('parseRecord()', () => {

  it('returns null when there is no input', () => {
    const parser = new Gedcom.Parser('');
    parser.readLine();
    expect(parser.parseRecord()).toBe(null);
  });

  it('returns a record', () => {
    const parser   = new Gedcom.Parser('0 INDI\n1 NAME First /Last/');
    const expected = { level: 0, tag: 'INDI',
      structures: [
        {level: 1, tag: 'NAME', data: 'First /Last/'},
      ]
    };
    expect(parser.parseRecord()).toEqual(expected);
  });

  it('invokes ParseRecordError callback on error', () => {
    const parser = new Gedcom.Parser('1 NAME First /Last/');
    parser.onParseRecordError = jest.fn();
    expect(parser.parseRecord()).toBe(null);
    expect(parser.onParseRecordError).toHaveBeenCalledTimes(1);
    expect(parser.onParseRecordError).toHaveBeenCalledWith('Invalid record', {level:1, tag:'NAME', data:'First /Last/'});
  });

  it('invokes callbacks', () => {
    const parser = new Gedcom.Parser('0 INDI\n1 NAME First /Last/\n');
    parser.onParseRecord = jest.fn();
    parser.onParseINDIRecord = jest.fn();

    parser.parseRecord();

    expect(parser.onParseRecord).toHaveBeenCalledTimes(1);

    expect(parser.onParseINDIRecord).toHaveBeenCalledTimes(1);
    const expectedINDIRecord = {level:0, tag:'INDI', structures:[{level:1, tag:'NAME', data:'First /Last/'}]};
    expect(parser.onParseINDIRecord).toHaveBeenCalledWith(expectedINDIRecord);
  });

}); // describe parseRecord()

describe('parseAllRecords()', () => {

  it('returns empty array when there is no input', () => {
    const parser = new Gedcom.Parser('');
    parser.readLine();
    expect(parser.parseAllRecords()).toEqual([]);
  });

  it('returns all records', () => {
    const parser   = new Gedcom.Parser('0 HEAD\n0 @I1@ INDI\n1 NAME First /Last/\n0 @F1@ FAM\n1 HUSB @I1@\n0 TRLR\n');
    const expected = [
      {level: 0, tag: 'HEAD'},
      {level: 0, label: '@I1@', tag: 'INDI', structures: [{level: 1, tag: 'NAME', data: 'First /Last/'}]},
      {level: 0, label: '@F1@', tag: 'FAM',  structures: [{level: 1, tag: 'HUSB', data: '@I1@'}]},
      {level: 0, tag: 'TRLR'},
    ];
    expect(parser.parseAllRecords()).toEqual(expected);
  });

}); // describe parseAllRecords()

