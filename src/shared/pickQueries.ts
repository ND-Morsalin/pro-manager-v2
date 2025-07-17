export default function pickQueries<T extends Record<string, any>>(
  query: Record<string, any>,
  allowedFields: Record<string, string[] | string>
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in allowedFields) {
    if (query[key] !== undefined) {
      const allowedValues = Array.isArray(allowedFields[key])
        ? allowedFields[key]
        : [allowedFields[key]];
      if (allowedValues.includes(query[key])) {
        result[key as keyof T] = query[key];
      } else {
        result[key as keyof T] = allowedValues[0] as T[keyof T]; // Default to first allowed value
      }
    }
  }

  return result;
}
