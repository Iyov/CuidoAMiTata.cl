import { describe, it, expect } from 'vitest';
import { Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr } from './result';
import { ErrorCode } from './enums';

describe('Result Type', () => {
  describe('Ok', () => {
    it('should create a successful Result', () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('Err', () => {
    it('should create an error Result', () => {
      const error = { code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Campo requerido' };
      const result = Err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
    });
  });

  describe('isOk', () => {
    it('should return true for Ok result', () => {
      const result = Ok(42);
      expect(isOk(result)).toBe(true);
    });

    it('should return false for Err result', () => {
      const result = Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' });
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return false for Ok result', () => {
      const result = Ok(42);
      expect(isErr(result)).toBe(false);
    });

    it('should return true for Err result', () => {
      const result = Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' });
      expect(isErr(result)).toBe(true);
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw for Err result', () => {
      const result = Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' });
      expect(() => unwrap(result)).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default value for Err result', () => {
      const result = Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' });
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = Ok(42);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(84);
      }
    });

    it('should pass through Err unchanged', () => {
      const error = { code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' };
      const result = Err(error);
      const mapped = map(result, (x: number) => x * 2);
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toEqual(error);
      }
    });
  });

  describe('mapErr', () => {
    it('should pass through Ok unchanged', () => {
      const result = Ok(42);
      const mapped = mapErr(result, (e) => ({ ...e, message: 'Modified' }));
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });

    it('should transform Err', () => {
      const error = { code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Error' };
      const result = Err(error);
      const mapped = mapErr(result, (e) => ({ ...e, message: 'Modified' }));
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error.message).toBe('Modified');
      }
    });
  });
});
