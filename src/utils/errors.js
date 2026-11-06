export class ChitPlayError extends Error {
  constructor(message, code = 'GENERIC') {
    super(message);
    this.name = 'ChitPlayError';
    this.code = code;
  }
}

export class StateTransitionError extends ChitPlayError {
  constructor(from, to) {
    super(`Invalid state transition: ${from} → ${to}`, 'INVALID_TRANSITION');
    this.from = from;
    this.to = to;
  }
}

export class ValidationError extends ChitPlayError {
  constructor(message, field = null) {
    super(message, 'VALIDATION');
    this.field = field;
  }
}

export class StorageError extends ChitPlayError {
  constructor(message) {
    super(message, 'STORAGE');
  }
}