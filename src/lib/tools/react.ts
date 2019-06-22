const { db } = require('./helper');

const insert = db.prepare('INSERT OR REPLACE INTO favorites (uid, url) VALUES(?, ?)');

async function handleReact(userID, url) {
   insert.run(userID, url);
}

module.exports = {
   handleReact,
};
