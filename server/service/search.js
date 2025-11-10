import { pool } from "../models/db.js";

/*
    Returns names and emails of members where the name-start matches the passed in query
*/

// run test by doing node server/service/search.js

export async function searchDirectory(query, userTypeFilters = null) {
    let baseQuery = `
        SELECT name, email
        FROM users
        WHERE
        name ilike $1;
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
        [ { name: 'Alice', email: 'alice@example.com' } ]

    */
}

testDirectory();