const { pool } = require("../models/db");

/*
      Returns names and emails of members where the name parts match the passed in query tokens.
    - Tokenizes search query by space to allow matching "First Name" + "Last Name" independently.
    - searches matches in both NAME and EMAIL fields.
    - Optionally filters by role name when a role is provided.
    - Optionally filters by group name when a group is provided.
*/

async function searchDirectory(query, role, group) {
    // 1. Break the user's search input into individual tokens (e.g. "John Smith" -> ["John", "Smith"])
    const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
    
    let whereConditions = [];
    let values = [];

    // 2. Build dynamic SQL: Each token must match EITHER the name OR the email
    if (tokens.length > 0) {
        tokens.forEach((token, index) => {
            // Postgres params start at $1
            const paramIndex = index + 1;
            whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
            values.push('%' + token + '%');
        });
    } else {
        // If no search query, match everything
        whereConditions.push(`(u.name ILIKE $1 OR u.email ILIKE $1)`);
        values.push('%%');
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Role param is the next index after all search tokens
    const roleParamIndex = values.length + 1;
    values.push(role || null);

    // Group param is the next index after role
    const groupParamIndex = values.length + 1;
    values.push(group || null);

    const baseQuery = `
        SELECT u.id, u.photo_url, u.name, u.email, u.group_id, array_agg(r.name) AS roles, g.name AS group_name, contact_info, 
            (
                SELECT COUNT(*)
                FROM attendance a
                WHERE a.user_id = u.id
                  AND a.meeting_type = 'Lecture'
                  AND a.status IN ('Present', 'Late')
            ) AS attended_count,

            (
                SELECT COUNT(DISTINCT a2.date)
                FROM attendance a2
                WHERE a2.meeting_type = 'Lecture'
            ) AS total_lectures

        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r on ur.role_id = r.id
        LEFT JOIN groups g on g.id = u.group_id
        
        WHERE ${whereClause}
        
        GROUP BY u.id, u.photo_url, u.name, u.email, g.name, contact_info, availability
        HAVING ($${roleParamIndex}::text IS NULL OR $${roleParamIndex} = ANY(array_agg(r.name)))
           AND ($${groupParamIndex}::text IS NULL OR g.name = $${groupParamIndex})
        ;
    `;

    const res = await pool.query(baseQuery, values);

    return res.rows.map(row => ({
        ...row,
        role_name: row.roles && row.roles.length > 0 ? row.roles[0] : "Guest",
        attendance: `${row.attended_count}/${row.total_lectures}`
    }));
}

module.exports = { searchDirectory };