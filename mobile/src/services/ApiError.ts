export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
