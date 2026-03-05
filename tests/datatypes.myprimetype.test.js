const path = require('path');

function loadDatatypes() {
  const tryPaths = [
    path.resolve(__dirname, '../data/datatypes.js'),
    path.resolve(__dirname, '../src/data/datatypes.js'),
  ];

  for (const p of tryPaths) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const mod = require(p);
      if (Array.isArray(mod)) return mod;
      if (Array.isArray(mod.default)) return mod.default;
      if (mod.datatypes && Array.isArray(mod.datatypes)) return mod.datatypes;
      return mod;
    } catch (e) {
      // try next path
    }
  }
  throw new Error('Could not load datatypes module from expected paths');
}

const datatypes = loadDatatypes();
const typeEntry = Array.isArray(datatypes)
  ? datatypes.find(t => t && (t.name === 'MYPRIMETYPE' || t.key === 'MYPRIMETYPE'))
  : (datatypes && (datatypes.MYPRIMETYPE || datatypes['MYPRIMETYPE']));

test('MYPRIMETYPE exists', () => {
  expect(typeEntry).toBeDefined();
});

test('MYPRIMETYPE validator accepts prime numbers', () => {
  expect(typeEntry).toBeDefined();
  const validate = typeEntry.validate;
  expect(typeof validate).toBe('function');

  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  primes.forEach(n => {
    expect(validate(n)).toBeTruthy();
    expect(validate(String(n))).toBeTruthy();
  });
});

test('MYPRIMETYPE validator rejects non-prime numbers', () => {
  expect(typeEntry).toBeDefined();
  const validate = typeEntry.validate;
  expect(typeof validate).toBe('function');

  const nonPrimes = [0, 1, 4, 6, 8, 9, 10, 12, 15, 16];
  nonPrimes.forEach(n => {
    expect(validate(n)).toBeFalsy();
    expect(validate(String(n))).toBeFalsy();
  });
});
