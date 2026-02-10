import { eq } from 'drizzle-orm';

export async function insertReturning(db: any, table: any, values: any): Promise<any> {
  const result = await db.insert(table).values(values);
  const insertId = result[0]?.insertId;
  if (insertId) {
    const [row] = await db.select().from(table).where(eq(table.id, insertId));
    return row;
  }
  return null;
}

export async function updateReturning(db: any, table: any, set: any, whereClause: any): Promise<any> {
  await db.update(table).set(set).where(whereClause);
  const [row] = await db.select().from(table).where(whereClause);
  return row;
}

export async function deleteReturning(db: any, table: any, whereClause: any): Promise<any> {
  const [row] = await db.select().from(table).where(whereClause);
  await db.delete(table).where(whereClause);
  return row;
}
