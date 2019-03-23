"use strict";

const Gedcom = require('../source/geni-gedcom-parser');

describe('constructor()', () => {

  it('allows overrides', () => {
    const parser = new Gedcom.Parser('', {userData: 'user data', lineSeparator: '\r\n'});
    expect(parser.userData).toEqual('user data');
    expect(parser.lineSeparator).toEqual('\r\n');
  });

}); // describe constructor()

