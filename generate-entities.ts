// import { MikroORM } from '@mikro-orm/core';
// import { EntityGenerator } from '@mikro-orm/entity-generator';
// import { MySqlDriver } from '@mikro-orm/mysql';
// import * as process from 'process';
//
// (async () => {
//   const orm = await MikroORM.init({
//     discovery: { warnWhenNoEntities: false },
//     extensions: [EntityGenerator],
//     dbName: 'live_090425',
//     host: '62.72.29.235',
//     port: 3306,
//     user: 'root',
//     password: '1OtVcJqWHzMgqnX',
//     debug: true,
//     driver: MySqlDriver,
//     // driver: CustomMySqlDriver,
//     pool: {
//       min: 2,
//       max: 10,
//       idleTimeoutMillis: 600000,
//     },
//   });
//   const dump = await orm.entityGenerator.generate({
//     save: true,
//     path: process.cwd() + '/tmp-entities/',
//     bidirectionalRelations: false,
//     fileName: entity => entity + '.entity',
//     skipTables: [
//       'all_data_images',
//       'all_item_images',
//       'top_10_listed_brands',
//       'v_active_listings_with_shop_name',
//       'v_nav_brands',
//       'v_sales_person_commission',
//       'v_total_listings_per_shop',
//     ],
//     skipColumns: {
//       bank_account_transactions: ['type', 'against', 'transaction_medium'],
//       d4u_order: ['status', 'order_handled_by', 'trx_method', 'trx_status', 'trx_refund_status'],
//       d4u_seller_payments: ['order_payment_method', 'settlement_type', 'payment_status'],
//       featured_booking: ['status'],
//       featured_booking_trx: ['payment_method', 'trx_status'],
//       listing: ['listing_type', 'status'],
//       listing_meta: ['meta_key'],
//       listing_price: ['discount_unit'],
//       marketplace_banner: ['style', 'page'],
//       model_entry_logs: ['operation'],
//       modules: ['type'],
//       platform_commission: ['comm_type_for_amount_lt_cap', 'comm_type_for_amount_gte_cap'],
//     },
//     // takeTables: ['seller_registration_requests'],
//   });
//   console.log(dump);
//   await orm.close(true);
// })();
//
// // Command: npx ts-node generate-entities.ts

// generate-entities.ts
import { MikroORM } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MySqlDriver } from '@mikro-orm/mysql';
import * as process from 'process';

(async () => {
  // 1) init ORM as usual
  const orm = await MikroORM.init({
    driver: MySqlDriver,
    dbName: 'live_090425',
    host: '62.72.29.235',
    port: 3306,
    user: 'root',
    password: '1OtVcJqWHzMgqnX',
    debug: true,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });

  // 2) grab the helper from the running EM
  const helper = (orm.em as any)
    .getPlatform() // get the SQL platform :contentReference[oaicite:0]{index=0}
    .getSchemaHelper(); // grab its SchemaHelper instance :contentReference[oaicite:1]{index=1}

  // 3) patch getAllEnumDefinitions (used in loadInformationSchema)
  const origAll = helper.getAllEnumDefinitions.bind(helper);
  helper.getAllEnumDefinitions = async function (conn: any, tables: any[]) {
    try {
      return await origAll(conn, tables);
    } catch (err: any) {
      console.warn('⚠️ skipping broken ALL-ENUM parse:', err);
      // return empty enums for each table so reduce() never runs on null
      const ret: Record<string, Record<string, string[]>> = {};
      for (const t of tables) {
        ret[t.table_name] = {};
      }
      return ret;
    }
  };

  // helper.getAllEnumDefinitions = async function (conn: any, tables: any[]) {
  //   const result: Record<string, Record<string, string[]>> = {};
  //   for (const t of tables) {
  //     try {
  //       const defs = await origAll(conn, [t]);
  //       Object.assign(result, defs);
  //     } catch (err: any) {
  //       console.error(`❌ enum parse error on table ${t.table_name}:`, err.message);
  //     }
  //   }
  //   return result;
  // };
  //
  // // 4) also patch getEnumDefinitions just in case
  if (helper.getEnumDefinitions) {
    const origOne = helper.getEnumDefinitions.bind(helper);
    helper.getEnumDefinitions = async function (conn: any, checks: any[], table: string, schema?: string) {
      try {
        return await origOne(conn, checks, table, schema);
      } catch (err: any) {
        console.warn(`⚠️ skipping broken ENUM parse on ${table}:`, err);
        return {};
      }
    };
  }

  // 4) now generate entities—your patched helper will be used
  await orm.entityGenerator.generate({
    save: true,
    path: process.cwd() + '/tmp-entities/',
    bidirectionalRelations: false,
    fileName: ent => toKebabCase(ent) + '.entity',
    skipTables: [
      'all_data_images',
      'all_item_images',
      'top_10_listed_brands',
      'v_active_listings_with_shop_name',
      'v_nav_brands',
      'v_sales_person_commission',
      'v_total_listings_per_shop',
    ],
    // takeTables: ['listing_review'],
    takeTables: [
      'marketplace_user',
      'city',
      'categories',
      'listing',
      'shop',
      'items',
      'delivery_charges',
      'voucher',
      'address_tag',
      'user_address',
      'cart',
      'cart_item',
      'order',
      'order_source',
      'order_item',
      'order_payment',
      'order_delivery_address',
      'delivery_partner',
      'order_tracking',
      'internal_order_log',
    ],
  });

  await orm.close(true);
  console.log('✅ Done generating entities (with ENUMs skipped).');
})();

// Utility to convert PascalCase to kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase letters
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Insert hyphen between consecutive uppercase letters
    .toLowerCase(); // Convert to lowercase
}

// command: npx ts-node generate-entities.ts
