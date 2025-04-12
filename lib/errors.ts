
export class DatabaseError extends Error {
    constructor(message = "An error occurred when accessing the database.") {
      super(message);
      this.name = "DATABASE_ERROR";
    }
  }
  
  export class UserInputError extends Error {
    constructor(message = "The provided input fields are not valid") {
      super(message);
      this.name = "USER_INPUT_ERROR";
    }
  }
  
  export class ApiError extends Error {
    constructor(message = "There is a problem with the API") {
      super(message);
      this.name = "EXTERNAL_API_ERROR";
    }
  }
  
  export class NotFoundError extends Error {
    constructor(message = "The requested resource was not found") {
      super(message);
      this.name = "NOT_FOUND_ERROR";
    }
  }
  
  export class AuthError extends Error {
    constructor(message = "Authentication error") {
      super(message);
      this.name = "AUTH_ERROR";
    }
  }
  
  export interface ErrorResponse {
    message: string;
    statusCode: number;
  }
  
  // Logger implementation
  export const logger = {
    info: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[INFO] ${message}`, meta);
      } else {
        // Here I'd would put a decent logger, but well maybe later
        console.info(`[INFO] ${message}`);
      }
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[WARN] ${message}`, meta);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${message}`, meta);
      } else {
        console.error(`[ERROR] ${message}`);
        // same here
      }
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${message}`, meta);
      }
    },
  };
  
  /**
   * Handles thrown errors and returns an object with a message and HTTP status.
   * The actual error is logged but not exposed to the client.
   */
  export function handleError(error: unknown): ErrorResponse {
    if (error instanceof UserInputError) {
      logger.warn(`User input error: ${error.message}`, { error });
      return {
        message: `Validation error: ${error.message}`,
        statusCode: 400,
      };
    }
  
    if (error instanceof AuthError) {
      logger.warn(`Auth error: ${error.message}`, { error });
      return {
        message: `You don't have permission to perform this action.`,
        statusCode: 403,
      };
    }
  
    if (error instanceof NotFoundError) {
      logger.info(`Resource not found: ${error.message}`, { error });
      return {
        message: `The requested resource was not found.`,
        statusCode: 404,
      };
    }
  
    if (error instanceof ApiError) {
      logger.error(`External service error: ${error.message}`, { error });
      return {
        message: `Error communicating with an external service.`,
        statusCode: 502,
      };
    }
  
    if (error instanceof DatabaseError) {
      logger.error(`Database error: ${error.message}`, { error });
      return {
        message: `Internal error. Please try again later.`,
        statusCode: 500,
      };
    }
  
    // Fallback for unexpected errors
    const genericError = error instanceof Error ? error : new Error(String(error));
    logger.error(`Unexpected error: ${genericError.message}`, { error: genericError });
    return {
      message: `An unexpected error occurred. Please contact support.`,
      statusCode: 500,
    };
  }