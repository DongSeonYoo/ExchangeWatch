import 'reflect-metadata';

// Mocking @nestjs-cls module
jest.mock('@nestjs-cls/transactional', () => ({
  ...jest.requireActual('@nestjs-cls/transactional'),
  Transactional: () => () => {},
}));
