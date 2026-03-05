export function nestedObjectToDotFields(obj: Record<string, any>, prefix = ''): string[] {
  const fields: string[] = [];

  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (value === true) {
      fields.push(path);
    } else if (typeof value === 'object' && value !== null) {
      fields.push(...nestedObjectToDotFields(value, path));
    }
  }

  return fields;
}
