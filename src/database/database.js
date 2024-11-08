import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
    { name: 'ExpenseTrackerDB.db', location: 'default' },
    () => console.log('Database opened successfully'),
    error => console.error('Error opening database:', error)
);

const initializeDatabase = () => {
    db.transaction(tx => {

        // in case any table is not created correct first drop then create when sure about its values and structure
        // tx.executeSql(
        //     "DROP TABLE IF EXISTS envelopes;",
        //     [],
        //     () => console.log('Table dropped'),
        //     (_, error) => console.error('Error dropping income table:', error)
        // );

        // creates the Users table
        tx.executeSql(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='Users';",
            [],
            (tx, results) => {
                if (results.rows.length > 0) {
                    console.log("Users table already exists");
                } else {
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
        
        // creates envelopes table now fully working
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS envelopes (
            envelopeId INTEGER PRIMARY KEY NOT NULL,
            envelopeName TEXT NOT NULL, 
            amount REAL NOT NULL, 
            budgetPeriod TEXT, 
            filledIncome REAL, 
            fillDate TEXT, 
            orderIndex INTEGER DEFAULT 0
            )`,
            [],
            () => console.log('Envelopes Table created successfully'),
            (_, error) => {
                console.log('Error creating envelopes table:', error);
                return true;
            }
        );

        // create Income table if not exists

        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS Income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accountName TEXT,
            budgetAmount REAL NOT NULL,
            budgetPeriod TEXT
        );`,
            [],
            () => console.log('Income table created successfully'),
            error => console.error('Error creating Income table', error)
        );

        // create transactions table if not exists
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS Transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payee TEXT,
            transactionAmount REAL,
            transactionType TEXT,
            envelopeName TEXT,
            envelopeRemainingIncome REAL,
            accountName TEXT,
            transactionDate TEXT,
            transactionNote TEXT
            );`,
            [],
            () => {
                console.log('Transactions table created successfully');
            },
            (error) => {
                console.error('Error creating Transactions table', error);
            }
        );

        // create FilledIncome table if not exists
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS FilledIncome (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            envelopeId INTEGER UNIQUE,
            selectedEnvelopeName TEXT NOT NULL,
            filledIncome REAL,
            fillDate TEXT NOT NULL
            );`, 
            [],
            () => console.log('FilledIncome table created successfully.'),
            (_, error) => console.error('Error creating FilledIncome table:', error)
        ); 
        
        // create FilledIncomeIndividualTable
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS FilledIncomeIndividual (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            envelopeId INTEGER UNIQUE,
            filledIncome REAL,
            fillDate TEXT NOT NULL
            );`,
            [],
            () => console.log('FilledIncomeIndividual table created successfully.'),
            (_, error) => console.error('Error creating FilledIncome table:', error)
        );    

    });
};


// function just to see all users in users table
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

const addEnvelope = (envelopeName, amount, budgetPeriod) => {
    db.transaction(tx => {
        // Step 1: Increment the orderIndex of existing envelopes
        tx.executeSql(
            'UPDATE envelopes SET orderIndex = orderIndex + 1',
            [],
            (_, result) => {
                // Step 2: Insert the new envelope with orderIndex set to 0
                tx.executeSql(
                    'INSERT INTO envelopes (envelopeName, amount, budgetPeriod, orderIndex) VALUES (?, ?, ?, ?)',
                    [envelopeName, amount, budgetPeriod, 0],
                    (_, result) => {
                        // Step 3: Fetch all envelopes to reflect the change
                        // getAllEnvelopes(); // Update the state after addition
                    },
                    (_, error) => {
                        console.error('Error adding envelope:', error.message || error);
                        console.log('Failed SQL command:', 'INSERT INTO envelopes (envelopeName, amount, budgetPeriod, orderIndex) VALUES (?, ?, ?, ?)',
                            [envelopeName, amount, budgetPeriod, 0]);
                    }
                );
            },
            (_, error) => {
                console.error('Error incrementing orderIndex:', error.message || error);
            }
        );
    },
        (error) => {
            // Log transaction error if occurs
            console.error('Transaction Error:', error);
        },
        () => {
            console.log('Transaction completed successfully');
        });
};

// Function to add an envelope
// const addEnvelope = (envelopeName, amount, budgetPeriod) => {
//     // console.log('Adding envelope with:', { envelopeName, amount, budgetPeriod });
//     db.transaction(tx => {
//         tx.executeSql(
//             'INSERT INTO envelopes (envelopeName, amount, budgetPeriod) VALUES (?, ?, ?)',
//             [envelopeName, amount, budgetPeriod],
//             (_, result) => {
//                 // getAllEnvelopes(); // Log all envelopes after addition
//             },
//             (_, error) => {
//                 console.error('Error adding envelope:', error.message || error);
//                 // Log additional info about the SQL command that failed
//                 console.log('Failed SQL command:', 'INSERT INTO envelopes (envelopeName, amount, budgetPeriod) VALUES (?, ?, ?)',
//                     [envelopeName, amount, budgetPeriod]);
//             }
//         );
//     },
//         (error) => {
//             // console.error('Transaction Error:', error); // Log transaction error if occurs
//         },
//         () => {
//             console.log('Transaction completed successfully');
//         });
// };

// Function to get all envelopes here just to log all after inserting a new envelope
const getAllEnvelopes = () => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM envelopes',
            [],
            (_, results) => {
                const envelopes = [];
                for (let i = 0; i < results.rows.length; i++) {
                    envelopes.push(results.rows.item(i));
                }
                console.log('All envelopes in the database:', envelopes);
            },
            error => {
                console.error('Error fetching envelopes:', error);
            }
        );
    });
};

// Function to edit an envelope
const editEnvelope = (envelopeId, envelopeName, amount, budgetPeriod) => {
    db.transaction(tx => {
        tx.executeSql(
            'UPDATE envelopes SET envelopeName = ?, amount = ?, budgetPeriod = ? WHERE envelopeId = ?',
            [envelopeName, amount, budgetPeriod, envelopeId],
            (_, result) => console.log('Envelope updated:', result),
            (_, error) => {
                console.log('Error updating envelope:', error);
                return true;
            }
        );
    });
};

// Function to delete an envelope
const deleteEnvelope = (envelopeId) => {
    db.transaction(tx => {
        tx.executeSql(
            'DELETE FROM envelopes WHERE envelopeId = ?',
            [envelopeId],
            (_, result) => console.log('Envelope deleted:', result),
            (_, error) => {
                console.log('Error deleting envelope:', error);
                return true;
            }
        );
    });
};

// Function to add income
const addAmount = (amount, budgetPeriod) => {
    console.log('Adding income with:', { amount, budgetPeriod });
    db.transaction(tx => {
        tx.executeSql(
            'INSERT INTO Income (amount, budgetPeriod) VALUES (?, ?)',
            [amount, budgetPeriod],
            (_, result) => {
                console.log('Income added:', result);
            },
            (_, error) => {
                console.error('Error adding income in transaction:', error.message);
            }
        );
    }, (error) => {
        console.error('Transaction error:', error.message);
    }, () => {
        console.log('Transaction completed successfully');
    });
};

// Function to fetch total income
const fetchTotalIncome = (callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT SUM(budgetAmount) as totalIncome FROM Income',
            [],
            (_, results) => {
                const totalIncome = results.rows.item(0).totalIncome || 0;
                callback(totalIncome);
            },
            (_, error) => {
                console.error('Error fetching total income:', error);
                callback(0); // Fallback to 0 in case of error
            }
        );
    });
};

// Function to delete income by ID
const deleteIncome = (id) => {
    db.transaction(tx => {
        tx.executeSql(
            'DELETE FROM Income WHERE id = ?',
            [id],
            (_, result) => {
                console.log('Income deleted:', result);
                // Optionally fetch total income here if needed
            },
            (_, error) => {
                console.error('Error deleting income:', error);
            }
        );
    });
};

// Function to fetch all income entries
const fetchAllIncomes = (callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT * FROM Income',
            [],
            (_, results) => {
                const incomes = [];
                for (let i = 0; i < results.rows.length; i++) {
                    incomes.push(results.rows.item(i));
                }
                callback(incomes);
                console.log('incomes in transaction in db: ', incomes);
            },
            (_, error) => {
                console.error('Error fetching income:', error);
                callback([]); // Fallback to empty array in case of error
            }
        );
    });
};

//for filled envelopes screen fill all or individual

// for total sum of all envelopes amount as single sumup amount
const fetchTotalEnvelopesAmount = (callback) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT SUM(filledIncome) AS totalAmount FROM envelopes',
            [],
            (_, results) => {
                const totalAmount = results.rows.item(0).totalAmount || 0;
                callback(totalAmount);
            },
            (_, error) => {
                console.error('Error fetching total envelopes amount:', error);
                callback(0); // Fallback to 0 in case of error
            }
        );
    });
};

export { db, initializeDatabase, fetchUsers, addEnvelope, getAllEnvelopes, editEnvelope, deleteEnvelope, addAmount, fetchTotalIncome, deleteIncome, fetchAllIncomes, fetchTotalEnvelopesAmount };
