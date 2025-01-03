export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GranularityMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GranularityMismatchError';
  }
}

export class DataFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataFetchError';
  }
} 