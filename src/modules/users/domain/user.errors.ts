export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('A user with this email already exists.');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidUserEmailError extends Error {
  constructor() {
    super('The user email is invalid.');
    this.name = 'InvalidUserEmailError';
  }
}
