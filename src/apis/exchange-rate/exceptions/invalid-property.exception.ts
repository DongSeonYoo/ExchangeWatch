/**
 * check for developler mistakes when using decorator arguments
 * throw plain Error
 */
export class InvalidPropertyException extends Error {
  constructor(propertyName: string) {
    super(`invalid proepry name: ${propertyName}`);
  }
}
