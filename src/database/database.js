import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
    { name: 'ExpenseTrackerDB.db', location: 'default' },
    () => console.log('Database opened successfully'),
    error => console.error('Error opening database:', error)
);

// To get the path where the database is located
db.transaction(tx => {
    tx.executeSql('PRAGMA database_list;', [], (tx, results) => {
        console.log('Database Path:', results.rows.item(0).file);
    });
});

const initializeDatabase = () => {
    db.transaction(tx => {

        tx.executeSql('PRAGMA foreign_keys = ON');

        // in case any table is not created correct first drop then create when sure about its values and structure
        // tx.executeSql(
        //     "DROP TABLE IF EXISTS envelopes;",
        //     [],
        //     () => console.log('Table dropped'),
        //     (_, error) => console.error('Error dropping income table:', error)
        // );

        // tx.executeSql(
        //     "DROP TABLE IF EXISTS Income;",
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
            orderIndex INTEGER DEFAULT 0,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )`,
            [],
            () => console.log('Envelopes Table created successfully'),
            (_, error) => {
                console.log('Error creating envelopes table:', error);
                return true;
            }
        );

        // create Income table if not exists
        // budgetAmount can change as it was already being updated wen adding or updating or deleting transaction
        // but monthlyAmount can't be changed and you are only using it in Income Vs Spending report...
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS Income (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accountName TEXT,
            monthlyAmount REAL NOT NULL,
            budgetAmount REAL NOT NULL,
            budgetPeriod TEXT,
            incomeDate TEXT, 
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );`,
            [],
            () => console.log('Income table created successfully'),
            error => console.error('Error creating Income table', error)
        );

        // create unallocated table if not exists
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS Unallocated (
        envelopeName TEXT NOT NULL DEFAULT 'Available',
        unallocatedIncome REAL DEFAULT 0,
        fillDate TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )`,
            [],
            () => console.log('Unallocated Table created successfully'),
            (_, error) => {
                console.log('Error creating Unallocated table:', error);
                return true;
            }
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
            envelopeId INTEGER,
            transactionDate TEXT,
            transactionNote TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            FOREIGN KEY (envelopeId) REFERENCES envelopes(envelopeId) ON DELETE CASCADE
            );`,
            [],
            () => {
                console.log('Transactions table created successfully');
            },
            (error) => {
                console.error('Error creating Transactions table', error);
            }
        );

        const DEFAULT_PAYEES = ["A&I", "BB&T", "CSK Auto", "Abc", "A&E Stores", "Amazon", "A.C. Moore Arts & Crafts", "ACE Hardware", "Apple", "AT&T", "Water", "Electricity", "Internet", "Gas", "Rent"];

        db.transaction(tx => {
            // Create the table if it doesn't exist
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS Payees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            isDefault INTEGER DEFAULT 0
        );`,
                [],
                () => {
                    // console.log("Payees table created successfully");

                    let payeesAdded = 0; // Counter to track added payees

                    DEFAULT_PAYEES.forEach(payee => {
                        tx.executeSql(
                            `INSERT OR IGNORE INTO Payees (name, isDefault) VALUES (?, 1);`,
                            [payee],
                            () => {
                                payeesAdded++;
                                // Once all payees are added, log a single success message
                                if (payeesAdded === DEFAULT_PAYEES.length) {
                                    // console.log("Default payees added successfully");
                                }
                            },
                            (tx, error) => console.error(`Error adding default payee "${payee}"`, error)
                        );
                    });
                },
                (tx, error) => console.error("Error creating Payees table:", error)
            );
        });

        
        // db.transaction(tx => {
        //     // Create the table if it doesn't exist
        //     tx.executeSql(
        //         `CREATE TABLE IF NOT EXISTS Payees (
        //     id INTEGER PRIMARY KEY AUTOINCREMENT,
        //     name TEXT NOT NULL UNIQUE,
        //     isDefault INTEGER DEFAULT 0
        // );`,
        //         [],
        //         () => {
        //             console.log("Payees table created successfully");
        //             // Insert default payees
        //             DEFAULT_PAYEES.forEach(payee => {
        //                 tx.executeSql(
        //                     `INSERT OR IGNORE INTO Payees (name, isDefault) VALUES (?, 1);`,
        //                     [payee],
        //                     () => console.log(`Default payee "${payee}" added`),
        //                     (tx, error) => console.error(`Error adding default payee "${payee}"`, error)
        //                 );
        //             });
        //         },
        //         (tx, error) => console.error("Error creating Payees table:", error)
        //     );
        // });

        

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

// Function to format date to 'YYYY-MM-DD'
const formatDateToYYYYMMDD = (date) => {
    // If the input date is not a Date object, convert it
    if (!(date instanceof Date)) {
        date = new Date(date); // This will convert string or other types to Date
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const addEnvelope = (envelopeName, amount, budgetPeriod, tempUserId, formattedFromDate) => {
    // const formattedDueDate = formatDateToYYYYMMDD(dueDate);
    db.transaction(tx => {
        // Step 1: Increment the orderIndex of existing envelopes
        tx.executeSql(
            'UPDATE envelopes SET orderIndex = orderIndex + 1',
            [],
            (_, result) => {
                // Step 2: Insert the new envelope with orderIndex set to 0
                tx.executeSql(
                    'INSERT INTO envelopes (envelopeName, amount, budgetPeriod, user_id, fillDate ,orderIndex ) VALUES (?, ?, ?, ?, ?, ?)',
                    [envelopeName, amount, budgetPeriod, tempUserId, formattedFromDate,0],
                    (_, result) => {
                        // Step 3: Fetch all envelopes to reflect the change
                        getAllEnvelopes(); // Update the state after addition
                    },
                    (_, error) => {
                        console.error('Error adding envelope:', error.message || error);
                        console.log('Failed SQL command:', 'INSERT INTO envelopes (envelopeName, amount, budgetPeriod, orderIndex) VALUES (?, ?, ?, ?)',
                            [envelopeName, amount, budgetPeriod, formattedFromDate,0]);
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
const editEnvelope = (envelopeId, envelopeName, amount, budgetPeriod, tempUserId, formattedFromDate) => {
    db.transaction(tx => {
        tx.executeSql(
            'UPDATE envelopes SET envelopeName = ?, amount = ?, budgetPeriod = ?, user_id = ?, fillDate = ? WHERE envelopeId = ?',
            [envelopeName, amount, budgetPeriod, tempUserId, formattedFromDate, envelopeId],
            (_, result) => {
                console.log('Envelope updated successfully');
                console.log('Rows affected:', result.rowsAffected);
            },
            (_, error) => {
                console.error('Error updating envelope:', error.message);
                return true;
            }
        );
    }, (transactionError) => {
        console.error('Transaction error:', transactionError.message);
    }, () => {
        console.log('Transaction completed successfully');
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

// Function to fetch total income from Income table...budgetAmount that can be updated..either no need to update it and not being used...
const fetchTotalIncome = (callback, tempUserId, formattedFromDate, formattedToDate) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT SUM(budgetAmount) as totalIncome FROM Income WHERE user_id = ? AND incomeDate BETWEEN ? AND ?',
            [tempUserId, formattedFromDate, formattedToDate],
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

// for calculating monthly income for setup budget because there monthlyAmount remains same we dont change it while making transactions
const fetchTotalIncomeSetupBudget = (callback, tempUserId, formattedFromDate, formattedToDate) => {
    db.transaction(tx => {
        tx.executeSql(
            'SELECT SUM(monthlyAmount) as totalIncome FROM Income WHERE user_id = ? AND incomeDate BETWEEN ? AND ?',
            [tempUserId, formattedFromDate, formattedToDate],
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
const fetchTotalEnvelopesAmount = (callback, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly) => {
    db.transaction(tx => {
        tx.executeSql(
            // 'SELECT SUM(filledIncome) AS totalAmount FROM envelopes WHERE user_id = ? AND fillDate BETWEEN ? AND ?;',
            `SELECT SUM(filledIncome) AS totalAmount 
             FROM envelopes 
             WHERE user_id = ? 
             AND (
                 (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?)
                 OR
                 (budgetPeriod = 'Every Year' AND fillDate BETWEEN ? AND ?)
             );`,
            [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly],
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

// for every month
const fetchTotalEnvelopesAmountMonthly = (callback, tempUserId, formattedFromDate, formattedToDate) => {
    db.transaction(tx => {
        tx.executeSql(
            `SELECT SUM(filledIncome) AS totalAmount 
             FROM envelopes 
             WHERE user_id = ? 
               AND fillDate BETWEEN ? AND ? 
               AND budgetPeriod = ?;`,
            [tempUserId, formattedFromDate, formattedToDate, "Monthly"],
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

// for every year
const fetchTotalEnvelopesAmountYearly = (callback, tempUserId, formattedFromDateYearly, formattedToDateYearly) => {
    db.transaction(tx => {
        tx.executeSql(
            `SELECT SUM(filledIncome) AS totalAmount 
             FROM envelopes 
             WHERE user_id = ? 
               AND fillDate BETWEEN ? AND ? 
               AND budgetPeriod = ?;`,
            [tempUserId, formattedFromDateYearly, formattedToDateYearly, "Every Year"],
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

// for goal 
const fetchTotalEnvelopesAmountGoal = (callback, tempUserId, formattedFromDate, formattedToDate) => {
    db.transaction(tx => {
        tx.executeSql(
            `SELECT SUM(filledIncome) AS totalAmount 
             FROM envelopes 
             WHERE user_id = ? 
               AND fillDate BETWEEN ? AND ? 
               AND budgetPeriod = ?;`,
            [tempUserId, formattedFromDate, formattedToDate, "Goal"],
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

export { db, initializeDatabase, fetchUsers, addEnvelope, getAllEnvelopes, editEnvelope, deleteEnvelope, addAmount, fetchTotalIncome, fetchTotalIncomeSetupBudget, deleteIncome, fetchAllIncomes, fetchTotalEnvelopesAmount, fetchTotalEnvelopesAmountMonthly, fetchTotalEnvelopesAmountYearly, fetchTotalEnvelopesAmountGoal };
