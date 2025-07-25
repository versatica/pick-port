const config = {
	verbose: true,
	testEnvironment: 'node',
	testRegex: 'src/test/tests.ts',
	transform: {
		'^.+\\.ts?$': ['ts-jest'],
	},
	coveragePathIgnorePatterns: ['src/Logger.ts', 'src/test'],
	cacheDirectory: '.cache/jest',
};

export default config;
