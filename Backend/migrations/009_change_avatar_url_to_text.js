/**
 * Migration: 009_change_avatar_url_to_text
 *
 * Changes avatar_url from string (varchar 255) to text to support base64 images.
 * Note: SQLite handles 'string' as 'text' anyway, so we skip alter for SQLite
 * to avoid FOREIGN KEY constraint issues.
 */

exports.up = async function (knex) {
    if (knex.client.config.client === 'pg') {
        await knex.schema.alterTable('users', (t) => {
            t.text('avatar_url').alter();
        });
    }
};

exports.down = async function (knex) {
    if (knex.client.config.client === 'pg') {
        await knex.schema.alterTable('users', (t) => {
            t.string('avatar_url').alter();
        });
    }
};
