import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3000';

/*
This file contains unit tests for the class directory feature.

TO RUN:
1) NAVIGATE TO PROJECT ROOT
2) RUN node tests/backend/test-class-directory and view output in console
*/


//test - search query returns an array

const testArray = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users?query=alice`);
        const data = await response.json();

        if (!Array.isArray(data.users)){
            console.error('returned data is not an array');
            return false;
        }

        return true;
    } catch {
        console.error('test failed to run');
        return false;
    }
}

//test - search query returns an users field

const testContainsUsersField = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users?query=alice`);
        const data = await response.json();

        if (!('users' in data)){
            console.error('returned data does not have users field');
            return false;
        }

        return true;
    } catch {
        console.error('test failed to run');
        return false;
    }
}

//test - returned user contains id, photo url, name, email, roles, group name, contact info, and availability

const testUserCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users?query=alice`);
        const data = await response.json();
        const users = data.users;
        const alice = users[0];

        if (!(
            'id' in alice && 
            'photo_url' in alice && 
            'name' in alice && 
            'email' in alice && 
            'roles' in alice && 
            'group_name' in alice && 
            'contact_info' in alice && 
            'availability' in alice
        )){
            console.error('returned data does not have all fields');
            return false;
        }
        
        return true;
    } catch {
        console.error('test failed to run');
        return false;
    }
}

//test - returned users properly match with the query from the start of the name
const testUsersMatchQuery = async () => {
    try {
        const query = 'al';
        const response = await fetch(`${API_BASE_URL}/users?query=${query}`);
        const data = await response.json();

        for (const user of data.users) {
            if (!user.name.toLowerCase().startsWith(query)) {
                console.error(`found a user with name ${user.name} who didn't match query '${query}'`);
                return false;
            }
        }

        return true;
    } catch {
        console.error('test failed to run');
        return false;
    }
}

//test - not including query parameter throws a 400 error
const testFailsWhenNoQueryParam = async () => {
    try {
        const query = 'al';
        const response = await fetch(`${API_BASE_URL}/users`);

        if (response.ok) {
            console.error('expected a failing response but got a ok response');
            return false
        }

        if (response.status != 400) {
            console.error(`got a ${response.status} status code but expected a 400 status code`);
            return false
        }

        return true;
    } catch {
        console.error('test failed to run');
        return false;
    }
}


const runAllTests = async () => {
    const isArray = await testArray();
    console.log(`RETURNS ARRAY TEST: ${isArray ? 'passed' : 'failed'}`);

    const containsUsersField = await testContainsUsersField();
    console.log(`CONTAINS USERS TEST: ${containsUsersField ? 'passed' : 'failed'}`);

    const containsAllFields = await testUserCategories();
    console.log(`CONTAINS ALL CATEGORIES TEST: ${containsAllFields ? 'passed' : 'failed'}`);

    const usersMatchQuery = await testUsersMatchQuery();
    console.log(`USERS MATCH QUERY TEST: ${usersMatchQuery ? 'passed' : 'failed'}`);

    const failsWhenNoQueryParam = await testFailsWhenNoQueryParam();
    console.log(`FAILS WHEN NO QUERY TEST: ${failsWhenNoQueryParam ? 'passed' : 'failed'}`)

}
runAllTests();