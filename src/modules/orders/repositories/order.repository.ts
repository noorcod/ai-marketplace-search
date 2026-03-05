import { BaseRepository } from '@common/database/base.repository';
import { Order } from '../entities/order.entity';
import { QueryWhere } from '@common/interfaces/repository.interface';
import { Logger } from '@nestjs/common';
export class OrderRepository extends BaseRepository<Order> {
  private readonly logger = new Logger(OrderRepository.name);

  /**
   * Get order status counts with optional filters
   */
  async getStatusCounts(where: QueryWhere<Order>): Promise<Array<{ status: string; count: number }>> {
    const userId = (where as any).user;

    // Build SQL query with proper parameter binding
    const params: Array<string | number | Date> = [];
    const conditions: string[] = [];

    if (where.isDeleted !== undefined) {
      conditions.push('is_deleted = ?');
      params.push(where.isDeleted ? 1 : 0);
    }

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (where.shop) {
      conditions.push('id IN (SELECT order_id FROM order_source WHERE shop_id = ?)');
      params.push(where.shop);
    }

    if (where.createdAt?.$gte && where.createdAt?.$lte) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(where.createdAt.$gte, where.createdAt.$lte);
    }

    const whereSql = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT status, COUNT(*) as count FROM \`order\`${whereSql} GROUP BY status`;

    const results = (await this.em.getConnection().execute(sql, params)) as Array<{
      status: string;
      count: number | string;
    }>;

    return results.map(r => ({
      status: r.status,
      count: Number(r.count),
    }));
  }

  async checkIfOrderIsPotentialScam(contactNumber: string, email: string): Promise<boolean> {
    try {
      // Use raw SQL to avoid MikroORM query builder issues with COUNT(*)
      const sql = `SELECT COUNT(*) as count FROM spam_log WHERE phone_number = ? OR email = ?`;
      const result = await this.em.getConnection().execute(sql, [contactNumber, email]);

      const count = Number(result[0]?.count ?? 0);
      return count > 0;
    } catch (error) {
      Logger.error('Repository', error.message);
      throw error;
      // return AppResponse.Err(error.message);
    }
  }
}
