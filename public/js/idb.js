// variable to hold db connection
let db;
// establish connection to IndexedDB
const request = indexedDB.open('budget_tracker_pwa', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create table and set it to have an auto incrementing primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from above) 
    // or establish connection, save reference to db in global variable.
    db = event.target.result;
    // check if app is online
    if (navigator.onLine) {
        uploadTransactions();
    }
};

request.onerror = function(event) {
    // log error
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open new transaction with the db with read and write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access the object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // add record to your store with add method
    transactionObjectStore.add(record);
};

// function to upload object store when online connectivity returns
function uploadTransactions () {
    // open a transaction on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access the new_transaction object store
    const transactionObjectStore = transaction.objectStore('new_transaction');
    // get all record from store and set to a variable
    const getAll = transactionObjectStore.getAll();
    // upon successfull getAll
    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all from object store
                transactionObjectStore.clear();
                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

window.addEventListener('online', uploadTransactions);
