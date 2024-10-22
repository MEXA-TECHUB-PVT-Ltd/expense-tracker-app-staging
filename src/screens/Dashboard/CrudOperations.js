// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

// Open or create a database
const db = SQLite.openDatabase(
    {
        name: 'ExpenseDB',
        location: 'default',
    },
    () => { },
    error => {
        console.log(error);
    }
);

const CrudOperations = () => {
    const [expense, setExpense] = useState('');
    const [amount, setAmount] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [editingId, setEditingId] = useState(null); // State to track which expense is being edited

    useEffect(() => {
        // Create a table if it doesn't exist
        db.transaction(tx => {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, expense TEXT, amount REAL)',
            );
            loadExpenses();
        });
    }, []);

    const loadExpenses = () => {
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM expenses', [], (tx, results) => {
                const tempExpenses = [];
                for (let i = 0; i < results.rows.length; i++) {
                    tempExpenses.push(results.rows.item(i));
                }
                setExpenses(tempExpenses);
            });
        });
    };

    const addExpense = () => {
        if (expense && amount) {
            db.transaction(tx => {
                if (editingId) {
                    // If we're editing an existing expense
                    tx.executeSql('UPDATE expenses SET expense=?, amount=? WHERE id=?',
                        [expense, parseFloat(amount), editingId], () => {
                            loadExpenses();
                            resetFields();
                        });
                } else {
                    // Otherwise, insert a new expense
                    tx.executeSql('INSERT INTO expenses (expense, amount) VALUES (?, ?)',
                        [expense, parseFloat(amount)], () => {
                            loadExpenses();
                            resetFields();
                        });
                }
            });
        }
    };

    const editExpense = (id, currentExpense, currentAmount) => {
        setEditingId(id);
        setExpense(currentExpense);
        setAmount(currentAmount);
    };

    const deleteExpense = id => {
        db.transaction(tx => {
            tx.executeSql('DELETE FROM expenses WHERE id=?', [id], () => {
                loadExpenses();
            });
        });
    };

    const resetFields = () => {
        setExpense('');
        setAmount('');
        setEditingId(null); // Reset editing ID
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Expense Tracker</Text>
            <TextInput
                style={styles.input}
                placeholder="Expense Name"
                value={expense}
                onChangeText={setExpense}
            />
            <TextInput
                style={styles.input}
                placeholder="Amount"
                value={amount}
                keyboardType="numeric"
                onChangeText={setAmount}
            />
            <Button title={editingId ? "Update Expense" : "Add Expense"} onPress={addExpense} />
            <FlatList
                data={expenses}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.expenseItem}>
                        <Text style={styles.item_text}>{item.expense}: ${item.amount.toFixed(2)}</Text>
                        <Button title="Edit" onPress={() => editExpense(item.id, item.expense, item.amount)} />
                        <Button title="Delete" onPress={() => deleteExpense(item.id)} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'black'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        backgroundColor: 'gray'
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    item_text: {
        fontSize: 18,
        color: 'black',
    },
});

export default CrudOperations;
