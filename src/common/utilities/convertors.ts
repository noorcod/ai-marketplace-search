import { EntityMetadata, MikroORM } from '@mikro-orm/core';
import { FilterQuery } from '@mikro-orm/mysql';

export async function createPropertyToColumnMap(orm: MikroORM, entity: Function): Promise<Record<string, string>> {
  const metadata: EntityMetadata = orm.getMetadata().get(entity.name);
  const propertyToColumnMap: Record<string, string> = {};

  for (const propName in metadata.properties) {
    const prop = metadata.properties[propName];
    if (prop.kind !== 'scalar') continue;
    propertyToColumnMap[propName] = prop.fieldNames[0];
  }

  return propertyToColumnMap;
}

// format number for Pakistani Rupees and also remove decimal points
export function formatNumberAsCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
  })
    .format(value)
    .replace('.00', '');
}

// Convert from MB to GB and keep to one decimal place
export function convertMbToGb(value: number) {
  return (value / 1024).toFixed(1);
}

export function convertFilterQueryToSqlWhere<T>(filterQuery: FilterQuery<T>): string {
  const conditions: string[] = [];

  for (const [field, condition] of Object.entries(filterQuery)) {
    if (typeof condition === 'object' && condition !== null) {
      for (const [operator, value] of Object.entries(condition)) {
        switch (operator) {
          case '$eq':
            conditions.push(`${field} = ${formatValue(value)}`);
            break;
          case '$in':
            conditions.push(`${field} IN (${(value as any[]).map(v => formatValue(v)).join(', ')})`);
            break;
          case '$gt':
            conditions.push(`${field} > ${formatValue(value)}`);
            break;
          case '$lt':
            conditions.push(`${field} < ${formatValue(value)}`);
            break;
          // Add more cases for other operators as needed
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      }
    } else {
      conditions.push(`${field} = ${formatValue(condition)}`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
  }
  return value.toString();
}
