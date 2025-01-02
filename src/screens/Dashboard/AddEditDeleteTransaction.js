import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity, StatusBar, Image, FlatList, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, TextInput, Menu, Snackbar } from 'react-native-paper';
import { debounce } from 'lodash';
import Images from '../../constants/images';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../constants/colors';
import { VectorIcon } from '../../constants/vectoricons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { db, fetchTotalIncome, fetchTotalEnvelopesAmount } from '../../database/database';
import Calculator from '../Onboarding/Calculator';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import moment from 'moment';

const { width: screenWidth } = dimensions;

const AddEditDeleteTransaction = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  // console.log('value of isAuthenticated : ', isAuthenticated);
  const user_id = useSelector(state => state.user.user_id);
  // console.log('value of user_id : ', user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  // console.log('value of temp_user_id : ', temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  // console.log('tempUserId state: ', tempUserId);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const handleValueChange = (amount) => {
    setTransactionAmount(amount);
    setCalculatorVisible(false);
  };

  const [focusedInput, setFocusedInput] = useState(null);
  const [focusedInputAmount, setFocusedInputAmount] = useState(false);

  const [payee, setPayee] = useState(null);
  // console.log('value of payee name in addeditdelete transaction is:', payee);
  const [transactionAmount, setTransactionAmount] = useState(0);
  // console.log('after edit prop set transactionAmount', transactionAmount);
  const handleTransactionAmountChange = (value) => {
    setTransactionAmount(value);
  };

  useEffect(() => {
    // console.log('Route params:', route.params);
  }, [route.params]);

  // data being passed as props from transaction screen to add/edit transaction for edit
  const [transactionId, setTransactionId] = useState(null);
  const edit_transaction = route.params;
  const id = route.params?.id;

  // const envelopeID = route.params?.envelopeId;
  // console.log('envelopeID from route for edit transaction: ', envelopeID);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setTransactionId(id);
        setPayee(route.params.payee);
        setTransactionAmount(route.params.transactionAmount.toString());
        setTransactionType(route.params.transactionType);
        setSelectedEnvelope(route.params.envelopeName);
        // setSelectedEnvelopeFilledIncome(route.params.envelopeRemainingIncome); // this is for remaining income of envelope
        setSelectedEnvelopeId(route.params.envelopeId);

        if (route.params.transactionDate) {
          const date = new Date(route.params.transactionDate);
          setTransactionDate(date); // Set as Date object
        }
        setSelectedAccount(route.params.accountName);
        setNote(route.params.transactionNote);
      }
    }, [id, route.params])
  );

  // code for type menu
  const [transactionType, setTransactionType] = useState('Expense');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const handleMenuToggle = useMemo(
    () => debounce(() => setTypeMenuVisible(prev => !prev), 10),
    []
  );

  // code for envelope menu
  const [envelopeRemainingIncome, setEnvelopeRemainingIncome] = useState(0);
  const [envelopeMenuVisible, setEnvelopeMenuVisible] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState(false); // selectedEnvelope holds envelopeName for transaction
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [selectedEnvelopeFilledIncome, setSelectedEnvelopeFilledIncome] = useState(null);
  // console.log('selectedEnvelopeId', selectedEnvelopeId);
  const handleEnvelopeMenuToggle = useMemo(
    () => debounce(() => setEnvelopeMenuVisible(prev => !prev), 10),
    []
  );

  // code for account menu
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('My Account');
  const handleAccountMenuToggle = useMemo(
    () => debounce(() => setAccountMenuVisible(prev => !prev), 10),
    []
  );

  // to get current month dates and then formate them into our sql date formate
  const [formattedFromDate, setFormattedFromDate] = useState('');
  const [formattedToDate, setFormattedToDate] = useState('');

  // console.log('Formatted From Date in Envelopes:', formattedFromDate);
  // console.log('Formatted To Date in Envelopes:', formattedToDate);

  useFocusEffect(
    useCallback(() => {
      const fromDate = moment().startOf('month').format('YYYY-MM-DD');
      const toDate = moment().endOf('month').format('YYYY-MM-DD');

      // default dates set to todays date
      setFormattedFromDate(formatDateSql(fromDate));
      setFormattedToDate(formatDateSql(toDate));

      // hardcoded dates to set and retrieve data for testing purposes
      // setFormattedFromDate('2025-01-01');
      // setFormattedToDate('2025-01-30');
    }, [])
  );

  // code for transaction date 
  const [transactionDate, setTransactionDate] = useState(new Date());
  const formattedTransactionDate = formatDateSql(transactionDate);
  // console.log('value of state transaction date is: ', formattedTransactionDate);

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

  // code for tooltip
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const handleLeftIconPress = () => {
    navigation.goBack();
  };
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
    setFocusedInputAmount(false);
  };
  const handleTooltipPress = () => {
    toggleTooltip();
    navigation.navigate('Help', { from_addeditdelete_transaction: true });
  };


  // code for getting current year 
  const startOfYear = moment().startOf('year').toISOString();
  const endOfYear = moment().endOf('year').toISOString();
  // Format the dates using the formatDateSql function
  const formattedFromDateYearly = formatDateSql(startOfYear);
  const formattedToDateYearly = formatDateSql(endOfYear);

  // console.log(' date of formattedFromDateYearly', formattedFromDateYearly);
  // console.log(' date of formattedToDateYearly', formattedToDateYearly);

  // code for getting all envelopes from envelopes table
  const [envelopes, setEnvelopes] = useState([]);
  // console.log('all envelopes', envelopes);
  if (edit_transaction) {
    // console.log('Editing transaction, envelopes state: ', envelopes);
  } else {
    // console.log('Adding transaction, envelopes state: ', envelopes);
  }

  useFocusEffect(
    useCallback(() => {
      getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly])
  );
  const getAllEnvelopes = (callback) => {
    db.transaction(tx => {
      // const sqlQuery = 'SELECT * FROM envelopes WHERE user_id = ? AND fillDate BETWEEN ? AND ? ORDER BY orderIndex';
      const sqlQuery = `
    SELECT * 
    FROM envelopes 
    WHERE user_id = ? 
    AND (
        (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?)
        OR 
        (budgetPeriod = 'Every Year' AND fillDate BETWEEN ? AND ?)
    )
    ORDER BY orderIndex
`;
      tx.executeSql(
        sqlQuery,
        [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly],
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

  // code for getting total income from income table which is default account for now
  const incomes = [{ accountName: "My Account" },]; // later on when adding multiple accounts replace it with accounts table
  const [accountName, setAccountName] = useState('My Account'); // for now you can use totalIncome to be filled in accountName

  const [budgetAmount, setBudgetAmount] = useState(0);
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchTotalIncome(setBudgetAmount, tempUserId, formattedFromDate, formattedToDate);
  //   }, [tempUserId, formattedFromDate, formattedToDate])
  // );

  // to show Account amount from sum of all envelopes filledIncome instead from Income table now only filters for montly evelopes
  // modify so that it also counts for current year envelopes by passing current year start and end dates
  useFocusEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setBudgetAmount, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly])
  );

  // code for setting data in a single object for adding transaction
  const handleAddTransaction = () => {
    if (
      !payee ||
      !transactionAmount ||
      !transactionType ||
      !selectedEnvelope ||
      !accountName ||
      !formattedTransactionDate
    ) {
      // Show snackbar if a required field is missing
      setSnackbarVisible(true);
      return;
    }

    const transaction = {
      payee: payee,
      transactionAmount: transactionAmount,
      transactionType: transactionType,
      envelopeName: selectedEnvelope,
      envelopeId: selectedEnvelopeId,
      envelopeRemainingIncome: envelopeRemainingIncome, // added to count for at time of transaction what was it remaining filledIncome
      accountName: accountName,
      transactionDate: formattedTransactionDate,
      transactionNote: note,
      user_id: tempUserId,
    };
    // console.log('Transaction values to be added:', transaction);
    insertTransaction(transaction, formattedFromDate, formattedToDate);
  };

  // code for adding transaction, updating envelope, updating Income table or monthly budget where it was juts updating income against each record
  // const insertTransaction = (transaction, formattedFromDate, formattedToDate) => {
  //   db.transaction((tx) => {
  //     // Insert the transaction into the Transactions table
  //     tx.executeSql(
  //       `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, envelopeId, envelopeRemainingIncome, accountName, transactionDate, transactionNote, user_id) 
  //           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  //       [
  //         transaction.payee,
  //         transaction.transactionAmount,
  //         transaction.transactionType,
  //         transaction.envelopeName,
  //         transaction.envelopeId,
  //         transaction.envelopeRemainingIncome,
  //         transaction.accountName,
  //         transaction.transactionDate,
  //         transaction.transactionNote,
  //         transaction.user_id,
  //       ],
  //       (_, result) => {
  //         console.log('Transaction inserted successfully:', result);
  //         addPayee(payee);

  //         // Now update the corresponding envelope based on the transactionType
  //         const amount = transaction.transactionAmount;
  //         // const envelopeName = transaction.envelopeName;
  //         const envelopeId = transaction.envelopeId;
  //         const transactionType = transaction.transactionType;
  //         // const accountName = transaction.accountName; // for Income table

  //         console.log('=================insertion dates=========== :', formattedFromDate, formattedToDate);

  //         // Update the envelope based on the transaction type
  //         if (transactionType === 'Credit') {
  //           tx.executeSql(
  //             `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
  //             [amount, envelopeId],
  //             (_, updateResult) => {
  //               console.log('Envelope updated successfully for credit:', updateResult);
  //               navigation.goBack();
  //             },
  //             (_, error) => {
  //               console.error('Error updating envelope for credit:', error.message);
  //             }
  //           );
  //           // to update Income table for
  //           tx.executeSql(
  //             `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = 'My Account' AND budgetPeriod = 'Monthly' AND incomeDate BETWEEN ? AND ?;`,
  //             [amount, formattedFromDate, formattedToDate],
  //             (_, updateResult) => {
  //               console.log('Income table updated successfully for credit:', updateResult);
  //             },
  //             (_, error) => {
  //               console.error('Error updating Income table for credit:', error.message);
  //             }
  //           );
  //         } else if (transactionType === 'Expense') {
  //           tx.executeSql(
  //             `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?;`,
  //             [amount, envelopeId],
  //             (_, updateResult) => {
  //               console.log('Envelope updated successfully for expense:', updateResult);
  //               navigation.goBack();
  //             },
  //             (_, error) => {
  //               console.error('Error updating envelope for expense:', error.message);
  //             }
  //           );
  //           // to update Income table for expense
  //           tx.executeSql(
  //             `UPDATE Income SET budgetAmount = budgetAmount - ? WHERE accountName = 'My Account' AND budgetPeriod = 'Monthly' AND incomeDate BETWEEN ? AND ?;`,
  //             [amount, formattedFromDate, formattedToDate],
  //             (_, updateResult) => {
  //               console.log('Income table updated successfully for expense:', updateResult);
  //             },
  //             (_, error) => {
  //               console.error('Error updating Income table for expense:', error.message);
  //             }
  //           );
  //         }
  //       },
  //       (_, error) => {
  //         console.error('Error inserting transaction', error.code, error.message);
  //       }
  //     );
  //   });
  // };

  const insertTransaction = (transaction, formattedFromDate, formattedToDate) => {
    db.transaction((tx) => {
      // Insert the transaction into the Transactions table
      tx.executeSql(
        `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, envelopeId, envelopeRemainingIncome, accountName, transactionDate, transactionNote, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          transaction.payee,
          transaction.transactionAmount,
          transaction.transactionType,
          transaction.envelopeName,
          transaction.envelopeId,
          transaction.envelopeRemainingIncome,
          transaction.accountName,
          transaction.transactionDate,
          transaction.transactionNote,
          transaction.user_id,
        ],
        (_, result) => {
          console.log('Transaction inserted successfully:');

          addPayee(payee);

          const amount = transaction.transactionAmount;
          const envelopeId = transaction.envelopeId;
          const transactionType = transaction.transactionType;

          console.log('=================insertion dates=========== :', formattedFromDate, formattedToDate);

          // Update envelopes table based on transaction type
          if (transactionType === 'Credit') {
            // Credit: Update envelopes table (increase filledIncome)
            tx.executeSql(
              `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
              [amount, envelopeId],
              (_, updateResult) => {
                console.log('Envelope updated successfully for credit:', updateResult);
                navigation.goBack(); // added this to navigate user back
              },
              (_, error) => {
                console.error('Error updating envelope for credit:', error.message);
              }
            );
          } else if (transactionType === 'Expense') {
            // Expense: Update envelopes table (decrease filledIncome)
            tx.executeSql(
              `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?;`,
              [amount, envelopeId],
              (_, updateResult) => {
                console.log('Envelope updated successfully for expense:', updateResult);
                navigation.goBack(); // added this to navigate user back
              },
              (_, error) => {
                console.error('Error updating envelope for expense:', error.message);
              }
            );
          }

          // Fetch ids from Income table and update the selected id
          // commented becaue we no more need it in app...like it has no impact..not being used anywhere
          // tx.executeSql(
          //   `SELECT id FROM Income WHERE incomeDate BETWEEN ? AND ? AND id IS NOT NULL;`,
          //   [formattedFromDate, formattedToDate],
          //   (_, result) => {
          //     // Log all ids found within the date range
          //     const ids = [];
          //     for (let i = 0; i < result.rows.length; i++) {
          //       const row = result.rows.item(i);
          //       ids.push(row.id);
          //       // console.log('Found id:', row.id); // Log each found id
          //     }

          //     // If there are any ids, randomly select one
          //     if (ids.length > 0) {
          //       const randomIndex = Math.floor(Math.random() * ids.length); // Get a random index
          //       const incomeId = ids[randomIndex]; // Select the incomeId
          //       // console.log('Selected incomeId:', incomeId); // Log the selected incomeId

          //       // Now perform the update on Income table for either Credit or Expense

          //       if (transactionType === 'Credit') {
          //         // Credit: Update Income table (increase budgetAmount)
          //         tx.executeSql(
          //           `UPDATE Income SET budgetAmount = budgetAmount + ? 
          //          WHERE accountName = 'My Account' 
          //          AND budgetPeriod = 'Monthly' 
          //          AND incomeDate BETWEEN ? AND ? 
          //          AND id = ?;`,
          //           [amount, formattedFromDate, formattedToDate, incomeId], // Pass amount, date range, and incomeId
          //           (_, updateResult) => {
          //             console.log('Income table updated successfully for credit:', updateResult);
          //             navigation.goBack(); // Go back after the update
          //           },
          //           (_, error) => {
          //             console.error('Error updating Income table for credit:', error.message);
          //           }
          //         );
          //       } else if (transactionType === 'Expense') {
          //         // Expense: Update Income table (decrease budgetAmount)
          //         tx.executeSql(
          //           `UPDATE Income SET budgetAmount = budgetAmount - ? 
          //          WHERE accountName = 'My Account' 
          //          AND budgetPeriod = 'Monthly' 
          //          AND incomeDate BETWEEN ? AND ? 
          //          AND id = ?;`,
          //           [amount, formattedFromDate, formattedToDate, incomeId], // Pass amount, date range, and incomeId
          //           (_, updateResult) => {
          //             console.log('Income table updated successfully for expense:', updateResult);
          //             navigation.goBack(); // Go back after the update
          //           },
          //           (_, error) => {
          //             console.error('Error updating Income table for expense:', error.message);
          //           }
          //         );
          //       }

          //     } else {
          //       console.log('No valid income records found within the specified date range.');
          //     }
          //   },
          //   (_, error) => {
          //     console.error('Error fetching ids from Income table:', error.message);
          //   }
          // );

        },
        (_, error) => {
          console.error('Error inserting transaction', error.code, error.message);
        }
      );
    });
  };


  // code to delte transaction older
  // const handleDeleteTransaction = (formattedFromDate, formattedToDate) => {
  //   if (id) {
  //     db.transaction((tx) => {
  //       // First, retrieve the transaction details
  //       tx.executeSql(
  //         `SELECT transactionAmount, transactionType, envelopeId FROM Transactions WHERE id = ?;`,
  //         [id],
  //         (_, { rows }) => {
  //           if (rows.length > 0) {
  //             const { transactionAmount, transactionType, envelopeId } = rows.item(0);

  //             console.log('=================deletion dates================', formattedFromDate, formattedToDate);

  //             // Based on transactionType, adjust the envelope amount
  //             if (transactionType === 'Credit') {
  //               // If it was a credit, subtract the amount from the envelope
  //               tx.executeSql(
  //                 `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?;`,
  //                 [transactionAmount, envelopeId],
  //                 (_, updateResult) => {
  //                   console.log('Envelope updated successfully for deleted credit:', updateResult);
  //                 },
  //                 (_, error) => {
  //                   console.error('Error updating envelope for deleted credit:', error.message);
  //                 }
  //               );
  //               // Subtract the amount from Income table budgetAmount for "My Account" and "Monthly"
  //               tx.executeSql(
  //                 `UPDATE Income SET budgetAmount = budgetAmount - ? WHERE accountName = ? AND budgetPeriod = ? AND incomeDate BETWEEN ? AND ?;`,
  //                 [transactionAmount, "My Account", "Monthly", formattedFromDate, formattedToDate],
  //                 (_, updateResult) => {
  //                   console.log('Income updated successfully for deleted credit:', updateResult);
  //                 },
  //                 (_, error) => {
  //                   console.error('Error updating Income for deleted credit:', error.message);
  //                 }
  //               );
  //             } else if (transactionType === 'Expense') {
  //               // If it was an expense, add the amount back to the envelope
  //               tx.executeSql(
  //                 `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
  //                 [transactionAmount, envelopeId],
  //                 (_, updateResult) => {
  //                   console.log('Envelope updated successfully for deleted expense:', updateResult);
  //                 },
  //                 (_, error) => {
  //                   console.error('Error updating envelope for deleted expense:', error.message);
  //                 }
  //               );
  //               // Add the amount back to Income table budgetAmount for "My Account" and "Monthly"
  //               tx.executeSql(
  //                 `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = ? AND budgetPeriod = ? AND incomeDate BETWEEN ? AND ?;`,
  //                 [transactionAmount, "My Account", "Monthly", formattedFromDate, formattedToDate],
  //                 (_, updateResult) => {
  //                   console.log('Income updated successfully for deleted expense:', updateResult);
  //                 },
  //                 (_, error) => {
  //                   console.error('Error updating Income for deleted expense:', error.message);
  //                 }
  //               );
  //             }

  //             // Now delete the transaction from Transactions table
  //             tx.executeSql(
  //               `DELETE FROM Transactions WHERE id = ?;`,
  //               [id],
  //               () => {
  //                 console.log(`Transaction with ID ${id} deleted successfully`);
  //                 navigation.goBack();
  //               },
  //               (error) => {
  //                 console.error('Error deleting transaction', error);
  //               }
  //             );
  //           } else {
  //             console.error(`No transaction found with ID ${id}`);
  //           }
  //         },
  //         (error) => {
  //           console.error('Error fetching transaction details for deletion', error);
  //         }
  //       );
  //     });
  //   } else {
  //     console.error('No ID provided for deletion');
  //   }
  // };

  const handleDeleteTransaction = (formattedFromDate, formattedToDate) => {
    if (id) {
      db.transaction((tx) => {
        // First, retrieve the transaction details
        tx.executeSql(
          `SELECT transactionAmount, transactionType, envelopeId FROM Transactions WHERE id = ?;`,
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const { transactionAmount, transactionType, envelopeId } = rows.item(0);

              console.log('=================deletion dates================', formattedFromDate, formattedToDate);

              // Retrieve incomeId from the Income table based on the date range
              tx.executeSql(
                `SELECT id FROM Income WHERE incomeDate BETWEEN ? AND ? AND id IS NOT NULL;`,
                [formattedFromDate, formattedToDate],
                (_, result) => {
                  const ids = [];
                  for (let i = 0; i < result.rows.length; i++) {
                    const row = result.rows.item(i);
                    ids.push(row.id);
                    // console.log('Found id:', row.id);
                  }

                  if (ids.length > 0) {
                    const randomIndex = Math.floor(Math.random() * ids.length);
                    const incomeId = ids[randomIndex];
                    // console.log('Selected incomeId:', incomeId);

                    // Based on transactionType, adjust the envelope amount
                    if (transactionType === 'Credit') {
                      // If it was a credit, subtract the amount from the envelope
                      tx.executeSql(
                        `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ?;`,
                        [transactionAmount, envelopeId],
                        (_, updateResult) => {
                          console.log('Envelope updated successfully for deleted credit:', updateResult);
                        },
                        (_, error) => {
                          console.error('Error updating envelope for deleted credit:', error.message);
                        }
                      );
                      // Subtract the amount from Income table budgetAmount for "My Account" and "Monthly"
                      tx.executeSql(
                        `UPDATE Income SET budgetAmount = budgetAmount - ? WHERE accountName = ? AND budgetPeriod = ? AND incomeDate BETWEEN ? AND ? AND id = ?;`,
                        [transactionAmount, "My Account", "Monthly", formattedFromDate, formattedToDate, incomeId],
                        (_, updateResult) => {
                          console.log('Income updated successfully for deleted credit:', updateResult);
                        },
                        (_, error) => {
                          console.error('Error updating Income for deleted credit:', error.message);
                        }
                      );
                    } else if (transactionType === 'Expense') {
                      // If it was an expense, add the amount back to the envelope
                      tx.executeSql(
                        `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
                        [transactionAmount, envelopeId],
                        (_, updateResult) => {
                          console.log('Envelope updated successfully for deleted expense:', updateResult);
                        },
                        (_, error) => {
                          console.error('Error updating envelope for deleted expense:', error.message);
                        }
                      );
                      // Add the amount back to Income table budgetAmount for "My Account" and "Monthly"
                      tx.executeSql(
                        `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = ? AND budgetPeriod = ? AND incomeDate BETWEEN ? AND ? AND id = ?;`,
                        [transactionAmount, "My Account", "Monthly", formattedFromDate, formattedToDate, incomeId],
                        (_, updateResult) => {
                          console.log('Income updated successfully for deleted expense:', updateResult);
                        },
                        (_, error) => {
                          console.error('Error updating Income for deleted expense:', error.message);
                        }
                      );
                    }

                    // Now delete the transaction from Transactions table
                    tx.executeSql(
                      `DELETE FROM Transactions WHERE id = ?;`,
                      [id],
                      () => {
                        console.log(`Transaction with ID ${id} deleted successfully`);
                        navigation.goBack();
                      },
                      (error) => {
                        console.error('Error deleting transaction', error);
                      }
                    );
                  } else {
                    console.error('No valid income records found within the specified date range.');
                  }
                },
                (_, error) => {
                  console.error('Error fetching ids from Income table:', error.message);
                }
              );
            } else {
              console.error(`No transaction found with ID ${id}`);
            }
          },
          (error) => {
            console.error('Error fetching transaction details for deletion', error);
          }
        );
      });
    } else {
      console.error('No ID provided for deletion');
    }
  };


  // code for updating a transaction
  // const handleUpdateTransaction = (formattedFromDate, formattedToDate) => {
  //   db.transaction((tx) => {
  //     // Step 1: Fetch existing transaction details
  //     tx.executeSql(
  //       `SELECT transactionAmount, transactionType, envelopeId FROM Transactions WHERE id = ?;`,
  //       [transactionId],
  //       (_, { rows }) => {
  //         if (rows.length > 0) {
  //           const existingTransaction = rows.item(0);
  //           const { transactionAmount: oldAmount, transactionType: oldType, envelopeId: oldEnvelopeId } = existingTransaction;

  //           // Step 2: Revert impact on the old envelope based on old transaction details
  //           if (oldEnvelopeId) {
  //             let revertAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
  //             tx.executeSql(
  //               `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
  //               [revertAmount, oldEnvelopeId],
  //               () => console.log('Reverted impact on old envelope successfully'),
  //               (error) => console.error('Error reverting impact on old envelope', error)
  //             );
  //           }

  //           console.log('=================updation dates================', formattedFromDate, formattedToDate);

  //           // Also, revert impact on the Income table based on the old type
  //           let revertIncomeAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
  //           tx.executeSql(
  //             `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = "My Account" AND budgetPeriod = "Monthly" AND incomeDate BETWEEN ? AND ?;`,
  //             [revertIncomeAmount, formattedFromDate, formattedToDate],
  //             () => console.log('Reverted impact on Income table successfully'),
  //             (error) => console.error('Error reverting Income table', error)
  //           );

  //           // Step 3: Apply impact on the new or updated envelope based on new transaction details
  //           let newAmountImpact = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
  //           tx.executeSql(
  //             `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
  //             [newAmountImpact, selectedEnvelopeId],
  //             () => console.log('Updated impact on new envelope successfully'),
  //             (error) => console.error('Error updating new envelope', error)
  //           );

  //           // Also, update the Income table based on the new transaction type
  //           let newIncomeAmount = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
  //           tx.executeSql(
  //             `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = "My Account" AND budgetPeriod = "Monthly" AND incomeDate BETWEEN ? AND ?;`,
  //             [newIncomeAmount, formattedFromDate, formattedToDate],
  //             () => console.log('Updated impact on Income table successfully'),
  //             (error) => console.error('Error updating Income table', error)
  //           );

  //           // Step 4: Update the transaction in the Transactions table
  //           tx.executeSql(
  //             `UPDATE Transactions SET payee = ?, transactionAmount = ?, transactionType = ?, envelopeId = ?, envelopeRemainingIncome = ?, accountName = ?, transactionDate = ?, transactionNote = ? WHERE id = ?;`,
  //             [
  //               payee,
  //               transactionAmount,
  //               transactionType,
  //               selectedEnvelopeId,
  //               envelopeRemainingIncome,
  //               selectedAccount,
  //               formattedTransactionDate,
  //               note,
  //               transactionId,
  //             ],
  //             () => {
  //               console.log('Transaction updated successfully');
  //             },
  //             (error) => console.error('Error updating transaction', error)
  //           );

  //           navigation.goBack();
  //         } else {
  //           console.error('Transaction not found for updating');
  //         }
  //       },
  //       (error) => console.error('Error fetching existing transaction details', error)
  //     );
  //   });
  // };

  const handleUpdateTransaction = (formattedFromDate, formattedToDate) => {
    db.transaction((tx) => {
      // Step 1: Fetch existing transaction details
      tx.executeSql(
        `SELECT transactionAmount, transactionType, envelopeId FROM Transactions WHERE id = ?;`,
        [transactionId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const existingTransaction = rows.item(0);
            const { transactionAmount: oldAmount, transactionType: oldType, envelopeId: oldEnvelopeId } = existingTransaction;

            // Step 2: Revert impact on the old envelope based on old transaction details
            if (oldEnvelopeId) {
              let revertAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
              tx.executeSql(
                `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
                [revertAmount, oldEnvelopeId],
                () => console.log('Reverted impact on old envelope successfully'),
                (error) => console.error('Error reverting impact on old envelope', error)
              );
            }

            // Step 3: Fetch the incomeId associated with the period (formattedFromDate, formattedToDate)
            tx.executeSql(
              `SELECT id FROM Income WHERE accountName = "My Account" AND budgetPeriod = "Monthly" AND incomeDate BETWEEN ? AND ?;`,
              [formattedFromDate, formattedToDate],
              (_, { rows }) => {
                if (rows.length > 0) {
                  const incomeId = rows.item(0).id; // Set the incomeId to the first matched result

                  // Step 4: Revert impact on the Income table based on the old type
                  // commented because no need as it is not being used anywhere in app.. like it has no impact
                  // let revertIncomeAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
                  // tx.executeSql(
                  //   `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE id = ?;`,
                  //   [revertIncomeAmount, incomeId],
                  //   () => console.log('Reverted impact on Income table successfully'),
                  //   (error) => console.error('Error reverting Income table', error)
                  // );

                  // Step 5: Apply impact on the new or updated envelope based on new transaction details
                  let newAmountImpact = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
                  tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ?;`,
                    [newAmountImpact, selectedEnvelopeId],
                    () => console.log('Updated impact on new envelope successfully'),
                    (error) => console.error('Error updating new envelope', error)
                  );

                  // Step 6: Update the Income table based on the new transaction type
                  // commented because no need as it is not being used anywhere in app.. like it has no impact
                  // let newIncomeAmount = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
                  // tx.executeSql(
                  //   `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE id = ?;`,
                  //   [newIncomeAmount, incomeId],
                  //   () => console.log('Updated impact on Income table successfully'),
                  //   (error) => console.error('Error updating Income table', error)
                  // );

                } else {
                  console.error('No matching income record found for the given period');
                }
              },
              (error) => console.error('Error fetching incomeId for the specified period', error)
            );

            // Step 7: Update the transaction in the Transactions table
            tx.executeSql(
              `UPDATE Transactions SET payee = ?, transactionAmount = ?, transactionType = ?, envelopeId = ?, envelopeRemainingIncome = ?, accountName = ?, transactionDate = ?, transactionNote = ? WHERE id = ?;`,
              [
                payee,
                transactionAmount,
                transactionType,
                selectedEnvelopeId,
                envelopeRemainingIncome,
                selectedAccount,
                formattedTransactionDate,
                note,
                transactionId,
              ],
              () => {
                console.log('Transaction updated successfully');
              },
              (error) => console.error('Error updating transaction', error)
            );

            navigation.goBack();
          } else {
            console.error('Transaction not found for updating');
          }
        },
        (error) => console.error('Error fetching existing transaction details', error)
      );
    });
  };



  // code for adding a payee names in Payees table
  const [payees, setPayees] = useState([]);
  const [payeesMenuVisible, setPayeesMenuVisible] = useState(false);

  const addPayee = (payeeName) => {
    if (payeeName.trim().length < 2) {
      console.log("Payee name must be at least two characters long");
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        `SELECT id FROM Payees WHERE name = ?;`,
        [payeeName],
        (_, results) => {
          if (results.rows.length === 0) {
            tx.executeSql(
              `INSERT INTO Payees (name, isDefault) VALUES (?, 0);`,
              [payeeName],
              () => console.log(`Payee "${payeeName}" added successfully`),
              (tx, error) => console.error(`Error adding payee "${payeeName}"`, error)
            );
          } else {
            console.log(`Payee "${payeeName}" already exists`);
          }
        },
        (tx, error) => console.error("Error checking payee existence:", error)
      );
    });
  };


  // code for searching payees or getAllPayees
  const searchPayees = (query, callback) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT name 
       FROM Payees 
       WHERE name LIKE ? OR name LIKE ? 
       ORDER BY 
         CASE 
           WHEN name LIKE ? THEN 1 -- Exact matches first
           ELSE 2 
         END, 
         name ASC;`, // Alphabetical order
        [`${query}%`, `%${query}%`, `${query}%`],
        (_, results) => {
          const payees = [];
          for (let i = 0; i < results.rows.length; i++) {
            payees.push(results.rows.item(i).name);
          }
          callback(payees); // Send the result to the callback
        },
        (tx, error) => console.error("Error searching payees:", error)
      );
    });
  };

  // function to search payees
  // const handleSearch = (text) => {
  //   if (text.trim().length >= 1) {
  //     searchPayees(text, (matchingPayees) => {
  //       setPayees(matchingPayees); // Update with matching payees
  //       setShowMenu(matchingPayees.length > 0); // Show menu if matches exist
  //     });
  //   } else {
  //     setPayees([]); // Clear payee list
  //     setShowMenu(false); // Hide menu if input is empty
  //   }
  // };

  // const [selectedPayee, setSelectedPayee] = useState([]);

  // this is used to get envelopeId from transactions and relevent envelope from envelopes and thus set state that shows envelope current filledIncome
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    // console.log('Checking if route.params and envelopes are available...');

    // this is just for testing
    // if (route.params?.envelopeName) {
    //   console.log('Envelope Name found:', route.params.envelopeName);
    // } else {
    //   console.log('Envelope Name not found in route.params');
    // }

    // this too is for testing purposes
    // if (envelopes.length > 0) {
    //   console.log('Envelopes array is populated:');
    // } else {
    //   console.log('Envelopes array is empty or not yet populated');
    // }

    if (route.params?.envelopeName && envelopes.length > 0) {
      // console.log('envelopeId and envelopes are available. Marking data as ready.');
      setIsDataReady(true);
    } else {
      // console.log('Data is not ready yet.');
    }
  }, [route.params, envelopes]);

  useFocusEffect(
    useCallback(() => {
      // console.log('useFocusEffect triggered.');

      if (isDataReady) {
        // console.log('Data is ready. Searching for the selected envelope...');
        const selectedEnvelope = envelopes.find(
          envelope => envelope.envelopeName === route.params.envelopeName
        );

        if (selectedEnvelope) {
          // console.log('Selected envelope found:', selectedEnvelope);
          setSelectedEnvelopeFilledIncome(selectedEnvelope.filledIncome);
          // console.log('Envelope filled income set:', selectedEnvelope.filledIncome);
        } else {
          // console.log('No envelope matches the provided envelopeName:', route.params.envelopeName);
        }
      } else {
        // console.log('Data is not ready. Skipping envelope selection logic.');
      }
    }, [isDataReady, route.params?.envelopeName, envelopes])
  );

  return (
    <Pressable style={{ flex: 1, backgroundColor: colors.white }} onPress={handleOutsidePress}>
      <StatusBar backgroundColor={colors.munsellgreen} />
      <View>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
          <Appbar.Content
            title={edit_transaction ? "Edit Transaction" : "Add Transaction"}
            titleStyle={styles.appbar_title}
          />
          <Appbar.Action
            // onPress={edit_transaction ? handleUpdateTransaction : handleAddTransaction}
            onPress={() => {
              if (edit_transaction) {
                handleUpdateTransaction(formattedFromDate, formattedToDate);
              } else {
                handleAddTransaction();
              }
            }}
            icon="check"
            color={colors.white}
          />
          {edit_transaction && (
            <Appbar.Action
              // onPress={handleDeleteTransaction} 
              onPress={() => handleDeleteTransaction(formattedFromDate, formattedToDate)}
              icon="delete"
              color={colors.white}
            />
          )}
          <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
        </Appbar.Header>
      </View>

      <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity onPress={handleTooltipPress}>
          <Text style={styles.tooltipText}>Help</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* screen code onward */}
      <ScrollView style={{ flex: 1 }}>
        {/* payee */}
        <View style={styles.how_to_fill_view}>
          <Text style={styles.payee_title}>Payee</Text>
          <View style={styles.name_input_view}>
            <View style={styles.input_view}>
              <TextInput
                value={payee}
                onChangeText={(text) => {
                  setPayee(text); // Update the input value
                  if (text.trim().length >= 1) {
                    // Perform search and update menu
                    searchPayees(text, (matchingPayees) => {
                      setPayees(matchingPayees); // Update payees list
                      setPayeesMenuVisible(matchingPayees.length > 0); // Show menu if matches exist
                    });
                  } else {
                    // Clear payees list and hide menu if input is empty
                    setPayees([]);
                    setPayeesMenuVisible(false);
                  }
                }}
                onBlur={() => {
                  setFocusedInput(null);
                  setFocusedInputAmount(false);
                  if (!payeesMenuVisible) setPayee(payee); // Set the typed value if menu is not open
                }}
                onFocus={() => {
                  setFocusedInput('payee');
                  setFocusedInputAmount(false);
                  setPayeesMenuVisible(payees.length > 0);
                }
                } // Show menu when focused if matches exist
                mode="flat"
                placeholder="Whom did you pay?"
                style={[
                  styles.input,
                  focusedInput === 'payee' ? styles.focusedInput : {}
                ]}
                theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                textColor={colors.black}
                dense={true}
              />
            </View>
          </View>
        </View>


        <Menu
          visible={payeesMenuVisible}
          onDismiss={() => setPayeesMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.payees_txt_icon_view}
              onPress={() => setPayeesMenuVisible(!payeesMenuVisible)}
            >
              {/* <Text style={styles.payees_selectionText}>{selectedPayee}</Text> */}
            </TouchableOpacity>
          }
          contentStyle={[styles.payeesMenuContentStyle, { maxHeight: 285 }]}
        >
          <FlatList
            data={payees}
            keyExtractor={(item, index) => `${item}-${index}`}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => (
              <Menu.Item
                onPress={() => {
                  setPayee(item); // Update TextInput with selected payee
                  // setSelectedPayee(item); // Set selected payee
                  setPayeesMenuVisible(false); // Hide menu
                }}
                title={item}
                titleStyle={{ color: colors.black }}
              />
            )}
          />
        </Menu>
        {/* end of menu for default payees */}

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
          <View style={styles.type_view}>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <TouchableOpacity style={styles.txt_icon_view} onPress={handleMenuToggle}>
                  <Text style={styles.selectionText}>{transactionType}</Text>
                  <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContentStyle}
            >
              <Menu.Item onPress={() => { setTransactionType('Expense'); setTypeMenuVisible(false); }} title="Expense" titleStyle={{ color: colors.black }} />
              <Menu.Item onPress={() => { setTransactionType('Credit'); setTypeMenuVisible(false); }} title="Credit" titleStyle={{ color: colors.black }} />
            </Menu>
          </View>
        </View>
        {/* account */}

        <View style={styles.how_to_fill_view}>
          <Text style={styles.title}>Envelope</Text>
          <View style={styles.envelope_type_view}>
            <Menu
              visible={envelopeMenuVisible}
              onDismiss={() => setEnvelopeMenuVisible(false)}
              anchor={
                <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleEnvelopeMenuToggle}>
                  <Text style={styles.selectionText}>
                    {selectedEnvelope
                      ? `${selectedEnvelope} (${selectedEnvelopeFilledIncome || 0} left)`
                      : '-Select Envelope-'}
                  </Text>
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
                      setSelectedEnvelope(item.envelopeName);
                      setSelectedEnvelopeId(item.envelopeId);
                      setSelectedEnvelopeFilledIncome(item.filledIncome);
                      setEnvelopeMenuVisible(false);
                      setEnvelopeRemainingIncome(item.filledIncome);
                    }}
                    title={`${item.envelopeName} (${item.filledIncome || 0} left)`}
                    titleStyle={{ color: colors.black }}
                  />
                )}
              />
            </Menu>
          </View>
        </View>

        {/* account */}
        <View style={styles.how_to_fill_view}>
          <Text style={styles.title}>Account</Text>
          <View style={styles.envelope_type_view}>
            <Menu
              visible={accountMenuVisible}
              onDismiss={() => setAccountMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.envelope_txt_icon_view}
                  // onPress={handleAccountMenuToggle}
                  onPress={() => {
                    handleAccountMenuToggle();
                    setFocusedInputAmount(false);
                  }}
                >
                  <Text style={styles.selectionText}>
                    {selectedAccount
                      ? `${selectedAccount} (${budgetAmount})`
                      : '-Select Account-'}
                  </Text>
                  {/* <Text style={styles.selectionText}>{selectedAccount  || '-Select Account-'}</Text> */}
                  <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                </TouchableOpacity>
              }
              contentStyle={[styles.envelopeMenuContentStyle, { maxHeight: 300 }]}
            >
              <Menu.Item title="-Select Account-" titleStyle={styles.envelop_menu_title_txt} disabled />
              <FlatList
                data={incomes}
                keyExtractor={(item) => item.accountName.toString()}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => (
                  <Menu.Item
                    onPress={() => {
                      setSelectedAccount(accountName);
                      setAccountMenuVisible(false);
                    }}
                    title={`${item.accountName} (${budgetAmount} left)`}
                    titleStyle={{ color: colors.black }}
                  />
                )}
              />
            </Menu>
          </View>
        </View>

        {/* <View style={styles.how_to_fill_view}>
        <Text style={styles.title}>Account</Text>
        <TouchableOpacity style={styles.selectionView} onPress={showAccountModal}>
          <Text style={styles.selectionText}>{selectedAccount || '-Select Account-'}</Text>
          <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
        </TouchableOpacity>
        <Portal>
          <Modal visible={accountModalVisible} onDismiss={hideAccountModal} contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>-Select Account-</Text>
            </View>
            <TouchableOpacity onPress={handleSelectAccount}>
              <View style={styles.radioButton}>
                <Text style={styles.radio_texts}>My Account {budgetAmount}</Text>
              </View>
            </TouchableOpacity>
          </Modal>
        </Portal>
      </View> */}

        {/* transaction date */}
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
          <Text style={styles.snack_bar_text}>All fields are required!</Text>
        </View>
      </Snackbar>

    </Pressable>
  );
};

export default AddEditDeleteTransaction;

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: colors.brightgreen,
    height: 55,
  },
  appbar_title: {
    color: colors.white,
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
  },
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

  // payee view and textinput styles
  how_to_fill_view: {
    paddingHorizontal: hp('1.5%'),
  },
  title: {
    fontSize: hp('2.5%'),
    color: colors.gray,
    marginVertical: hp('1%'),
  },
  selectionView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  selectionText: {
    fontSize: hp('2.5%'),
    color: colors.black,
  },
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

  // for transaction type menu
  type_view: {
    width: hp('18%'),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    marginLeft: hp('1%'),
    justifyContent: 'flex-end',
    paddingBottom: hp('0.5%'),
  },
  type_icon_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txt_icon_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuContentStyle: {
    width: hp('14%'),
    height: 'auto',
    backgroundColor: colors.white,
    borderRadius: 1,
    paddingVertical: 0,
    color: colors.black,
  },

  // for envelope menu
  envelope_type_icon_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  // for default payees menu
  payeesMenuContentStyle: {
    width: hp('48%'),
    height: 'auto',
    backgroundColor: colors.white,
    borderRadius: 1,
    paddingVertical: 0,
    color: colors.black,
  },

  payees_txt_icon_view: {
    width: 1,
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'green',
  },

  payees_selectionText: {
    // fontSize: hp('2.5%'),
    color: colors.black,
  },


  // account modal styles
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: hp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: hp('1%'),
  },
  modalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: hp('2%'),
  },
  modalImage: {
    width: hp('5%'),
    height: hp('5%'),
    resizeMode: 'contain',
    marginRight: hp('2%'),
  },
  modalText: {
    fontSize: hp('2.5%'),
    color: colors.black,
    marginBottom: hp('2%'),
  },
  radio_texts: {
    fontSize: hp('2.5%'),
    color: colors.black,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // input styles
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

  notes_main_view: {
    flex: 1,
    paddingHorizontal: hp('1.5%'),
    paddingBottom: hp('36%'),
  },

  // snackbar styles
  snack_bar: {
    backgroundColor: colors.gray,
    borderRadius: 50,
    zIndex: 1000,
  },
  img_txt_view: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },

});
