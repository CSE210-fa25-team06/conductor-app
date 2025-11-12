import { pool } from "../models/db.js";

/*
    Returns names and emails of members where the name-start matches the passed in query
*/

export async function searchDirectory(query) {
    let baseQuery = `
        SELECT u.id, u.photo_url, u.name, u.email, array_agg(r.name) as roles, g.name as group_name, contact_info, availability
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r on ur.role_id = r.id
        LEFT JOIN groups g on g.id = u.group_id
        WHERE u.name ilike $1
        GROUP BY u.id, u.photo_url, u.name, u.email, g.name, contact_info, availability
        ;
    `;
    const values = [query + '%']
    const res = await pool.query(baseQuery, values);
    return res.rows;
}