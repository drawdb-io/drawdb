module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$",
};
