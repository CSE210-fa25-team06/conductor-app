import fetch from 'node-fetch'

const API_BASE_URL = 'http://localhost:3000';

/*
This file contains unit tests for the class directory feature.
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

const runAllTests = async () => {
    const isArray = await testArray();
    console.log(`RETURNS ARRAY TEST: ${isArray ? 'passed' : 'failed'}`);

    const containsUsersField = await testContainsUsersField();
    console.log(`CONTAINS USERS TEST: ${containsUsersField ? 'passed' : 'failed'}`);

    const containsAllFields = await testUserCategories();
    console.log(`CONTAINS ALL CATEGORIES TEST: ${containsAllFields ? 'passed' : 'failed'}`);
}
runAllTests();