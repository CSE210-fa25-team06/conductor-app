import { pool } from "../models/db.js";

/*
    Returns names and emails of members where the name-start matches the passed in query
*/

// run test by doing node server/service/search.js from root directory

export async function searchDirectory(query) {
    let baseQuery = `
        SELECT u.id, u.photo_url, u.name, u.email, array_agg(r.name), g.name as group_name, contact_info, availability
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

async function testDirectory(){
    const result = await searchDirectory('Alice', null);
    console.log(result);

    /*
        SHOULD PRINT:
        [
            {
                id: 101,
                photo_url: 'url/alice.png',
                name: 'Alice',
                email: 'alice@example.com',
                array_agg: [ 'Student' ],
                group_name: 'Group Alpha',
                contact_info: '555-1111',
                availability: { Tue: '10-12' }
            }
        ]

    */
}

testDirectory();