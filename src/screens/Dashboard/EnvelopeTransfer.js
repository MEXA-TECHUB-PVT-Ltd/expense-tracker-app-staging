import { StyleSheet, Text, View, Animated, Pressable, TouchableOpacity, ScrollView, Image, Keyboard, FlatList, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { debounce } from 'lodash';
import { useFocusEffect } from '@react-navigation/native';
import Calculator from '../Onboarding/Calculator';
import DateTimePicker from '@react-native-community/datetimepicker';
import Images from '../../constants/images';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar, TextInput, Menu, Snackbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { db } from '../../database/database';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { useRoute } from '@react-navigation/native';

const { width: screenWidth } = dimensions;

const EnvelopeTransfer = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    // code of tooltip
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const handleRightIconPress = () => {
        toggleTooltip();
    };
    const toggleTooltip = () => {
        if (isTooltipVisible) {
            Animated.timing(slideAnim, {
                toValue: screenWidth,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
            Animated.timing(slideAnim, {
                toValue: screenWidth * 0.5,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };
    const handleOutsidePress = () => {
        if (isTooltipVisible) {
            toggleTooltip();
        }
    };
    const handleTooltipPress = () => {
        toggleTooltip();
        navigation.navigate('Help', { from_envelopetransfer: true });
    };

    // code for functionality
    const [focusedInput, setFocusedInput] = useState(null);
    const [focusedInputAmount, setFocusedInputAmount] = useState(false);
    const [payee, setPayee] = useState('Envelope Transfer');
    // console.log('value of description is: ', payee);

    const [transactionAmount, setTransactionAmount] = useState(0);
    // console.log('value of amount to transfer is: ', transactionAmount);
    const [calculatorVisible, setCalculatorVisible] = useState(false);
    const handleValueChange = (amount) => {
        setTransactionAmount(amount);
        setCalculatorVisible(false);
    };

    const [envelopeRemainingIncome, setEnvelopeRemainingIncome] = useState(0);
    const [envelopeMenuVisibleTo, setEnvelopeMenuVisibleTo] = useState(false);
    const [envelopeMenuVisibleFrom, setEnvelopeMenuVisibleFrom] = useState(false);
    const [selectedEnvelopeTo, setSelectedEnvelopeTo] = useState(false);
    const [selectedEnvelopeToId, setSelectedEnvelopeToId] = useState(false);
    // console.log('selected envelope to Id is: ', selectedEnvelopeToId);
    const [selectedEnvelopeFrom, setSelectedEnvelopeFrom] = useState(false);
    const [selectedEnvelopeFromId, setSelectedEnvelopeFromId] = useState(null);
    // console.log('selected envelope from Id is: ', selectedEnvelopeFromId);
    const handleEnvelopeMenuToggleTo = useMemo(
        () => debounce(() => setEnvelopeMenuVisibleTo(prev => !prev), 10),
        []
    );
    const handleEnvelopeMenuToggleFrom = useMemo(
        () => debounce(() => setEnvelopeMenuVisibleFrom(prev => !prev), 10),
        []
    );

    // for getting user id from redux
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(user_id);
    // console.log('value of tempUserId in state inside AddEditDeleteTransaction', tempUserId);
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                setTempUserId(user_id);
            } else {
                setTempUserId(temp_user_id);
            }
        }, [isAuthenticated, user_id, temp_user_id])
    );

    // code for getting all envelopes from envelopes table
    const [envelopes, setEnvelopes] = useState([]);
    useFocusEffect(
        useCallback(() => {
            getAllEnvelopes(setEnvelopes, tempUserId);
        }, [tempUserId])
    );
    const getAllEnvelopes = (callback) => {
        db.transaction(tx => {
            const sqlQuery = 'SELECT * FROM envelopes WHERE user_id = ? ORDER BY orderIndex';
            tx.executeSql(
                sqlQuery,
                [tempUserId],
                (_, results) => {
                    if (results.rows && results.rows.length > 0) {
                        let envelopesArray = [];
                        for (let i = 0; i < results.rows.length; i++) {
                            envelopesArray.push(results.rows.item(i));
                        }
                        callback(envelopesArray);
                    } else {
                        callback([]);
                    }
                },
                (_, error) => {
                    console.log('Error getting envelopes:', error);
                    return true;
                }
            );
        }, (error) => {
            console.log('Transaction Error:', error);
        }, () => {
            // console.log('Transaction Success');
        });
    };

    // code for date 
    const [transactionDate, setTransactionDate] = useState(new Date());
    // console.log('todays date is: ', transactionDate);
    const [show, setShow] = useState(false);
    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || transactionDate;
        setShow(false);
        setTransactionDate(currentDate);
    };
    // this was working fine before
    const formatDate = (transactionDate) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return transactionDate.toLocaleDateString('en-US', options);
    };

    // code for note
    const [note, setNote] = useState(null);
    // console.log('value of note is: ', note);

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarVisibleDuplicated, setSnackbarVisibleDuplicated] = useState(false);


    // transactions code
    const handleIconPressWrapper = () => {
        const groupId = uuidv4();

        handleIconPress(
            transactionAmount,
            selectedEnvelopeFromId,
            selectedEnvelopeFrom,
            selectedEnvelopeToId,
            selectedEnvelopeTo,
            payee,
            note,
            tempUserId,
            transactionDate,
            groupId
        );
    };
    const handleIconPress = (transactionAmount, selectedEnvelopeFromId, selectedEnvelopeFrom, selectedEnvelopeToId, selectedEnvelopeTo, payee, note, tempUserId, transactionDate, groupId) => {
        
        if (!transactionAmount || !selectedEnvelopeFromId || !selectedEnvelopeToId || !payee || !tempUserId || !transactionDate) {
            setSnackbarVisible(true);
            console.log("Missing required fields");
            return;
        }

        // Envelope details to store in the database
        const envelopeDetails = JSON.stringify([
            {
                envelopeId: selectedEnvelopeFromId,
                envelopeName: selectedEnvelopeFrom,
                amount: transactionAmount,
                transactionType: 'Expense' // From envelope is an expense
            },
            {
                envelopeId: selectedEnvelopeToId,
                envelopeName: selectedEnvelopeTo,
                amount: transactionAmount,
                transactionType: 'Credit' // To envelope is a credit
            }
        ]);
        
        console.log('values inside envelope transfer transaction ===========: ', transactionAmount, selectedEnvelopeFromId, selectedEnvelopeFrom, selectedEnvelopeToId, selectedEnvelopeFrom, payee, note, tempUserId, transactionDate, groupId);
        db.transaction(
            tx => {
                // Deduct amount from selectedEnvelopeFrom
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?`,
                    [transactionAmount, selectedEnvelopeFromId],
                    () => console.log('Amount deducted from', selectedEnvelopeFrom),
                    (_, error) => {
                        console.error('Error deducting amount:', error);
                        return true; // Rollback transaction
                    }
                );

                // Add amount to selectedEnvelopeTo
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?`,
                    [transactionAmount, selectedEnvelopeToId],
                    () => console.log('Amount added to', selectedEnvelopeTo),
                    (_, error) => {
                        console.error('Error adding amount:', error);
                        return true; // Rollback transaction
                    }
                );

                // Add expense transaction for selectedEnvelopeFrom (Now passing the right order)
                tx.executeSql(
                    `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, envelopeId, transactionDate, transactionNote, user_id, navigationScreen, groupId, envelopeDetails) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [payee, transactionAmount, 'Expense', selectedEnvelopeFrom, selectedEnvelopeFromId, transactionDate, note, tempUserId, 'envelopeTransfer', groupId, envelopeDetails],
                    () => console.log('Expense transaction added'),
                    (_, error) => {
                        console.error('Error inserting expense transaction:', error);
                        return true; // Rollback transaction if error occurs
                    }
                );

                // Add credit transaction for selectedEnvelopeTo (Now passing the right order)
                tx.executeSql(
                    `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, envelopeId, transactionDate, transactionNote, user_id, navigationScreen, groupId, envelopeDetails) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [payee, transactionAmount, 'Credit', selectedEnvelopeTo, selectedEnvelopeToId, transactionDate, note, tempUserId, 'envelopeTransfer', groupId, envelopeDetails],
                    () => console.log('Credit transaction added'),
                    (_, error) => {
                        console.error('Error inserting credit transaction:', error);
                        return true; // Rollback transaction if error occurs
                    }
                );


            },
            error => {
                console.error('Transaction failed, rolling back:', error);
            },
            () => {
                console.log('Transaction completed successfully');
                navigation.navigate('Transactions');
            }
        );
    };

    // for deleting and updating transactions
    const { transaction, editOrdelete } = route.params || {}; // Use a fallback to an empty object if route.params is undefined
    // console.log('transactions values are: ====', transaction);
    // console.log('editOrdelete values are: ====', editOrdelete);

    useEffect(() => {
        // Only run if transaction exists
        if (transaction) {
            // console.log('transaction ', transaction);
            // Parse the envelopeDetails string into an array of objects
            const envelopeDetails = JSON.parse(transaction.envelopeDetails);
            // console.log('EnvelopeDetails: ', envelopeDetails);

            // Return early if envelopeDetails is empty
            if (!envelopeDetails) {
                console.log("No envelope details available to process in useEffect.");
                return;
            }

            // Find the envelope with transactionType "Expense" and set it as selectedEnvelopeFrom
            const envelopeFrom = envelopeDetails.find(item => item.transactionType === 'Expense');
            const envelopeTo = envelopeDetails.find(item => item.transactionType === 'Credit');

            if (envelopeFrom) {
                setSelectedEnvelopeFrom(envelopeFrom.envelopeName); // set selectedEnvelopeFrom for Expense envelope
                setSelectedEnvelopeFromId(parseInt(envelopeFrom.envelopeId, 10));
            }

            if (envelopeTo) {
                setSelectedEnvelopeTo(envelopeTo.envelopeName); // set selectedEnvelopeTo for Credit envelope
                setSelectedEnvelopeToId(parseInt(envelopeTo.envelopeId, 10));
            }

            // Set other fields
            setPayee(transaction.payee);                         // set payee
            setTransactionAmount(transaction.transactionAmount); // set transactionAmount
        }
    }, [transaction]); // Run whenever transaction changes

    // code for deleting transactions and reverting back amount to relevent envelopes code start 
    const handleDeleteWrapper = () => {
        // Step 1: Retrieve the envelopeDetails for the given groupId (we assume the transaction data has been retrieved)
        if (!transaction.envelopeDetails) {
            console.warn("No envelope details available to process in delete transaction.");
            return;
        }
        const envelopeDetails = JSON.parse(transaction.envelopeDetails);
        const groupId = transaction.groupId;

        // Step 2: Ensure envelopeDetails contains two entries
        if (envelopeDetails.length > 0) {
            const expenseEnvelope = envelopeDetails.find(e => e.transactionType === 'Expense');
            const creditEnvelope = envelopeDetails.find(e => e.transactionType === 'Credit');

            // Step 3: Adjust balances for both envelopes
            if (expenseEnvelope) {
                updateEnvelopeBalance(expenseEnvelope.envelopeId, expenseEnvelope.amount, 'increase'); // Restore amount for Expense
            }
            if (creditEnvelope) {
                updateEnvelopeBalance(creditEnvelope.envelopeId, creditEnvelope.amount, 'decrease'); // Reduce amount for Credit
            }
        }

        // Step 4: Delete the transactions using the groupId
        deleteTransactions(groupId);
    };

    // Helper function to update the envelope balance
    const updateEnvelopeBalance = (envelopeId, amount, action) => {
        const adjustedAmount = action === 'increase' ? amount : -amount;
        db.transaction(
            tx => {
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?`,
                    [adjustedAmount, envelopeId],
                    () => {
                        console.log(`Envelope balance updated: ${action} amount ${adjustedAmount} for envelopeId ${envelopeId}`);
                    },
                    (_, error) => {
                        console.error('Error updating envelope balance:', error);
                        return true; // Rollback on error
                    }
                );
            },
            error => {
                console.error('Error in updating envelope balance:', error);
            },
            () => {
                console.log('Envelope balance update completed');
            }
        );
    };

    // Function to delete transactions based on groupId
    const deleteTransactions = (groupId) => {
        db.transaction(
            tx => {
                // Delete transactions from the Transactions table based on groupId
                tx.executeSql(
                    `DELETE FROM Transactions WHERE groupId = ?`,
                    [groupId],
                    () => {
                        console.log(`Transactions with groupId ${groupId} deleted successfully`);
                    },
                    (_, error) => {
                        console.error('Error deleting transactions:', error);
                        return true; // Rollback on error
                    }
                );
            },
            error => {
                console.error('Error in transaction deletion:', error);
            },
            () => {
                console.log('Transaction delete completed');
                navigation.navigate('Transactions'); // Navigate back or handle navigation as needed
            }
        );
    };

    // code for deleting transactions and reverting back amount to relevent envelopes code end

    // code for updating transactions code start
    const handleUpdateTransaction = (selectedEnvelopeFrom, selectedEnvelopeFromId, selectedEnvelopeTo, selectedEnvelopeToId, transactionAmount, payee, transactionDate) => {
        if (!selectedEnvelopeFrom || !selectedEnvelopeTo  || !transactionAmount || !payee || !transactionDate) {
            setSnackbarVisible(true);
            return;
        }
        if (selectedEnvelopeFrom === selectedEnvelopeTo) {
            setSnackbarVisibleDuplicated(true);
            return;
        }
        // console.log('transaction object inside update function', transaction);
        if (!transaction.envelopeDetails) {
            console.warn("No envelope details available to process in update transaction.");
            return;
        }
        const envelopeDetails = JSON.parse(transaction.envelopeDetails);
        // console.log('EnvelopeDetails are: =======', envelopeDetails);

        db.transaction((tx) => {
            // Reverting the old values in envelopes table
            envelopeDetails.forEach((envelope) => {
                let { amount, envelopeId, envelopeName, transactionType } = envelope;
                envelopeId = parseInt(envelopeId, 10);
                amount = parseFloat(amount);
                envelopeName = String(envelopeName);
                transactionType = String(transactionType);

                if (transactionType === "Expense") {
                    // Increase filledIncome back for the old "Expense" envelope
                    tx.executeSql(
                        `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?`,
                        [amount, envelopeId],
                        () => console.log(`Amount increased by ${amount} for envelopeId ${envelopeId}`),
                        (_, error) => {
                            console.error('Error adding amount:', error);
                            return true;
                        }
                    );
                } else if (transactionType === "Credit") {
                    // Decrease filledIncome back for the old "Credit" envelope
                    tx.executeSql(
                        `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?`,
                        [amount, envelopeId],
                        () => console.log(`Amount decreased by ${amount} for envelopeId ${envelopeId}`),
                        (_, error) => {
                            console.error('Error adding amount:', error);
                            return true;
                        }
                    );
                }
            });


            // Now applying the new values for the "from" and "to" envelopes
            // For "Expense" envelope (decrease filledIncome)
            // Check if selectedEnvelopeFrom is defined (for Expense transaction)
            if (selectedEnvelopeFrom) {
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeName = ?`,
                    [transactionAmount, selectedEnvelopeFrom],
                    () => console.log(`Amount decreased by ${transactionAmount} from envelope ${selectedEnvelopeFrom}`),
                    (_, error) => {
                        console.error('Error adding amount:', error);
                        return true;
                    }
                );
            }

            // Check if selectedEnvelopeTo is defined (for Credit transaction)
            if (selectedEnvelopeTo) {
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?`,
                    [transactionAmount, selectedEnvelopeTo],
                    () => console.log(`Amount increased by ${transactionAmount} from envelope ${selectedEnvelopeTo}`),
                    (_, error) => {
                        console.error('Error adding amount:', error);
                        return true;
                    }
                );
            }

            // After updating envelopes, now we need to update the Transactions table
            // Select transactions with the same groupId
            const groupId = transaction.groupId; // Extract groupId from the transaction
            console.log('groupId: ', groupId);
            tx.executeSql(
                `SELECT * FROM Transactions WHERE groupId = ?`,
                [groupId],
                (_, result) => {
                    // Check if the result contains rows
                    if (!result.rows || result.rows.length === 0) {
                        console.error("No transactions found for groupId:", groupId);
                        return;  // Exit if no transactions found
                    }

                    // Iterate over rows directly using result.rows.length and result.rows.item()
                    let transactions = [];
                    for (let i = 0; i < result.rows.length; i++) {
                        const txn = result.rows.item(i);  // Access each row item directly
                        transactions.push(txn);  // Store the transaction into the transactions array
                    }

                    console.log('Fetched transactions:', transactions); 

                    if (transactions.length === 0) {
                        console.error("No transactions found for groupId:", groupId);
                        return; // Exit if no transactions found
                    }

                    transactions.forEach((txn, index) => {
                        console.log(`Processing transaction ${index + 1} with txnId: ${txn.id}`);  // Log each transaction being processed

                        // Prepare the new envelope details with the updated amounts
                        const newEnvelopeDetails = JSON.stringify([
                            { envelopeId: selectedEnvelopeFromId, envelopeName: selectedEnvelopeFrom, amount: transactionAmount, transactionType: "Expense" },
                            { envelopeId: selectedEnvelopeToId, envelopeName: selectedEnvelopeTo, amount: transactionAmount, transactionType: "Credit" }
                        ]);
                        console.log('New envelope details:', newEnvelopeDetails);  // Log the new envelope details being prepared

                        // Update each transaction with the new envelopeDetails, transactionAmount, and payee
                        tx.executeSql(
                            `UPDATE Transactions SET envelopeDetails = ?, transactionAmount = ?, payee = ? WHERE groupId = ?`,
                            [newEnvelopeDetails, transactionAmount, payee, groupId],
                            (_, updateResult) => {
                                console.log(`Transaction updated for groupId ${groupId}:`, updateResult);  // Log the result of the update
                            },
                            (error) => {
                                console.error(`Error updating transaction for groupId ${groupId}:`, error);
                            }
                        );
                    });
                },
                (error) => {
                    console.error('Error fetching transactions for groupId:', error);
                }
            );


            navigation.navigate('TopTab');
        });
    };


    // code for updating transactions and reverting back amount to relevent envelopes end

    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <View style={styles.container}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Envelope Transfer" titleStyle={styles.appbar_title} />
                    <Appbar.Action
                        onPress={() =>
                            editOrdelete
                                ? handleUpdateTransaction(selectedEnvelopeFrom, selectedEnvelopeFromId, selectedEnvelopeTo, selectedEnvelopeToId, transactionAmount, payee, transactionDate)
                                : handleIconPressWrapper()
                        }
                        icon="check"
                        color={colors.white}
                    />
                    {editOrdelete && (
                        <Appbar.Action
                            onPress={handleDeleteWrapper}
                            icon="delete"
                            color={colors.white}
                        />
                    )}
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>

                <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity onPress={handleTooltipPress}>
                        <Text style={styles.tooltipText}>Help</Text>
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView style={{ flex: 1, marginTop: 5 }}>
                    {/* From envelope menu code */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>From</Text>
                        <View style={styles.envelope_type_view}>
                            <Menu
                                visible={envelopeMenuVisibleFrom}
                                onDismiss={() => setEnvelopeMenuVisibleFrom(false)}
                                anchor={
                                    <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleEnvelopeMenuToggleFrom}>
                                        <Text style={styles.selectionText}>{selectedEnvelopeFrom || '-Select Envelope-'}</Text>
                                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                                    </TouchableOpacity>
                                }
                                contentStyle={[styles.envelopeMenuContentStyle, { maxHeight: 300 }]}
                            >
                                <Menu.Item title="-Select Envelope-" titleStyle={styles.envelop_menu_title_txt} disabled />
                                <FlatList
                                    data={envelopes}
                                    keyExtractor={(item) => item.envelopeId.toString()}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item }) => (
                                        <Menu.Item
                                            onPress={() => {
                                                setSelectedEnvelopeFrom(item.envelopeName);
                                                setSelectedEnvelopeFromId(item.envelopeId);
                                                setEnvelopeMenuVisibleFrom(false);
                                                setEnvelopeRemainingIncome(item.filledIncome);
                                            }}
                                            title={`${item.envelopeName} [${item.filledIncome || 0} left]`}
                                            titleStyle={{ color: colors.black }}
                                        />
                                    )}
                                />
                            </Menu>
                        </View>
                    </View>

                    {/* To envelope menu code */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>To</Text>
                        <View style={styles.envelope_type_view}>
                            <Menu
                                visible={envelopeMenuVisibleTo}
                                onDismiss={() => setEnvelopeMenuVisibleTo(false)}
                                anchor={
                                    <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleEnvelopeMenuToggleTo}>
                                        <Text style={styles.selectionText}>{selectedEnvelopeTo || '-Select Envelope-'}</Text>
                                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                                    </TouchableOpacity>
                                }
                                contentStyle={[styles.envelopeMenuContentStyle, { maxHeight: 300 }]}
                            >
                                <Menu.Item title="-Select Envelope-" titleStyle={styles.envelop_menu_title_txt} disabled />
                                <FlatList
                                    data={envelopes}
                                    keyExtractor={(item) => item.envelopeId.toString()}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item }) => (
                                        <Menu.Item
                                            onPress={() => {
                                                setSelectedEnvelopeTo(item.envelopeName);
                                                setSelectedEnvelopeToId(item.envelopeId);
                                                setEnvelopeMenuVisibleTo(false);
                                                setEnvelopeRemainingIncome(item.filledIncome);
                                            }}
                                            title={`${item.envelopeName} [${item.filledIncome || 0} left]`}
                                            titleStyle={{ color: colors.black }}
                                        />
                                    )}
                                />
                            </Menu>
                        </View>
                    </View>

                    {/* transaction amount and type */}
                    <View style={styles.amt_type_view}>
                        <View style={styles.amt_view}>
                            <Text style={styles.payee_title}>Amount</Text>
                            <View style={styles.name_input_view}>
                                <View style={styles.input_view}>
                                    <TouchableWithoutFeedback
                                        onPressIn={() => {
                                            setFocusedInputAmount(true);
                                        }}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setCalculatorVisible(true);
                                        }}>
                                        <View style={[styles.touchable_input, focusedInputAmount ? styles.touchable_focusedInput : styles.touchable_input]}>
                                            <Text style={{ color: colors.black, fontSize: hp('2.5%') }}>{transactionAmount || '0.00'}</Text>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    </View>



                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.payee_title}>Description</Text>
                        <View style={styles.name_input_view}>
                            <View style={styles.input_view}>
                                <TextInput
                                    value={payee}
                                    onChangeText={setPayee}
                                    mode="flat"
                                    placeholder='Envelope Transfer'
                                    style={[
                                        styles.input,
                                        focusedInput === 'payee' ? styles.focusedInput : {}
                                    ]}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    dense={true}
                                    onFocus={() => setFocusedInput('payee')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* date */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>Date</Text>
                        <TouchableOpacity
                            style={styles.dueDateInput}
                            onPress={() => setShow(true)}
                        >
                            <Text style={styles.dateText}>{formatDate(transactionDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    {show && (
                        <DateTimePicker
                            value={transactionDate}
                            mode="date"
                            display="default"
                            onChange={onChange}
                        />
                    )}

                    {/* for note */}
                    <View style={styles.notes_main_view}>
                        <Text style={styles.title}>Note</Text>
                        <View style={styles.name_input_view}>
                            <View style={styles.input_view}>
                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    mode="flat"
                                    placeholder='(optional)'
                                    style={[
                                        styles.input,
                                        focusedInput === 'note' ? styles.focusedInput : {}
                                    ]}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    dense={true}
                                    multiline={true}
                                    onFocus={() => setFocusedInput('note')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>
                    </View>

                    <Calculator
                        visible={calculatorVisible}
                        textInputValue={transactionAmount}
                        onValueChange={handleValueChange}
                        onClose={() => setCalculatorVisible(false)}
                    />

                </ScrollView>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={1000}
                    style={[
                        styles.snack_bar,
                        {
                            position: 'absolute',
                            bottom: 20,
                            left: 20,
                            right: 20,
                            zIndex: 1000,
                        }
                    ]}
                >
                    <View style={styles.img_txt_view}>
                        <Image
                            source={Images.expenseplannerimage}
                            style={styles.snack_bar_img}
                        />
                        <Text style={styles.snack_bar_text}>All fields required!</Text>
                    </View>
                </Snackbar>

                <Snackbar
                    visible={snackbarVisibleDuplicated}
                    onDismiss={() => setSnackbarVisibleDuplicated(false)}
                    duration={1000}
                    style={[
                        styles.snack_bar,
                        {
                            position: 'absolute',
                            bottom: 20,
                            left: 20,
                            right: 20,
                            zIndex: 1000,
                        }
                    ]}
                >
                    <View style={styles.img_txt_view}>
                        <Image
                            source={Images.expenseplannerimage}
                            style={styles.snack_bar_img}
                        />
                        <Text style={styles.snack_bar_text}>Cannot transfer to/from same envelope.</Text>
                    </View>
                </Snackbar>

            </View>
        </Pressable>
    )
}

export default EnvelopeTransfer

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },

    // for tooltip
    tooltipContainer: {
        position: 'absolute',
        top: 4,
        right: 180,
        width: '50%',
        backgroundColor: colors.white,
        padding: 13,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        zIndex: 10,
    },
    tooltipText: {
        color: colors.black,
        fontSize: hp('2.3%'),
        fontWeight: '400',
    },


    // view
    how_to_fill_view: {
        paddingHorizontal: hp('1.5%'),
    },
    payee_title: {
        fontSize: hp('2.5%'),
        color: colors.gray,
    },
    name_input_view: {
        flexDirection: 'row',
    },
    input_view: {
        flex: 1,
        flexDirection: 'row',
    },
    input: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    focusedInput: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },

    // touchable input styles
    touchable_input: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
        marginTop: hp('1%'),
    },
    touchable_focusedInput: {
        borderBottomWidth: 2.5,
        borderBottomColor: colors.brightgreen,
    },

    title: {
        fontSize: hp('2.5%'),
        color: colors.gray,
        marginVertical: hp('1%'),
    },
    envelope_type_view: {
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        justifyContent: 'flex-end',
        paddingBottom: hp('0.5%'),
    },
    envelope_txt_icon_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionText: {
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    envelopeMenuContentStyle: {
        width: hp('42%'),
        height: 'auto',
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
        color: colors.black,
    },
    envelop_menu_title_txt: {
        fontSize: hp('2%'),
        color: colors.black,
    },

    // amount view styles
    amt_type_view: {
        marginHorizontal: hp('1.5%'),
        flexDirection: 'row',
    },
    amt_view: {
        flex: 1,
    },
    amt_input_view: {
        borderBottomWidth: 1,
    },

    // date view styles
    dueDateInput: {
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        color: 'black',
        marginTop: 8,
    },
    dateText: {
        fontSize: hp('2.5%'),
        color: colors.black,
    },

    notes_main_view: {
        flex: 1,
        paddingHorizontal: hp('1.5%'),
        paddingBottom: hp('36%'),
    },

    // snackbar styles
    // snack_bar: {
    //     backgroundColor: colors.gray,
    //     borderRadius: 50,
    //     zIndex: 1000,
    // },
    // img_txt_view: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    // },
    // snack_bar_img: {
    //     width: wp('10%'),
    //     height: hp('3%'),
    //     marginRight: 10,
    //     resizeMode: 'contain',
    // },
    // snack_bar_text: {
    //     color: colors.white,
    //     fontSize: hp('2%'),
    // },

    snack_bar: {
        backgroundColor: colors.gray,
        borderRadius: 50,
        zIndex: 1000,
        minHeight: hp('6%'), // Set a minimum height, can expand if the text is long
        paddingHorizontal: 10, // Optional: adds some padding for spacing inside
        justifyContent: 'center', // Centers content vertically
        overflow: 'hidden', // Prevents overflowing content
    },

    img_txt_view: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap', // Allows text to wrap if it's too long
    },

    snack_bar_img: {
        width: wp('10%'),
        height: hp('3%'),
        marginRight: 10,
        resizeMode: 'contain',
    },

    snack_bar_text: {
        color: colors.white,
        fontSize: hp('2%'),
        flexWrap: 'wrap', // Allows text to wrap if it's too long
        flexShrink: 1, // Ensures the text will shrink if needed but will not overflow
        maxWidth: '80%', // You can limit the text width to ensure good layout
    }

   

})