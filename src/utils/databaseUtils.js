// databaseUtils.js
import SQLite from 'react-native-sqlite-storage';

import { db } from '../database/database';

export const dropTables = () => {
    db.transaction(tx => {
        tx.executeSql('DROP TABLE IF EXISTS Users;', [],
            () => console.log('Users table dropped successfully'),
            error => console.error('Error dropping Users table:', error)
        );
        tx.executeSql('DROP TABLE IF EXISTS envelopes;', [],
            () => console.log('Envelopes table dropped successfully'),
            error => console.error('Error dropping envelopes table:', error)
        );
        tx.executeSql('DROP TABLE IF EXISTS Income;', [],
            () => console.log('Income table dropped successfully'),
            error => console.error('Error dropping Income table:', error)
        );
        tx.executeSql('DROP TABLE IF EXISTS Transactions;', [],
            () => console.log('Transactions table dropped successfully'),
            error => console.error('Error dropping Transactions table:', error)
        );
    });
};
