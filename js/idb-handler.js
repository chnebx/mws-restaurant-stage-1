const idb = require('./idb');
let results = [];
/**
 * Create the database for storing visited restaurants
 */

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

const checkAndUpdateDatabase = (objStore, item) => {
    return createStoreTransaction(objStore, 'readonly')
        .then(data => data.store.get(item.id))
        .then(value => {
            if (value) {
                if (JSON.stringify(item) === JSON.stringify(value)){
                    return;
                }
            }
            storeIdbData(objStore, item);     
        }).catch(err => {
            storeIdbData(objStore, item);
        });
}

const updatePropertyInDatabase = (objStore, id, property, value) => {
    return createStoreTransaction(objStore, 'readwrite')
        .then(data => data.store.openCursor())
        .then(function getRestaurantReviews(cursor) {
        if (!cursor) {
            return;
        }

        if (cursor.value.id === id ) {
            let updatedValue = cursor.value;
            updatedValue[property] = value;
            return cursor.update(updatedValue);
        } else {
            return cursor.continue().then(getRestaurantReviews);
        }
    }).then(() => {
        return results;
    });
}

const storeIdbData = (objStore, data) => {
    return createStoreTransaction(objStore, 'readwrite')
        .then(dataObj => {
            dataObj.store.put(data)
            return dataObj.transaction.complete;
        });
};

const readIdbData = (objStore) => {
    return createStoreTransaction(objStore, 'readonly')
        .then(data => data.store.getAll());     
};

const getDbItem = (objStore, itemId) => {
    return createStoreTransaction(objStore, 'readonly')
        .then(data => data.store.get(parseInt(itemId)));
};

const deleteDbItem = (objStore, itemId) => {
    return createStoreTransaction(objStore, "readwrite")
        .then(data => {
            data.store.delete(parseInt(itemId));
            return data.transaction.complete;
        })
};

const filterDbItemsByProperty = (objStore, property, value) => {
    return createStoreTransaction(objStore, 'readonly')
        .then(data => data.store.openCursor())
        .then(function getRestaurantReviews(cursor) {
            if (!cursor) {
                return;
            }
            if (cursor.value[property] === value) {
                results.push(cursor.value);
            }
            return cursor.continue().then(getRestaurantReviews);
    }).then(() => {
        return results;
    });
};

module.exports.checkAndUpdateDatabase = checkAndUpdateDatabase;
module.exports.storeIdbData = storeIdbData;
module.exports.readIdbData = readIdbData;
module.exports.getDbItem = getDbItem;
module.exports.deleteDbItem = deleteDbItem;
module.exports.filterDbItemsByProperty = filterDbItemsByProperty;
module.exports.updatePropertyInDatabase = updatePropertyInDatabase;
