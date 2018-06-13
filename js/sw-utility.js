const dbPromise = idb.open('restaurants-store', 4, (upgradeDb) => {
    switch(upgradeDb.oldVersion){
        case 0:
        upgradeDb.createObjectStore('restaurants', {keyPath: "id"});
        case 1:
        upgradeDb.createObjectStore('reviews', {keyPath: "id"});
        case 2:
        upgradeDb.createObjectStore('sync-reviews', {keyPath: "id"});
        case 3:
        upgradeDb.createObjectStore('sync-favorite', {keyPath: "id"});
    }
});

const createStoreTransaction = (objStore, type) => {
    return dbPromise.then((db) => {
        const tx = db.transaction(objStore, type);
        const store = tx.objectStore(objStore);
        return {store: store, transaction: tx};
    });
}

const readIdbData = (objStore) => {
    console.log("reading data");
    return createStoreTransaction(objStore, 'readonly')
        .then(data => data.store.getAll());     
};

const deleteDbItem = (objStore, itemId) => {
    return createStoreTransaction(objStore, "readwrite")
    .then(data => {
        data.store.delete(parseInt(itemId));
        return data.transaction.complete;
    })
};

