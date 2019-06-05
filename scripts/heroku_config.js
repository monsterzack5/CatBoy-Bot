'use strict';

const shell = require('child_process');
let output;

try {
    const keys = require('dotenv').config();
    if (keys.error) {
        throw keys.error;
    }
    for (let key in keys.parsed) {
        console.log(`Setting key:${key} with var: ${keys.parsed[key]}`);
        output = shell.exec(`heroku config:set ${key}=${keys.parsed[key]}`);
    }
} catch (e) {
    console.error('Error! Did you forget to run "yarn" or "npm install"?\n');
    console.log(`${e}`);
    process.exit(0);
}

output.stdout.on('data', (data) => {
    console.log(`info: ${data.toString()}`);
});
output.stderr.on('data', (data) => {
    console.log(`ERROR!: ${data.toString()}`);
});