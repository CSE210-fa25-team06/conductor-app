const { pool } = require("../models/db");

/*
    Returns names and emails of members where the name-start matches the passed in query.
    Optionally filters by role name when a role is provided.
*/

async function searchDirectory(query, role) {
    const  baseQuery = `
        SELECT u.id, u.photo_url, u.name, u.email, array_agg(r.name) as roles, g.name as group_name, contact_info, availability
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r on ur.role_id = r.id
        LEFT JOIN groups g on g.id = u.group_id
        WHERE u.name ilike $1
        GROUP BY u.id, u.photo_url, u.name, u.email, g.name, contact_info, availability
        HAVING $2::text IS NULL OR $2 = ANY(array_agg(r.name))
        ;
    `;

    const values = [query + '%', role || null];
    const res = await pool.query(baseQuery, values);
    return res.rows;
}

module.exports = { searchDirectory };