# Configuration Files

This folder contains configuration files for the Ventprom Packer project.

## Files

- `jest.config.js` - Jest testing configuration
- `jest.setup.js` - Jest setup file for test environment
- `tsconfig.base.json` - Base TypeScript configuration

## Usage

These configuration files are referenced by:

- **Jest Config**: Used by `npm test` and `npm run test:watch` commands
- **TypeScript Config**: Extended by all package and app tsconfig.json files

## Structure

- `jest.config.js` - Main Jest configuration with test paths and setup
- `jest.setup.js` - Global test setup and environment configuration
- `tsconfig.base.json` - Shared TypeScript compiler options

## Note

These files are automatically referenced by the build and test scripts. No manual configuration is required.


