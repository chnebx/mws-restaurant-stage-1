/**
 * Create the database for storing visited restaurants
 */

let dbPromise = idb.open('restaurants-store', 1, (upgradeDb) => {
    switch(upgradeDb.oldVersion){
        case 0:
        upgradeDb.createObjectStore('restaurants', {keyPath: "id"}); 
    }
});

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