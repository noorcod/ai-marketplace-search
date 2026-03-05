import { BaseRepository } from '@common/database/base.repository';
import { LegacyOrder } from '../entities/legacy-order.entity';
import { QueryWhere } from '@common/interfaces/repository.interface';
import { Logger } from '@nestjs/common';

export class LegacyOrderRepository extends BaseRepository<LegacyOrder> {
  private readonly logger = new Logger(LegacyOrderRepository.name);

  async getStatusCounts(where: QueryWhere): Promise<Array<{ status: string; count: number }>> {
    const conn = this.em.getConnection();
    const params: any[] = [];
    const conditions: string[] = [];

    // build where clause safely
    if (where.isDeleted !== undefined) {
      conditions.push('is_deleted = ?');
      params.push(where.isDeleted ? 1 : 0); // DB stores tinyint 0/1
    }
    if (where.customer) {
      conditions.push('fk_customer_id = ?');
      params.push(where.customer);
    }
    if (where.shop) {
      conditions.push('fk_shop_id = ?');
      params.push(where.shop);
    }
    if (where.createdAt?.$gte && where.createdAt?.$lte) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(where.createdAt.$gte, where.createdAt.$lte);
    }

    const whereSql = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT status, COUNT(*) AS count FROM d4u_order${whereSql} GROUP BY status`;

    const rows = await conn.execute(sql, params);
    // conn.execute(...) returns array of row objects: [{ status: 'Pending', count: '10' }, ...]

    return (rows as any[]).map(r => ({ status: r.status, count: Number(r.count) }));
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
