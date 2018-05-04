const idb = require('./idb');

/**
 * Create the database for storing visited restaurants
 */

const dbPromise = idb.open('restaurants-store', 1, (upgradeDb) => {
    switch(upgradeDb.oldVersion){
        case 0:
        upgradeDb.createObjectStore('restaurants', {keyPath: "id"}); 
    }
});

const checkDatabase = (objStore) => {
    return dbPromise.then((db) => {
        let val = db.objectStoreNames.contains(objStore);
        return val;
    })
}

const storeIdbData = (objStore, data) => {
    return dbPromise.then((db) => {
        const tx = db.transaction(objStore, 'readwrite');
        const store = tx.objectStore(objStore);
        store.put(data);
        return tx.complete;
    });
};

const readIdbData = (objStore) => {
    return dbPromise.then((db) => {
        const tx = db.transaction(objStore, 'readonly');
        const store = tx.objectStore(objStore);
        return store.getAll();
    });
};

const getDbItem = (objStore, itemId) => {
    return dbPromise.then((db) => {
        const tx = db.transaction(objStore, 'readonly');
        const store = tx.objectStore(objStore);
        return store.get(parseInt(itemId));
    })
}

module.exports.checkDatabase = checkDatabase;
module.exports.storeIdbData = storeIdbData;
module.exports.readIdbData = readIdbData;
module.exports.getDbItem = getDbItem;
