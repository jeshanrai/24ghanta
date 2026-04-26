import pool from '../db';

export type AuthorPerms = {
  is_active: boolean;
  can_publish: boolean;
  can_create_articles: boolean;
  can_create_videos: boolean;
  can_delete_own: boolean;
  can_feature_articles: boolean;
  can_mark_breaking: boolean;
  can_create_tags: boolean;
};

export const PERM_COLUMNS = [
  'is_active',
  'can_publish',
  'can_create_articles',
  'can_create_videos',
  'can_delete_own',
  'can_feature_articles',
  'can_mark_breaking',
  'can_create_tags',
] as const;

export async function loadAuthorPerms(authorId: number): Promise<AuthorPerms | null> {
  const { rows } = await pool.query(
    `SELECT is_active, can_publish, can_create_articles, can_create_videos,
            can_delete_own, can_feature_articles, can_mark_breaking, can_create_tags
       FROM authors WHERE id = $1`,
    [authorId]
  );
  return rows[0] || null;
}
