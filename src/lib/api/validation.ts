import { ApiError } from "@/lib/api/errors";

interface StringParamOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
}

interface NumberParamOptions {
  required?: boolean;
  min?: number;
  max?: number;
}

interface EnumParamOptions {
  required?: boolean;
}

interface BooleanParamOptions {
  required?: boolean;
}

type BodyRecord = Record<string, unknown>;
const UNSAFE_INPUT_PATTERNS = [/<\s*script/gi, /javascript:/gi, /onerror\s*=/gi];

function stripControlCharacters(value: string): string {
  let cleaned = "";

  for (const char of value) {
    const charCode = char.charCodeAt(0);
    const isControlCharacter = (charCode >= 0 && charCode <= 31) || charCode === 127;

    if (!isControlCharacter) {
      cleaned += char;
    }
  }

  return cleaned;
}

function sanitizeStringInput(value: string, field: string): string {
  const normalized = value.normalize("NFKC");
  const withoutControlChars = stripControlCharacters(normalized);

  for (const pattern of UNSAFE_INPUT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(withoutControlChars)) {
      validationError(field, "contains unsafe content");
    }
  }

  return withoutControlChars;
}

function validationError(field: string, reason: string, details?: unknown): never {
  throw new ApiError({
    status: 400,
    code: "VALIDATION_ERROR",
    message: `Invalid '${field}' parameter: ${reason}`,
    details,
    expose: true
  });
}

function readStringParam(
  params: URLSearchParams,
  field: string,
  options: StringParamOptions = {}
): string | undefined {
  const rawValue = params.get(field);

  if (rawValue === null || rawValue === "") {
    if (options.required) {
      validationError(field, "value is required");
    }

    return undefined;
  }

  const sanitized = sanitizeStringInput(rawValue, field);
  const value = options.trim === false ? sanitized : sanitized.trim();

  if (options.required && value.length === 0) {
    validationError(field, "value is required");
  }

  if (typeof options.minLength === "number" && value.length < options.minLength) {
    validationError(field, `must be at least ${options.minLength} characters`);
  }

  if (typeof options.maxLength === "number" && value.length > options.maxLength) {
    validationError(field, `must be at most ${options.maxLength} characters`);
  }

  return value;
}

function readIntegerParam(
  params: URLSearchParams,
  field: string,
  options: NumberParamOptions = {}
): number | undefined {
  const rawValue = params.get(field);

  if (rawValue === null || rawValue === "") {
    if (options.required) {
      validationError(field, "value is required");
    }

    return undefined;
  }

  if (!/^-?\d+$/.test(rawValue)) {
    validationError(field, "must be an integer");
  }

  const value = Number.parseInt(rawValue, 10);

  if (typeof options.min === "number" && value < options.min) {
    validationError(field, `must be greater than or equal to ${options.min}`);
  }

  if (typeof options.max === "number" && value > options.max) {
    validationError(field, `must be less than or equal to ${options.max}`);
  }

  return value;
}

function readEnumParam<TValue extends string>(
  params: URLSearchParams,
  field: string,
  allowedValues: readonly TValue[],
  options: EnumParamOptions = {}
): TValue | undefined {
  const value = readStringParam(params, field, { required: options.required, trim: true });

  if (typeof value === "undefined") {
    return undefined;
  }

  if (!allowedValues.includes(value as TValue)) {
    validationError(field, `must be one of: ${allowedValues.join(", ")}`);
  }

  return value as TValue;
}

function ensureObjectRecord(value: unknown, field = "body"): BodyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    validationError(field, "must be a JSON object");
  }

  return value as BodyRecord;
}

function readBodyString(
  body: BodyRecord,
  field: string,
  options: StringParamOptions = {}
): string | undefined {
  const rawValue = body[field];

  if (typeof rawValue === "undefined" || rawValue === null || rawValue === "") {
    if (options.required) {
      validationError(field, "value is required");
    }

    return undefined;
  }

  if (typeof rawValue !== "string") {
    validationError(field, "must be a string");
  }

  const sanitized = sanitizeStringInput(rawValue, field);
  const value = options.trim === false ? sanitized : sanitized.trim();

  if (options.required && value.length === 0) {
    validationError(field, "value is required");
  }

  if (typeof options.minLength === "number" && value.length < options.minLength) {
    validationError(field, `must be at least ${options.minLength} characters`);
  }

  if (typeof options.maxLength === "number" && value.length > options.maxLength) {
    validationError(field, `must be at most ${options.maxLength} characters`);
  }

  return value;
}

function readBodyEnum<TValue extends string>(
  body: BodyRecord,
  field: string,
  allowedValues: readonly TValue[],
  options: EnumParamOptions = {}
): TValue | undefined {
  const value = readBodyString(body, field, { required: options.required, trim: true });

  if (typeof value === "undefined") {
    return undefined;
  }

  if (!allowedValues.includes(value as TValue)) {
    validationError(field, `must be one of: ${allowedValues.join(", ")}`);
  }

  return value as TValue;
}

function readBodyInteger(
  body: BodyRecord,
  field: string,
  options: NumberParamOptions = {}
): number | undefined {
  const rawValue = body[field];

  if (typeof rawValue === "undefined" || rawValue === null || rawValue === "") {
    if (options.required) {
      validationError(field, "value is required");
    }

    return undefined;
  }

  const value =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && /^-?\d+$/.test(rawValue)
        ? Number.parseInt(rawValue, 10)
        : Number.NaN;

  if (!Number.isInteger(value)) {
    validationError(field, "must be an integer");
  }

  if (typeof options.min === "number" && value < options.min) {
    validationError(field, `must be greater than or equal to ${options.min}`);
  }

  if (typeof options.max === "number" && value > options.max) {
    validationError(field, `must be less than or equal to ${options.max}`);
  }

  return value;
}

function readBodyBoolean(
  body: BodyRecord,
  field: string,
  options: BooleanParamOptions = {}
): boolean | undefined {
  const rawValue = body[field];

  if (typeof rawValue === "undefined" || rawValue === null || rawValue === "") {
    if (options.required) {
      validationError(field, "value is required");
    }

    return undefined;
  }

  if (typeof rawValue === "boolean") {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    const normalizedValue = rawValue.trim().toLowerCase();

    if (normalizedValue === "true" || normalizedValue === "1") {
      return true;
    }

    if (normalizedValue === "false" || normalizedValue === "0") {
      return false;
    }
  }

  validationError(field, "must be a boolean");
}

export {
  ensureObjectRecord,
  readBodyBoolean,
  readBodyEnum,
  readBodyInteger,
  readBodyString,
  readEnumParam,
  readIntegerParam,
  readStringParam
};
