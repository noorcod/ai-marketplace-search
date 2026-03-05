export class OrderByOptions {
  orders: { column: string; order: 'ASC' | 'DESC' | 1 | -1 }[] = [];

  constructor(...inputs: Array<string | [string, string | number] | Array<string | number>>) {
    const parsed: Array<[string, string | number]> = [];

    for (const input of inputs) {
      if (typeof input === 'string') {
        const parts = input.split(',');
        for (const part of parts) {
          const [key, value] = part.split(':');
          if (!key || !value) {
            throw new Error(`Invalid sort string: "${part}". Expected "column:order"`);
          }
          parsed.push([key.trim(), /^\-?\d+$/.test(value.trim()) ? Number(value.trim()) : value.trim()]);
        }
      } else if (Array.isArray(input) && input.length === 2 && typeof input[0] === 'string') {
        parsed.push([input[0].trim(), input[1]]);
      } else {
        throw new Error(`Invalid input element: ${JSON.stringify(input)}`);
      }
    }

    this.orders = parsed.map(([column, rawOrder]) => {
      if (typeof rawOrder === 'string') {
        const upper = rawOrder.toUpperCase();
        if (upper === 'ASC' || upper === 'DESC') {
          return { column, order: upper };
        }
        throw new Error(`Invalid order string: "${rawOrder}". Use "ASC" or "DESC".`);
      } else if (rawOrder === 1 || rawOrder === -1) {
        return { column, order: rawOrder };
      } else {
        throw new Error(`Invalid order value: "${rawOrder}". Use "ASC", "DESC", 1, or -1.`);
      }
    });
  }

  /** Knex: { column, order } or array of them */
  getForKnex(): { column: string; order: 'ASC' | 'DESC' } | { column: string; order: 'ASC' | 'DESC' }[] {
    const result = this.orders.map(({ column, order }) => ({
      column,
      order: typeof order === 'number' ? (order === 1 ? 'ASC' : 'DESC') : order,
    }));
    return result.length === 1 ? result[0] : result;
  }

  /** Object: { column: order } or full object */
  getAsObject(): Record<string, 'ASC' | 'DESC' | 1 | -1> | [string, 'ASC' | 'DESC' | 1 | -1] {
    const result = Object.fromEntries(this.orders.map(({ column, order }) => [column, order]));
    return this.orders.length === 1 ? [this.orders[0].column, this.orders[0].order] : result;
  }

  toString(): string {
    return this.orders.map(({ column, order }) => `${column}:${order}`).join(', ');
  }

  getForQueryOption(): Record<string, 'ASC' | 'DESC' | 1 | -1> | Record<string, 'ASC' | 'DESC' | 1 | -1>[] {
    const result = {};
    for (const { column, order } of this.orders) {
      result[column] = order;
    }
    return this.orders.length === 1 ? { [this.orders[0].column]: this.orders[0].order } : result;
  }
}
