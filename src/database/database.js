import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
    { name: 'ExpenseTrackerDB.db', location: 'default' },
    () => console.log('Database opened successfully'),
    error => console.error('Error opening database:', error)
);

const initializeDatabase = () => {
    db.transaction(tx => {
        // Drop the table if it already exists to ensure we're working with the correct schema use it if unexpectidly for first time you create wrong schema
        // tx.executeSql('DROP TABLE IF EXISTS Users', [],
        //     () => console.log("Users table dropped successfully"),
        //     error => console.error("Error dropping Users table:", error)
        // );

        // creates the Users table
        tx.executeSql(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='Users';",
            [],
            (tx, results) => {
                if (results.rows.length > 0) {
                    // The table already exists
                    console.log("Users table already exists");
                } else {
                    // The table does not exist, create it
                    tx.executeSql(
                    `CREATE TABLE Users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    password TEXT NOT NULL,
                    featureUpdates INTEGER DEFAULT 0
                );`,
                        [],
                        () => console.log("Users table created successfully"),
                        error => console.error("Error creating Users table:", error)
                    );
                }
            },
            error => console.error("Error checking Users table:", error)
        );

    });
};

// just to see all users in database or users table
const fetchUsers = () => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM Users',
            [],
            (tx, results) => {
                const users = [];
                for (let i = 0; i < results.rows.length; i++) {
                    users.push(results.rows.item(i));
                }
                console.log('Users in the database:', users);
            },
            error => console.error('Error fetching users:', error)
        );
    });
};

export { db, initializeDatabase, fetchUsers };
