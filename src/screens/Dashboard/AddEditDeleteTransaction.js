import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity, StatusBar, FlatList, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, Button, Checkbox, TextInput, RadioButton, Modal, Portal, Provider, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
import { debounce } from 'lodash';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../constants/colors';
import { VectorIcon } from '../../constants/vectoricons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { db, fetchTotalIncome } from '../../database/database';
import Calculator from '../Onboarding/Calculator';

const { width: screenWidth } = dimensions;

const AddEditDeleteTransaction = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const handleValueChange = (amount) => {
    setTransactionAmount(amount);
    setCalculatorVisible(false);
  };

  const [focusedInput, setFocusedInput] = useState(null);
  const [focusedInputAmount, setFocusedInputAmount] = useState(false);

  const [payee, setPayee] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState(0);
  // console.log('after edit prop set transactionAmount', transactionAmount);
  const handleTransactionAmountChange = (value) => {
    setTransactionAmount(value);
  };

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
  const handleEnvelopeMenuToggle = useMemo(
    () => debounce(() => setEnvelopeMenuVisible(prev => !prev), 10),
    []
  );

  // code for account menu
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(false);
  const handleAccountMenuToggle = useMemo(
    () => debounce(() => setAccountMenuVisible(prev => !prev), 10),
    []
  );

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
    navigation.navigate('About');
  };

  // code for getting all envelopes from envelopes table
  const [envelopes, setEnvelopes] = useState([]);
  useFocusEffect(
    useCallback(() => {
      getAllEnvelopes(setEnvelopes);
    }, [])
  );
  const getAllEnvelopes = (callback) => {
    db.transaction(tx => {
      const sqlQuery = 'SELECT * FROM envelopes ORDER BY orderIndex';
      tx.executeSql(
        sqlQuery,
        [],
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
  useFocusEffect(
    useCallback(() => {
      fetchTotalIncome(setBudgetAmount);
    }, [])
  );

  // data being passed as props from transaction screen to add/edit transaction
  const [transactionId, setTransactionId] = useState(null);
  const edit_transaction = route.params;
  const id = route.params?.id;
  useEffect(() => {
    if (id) {
      setTransactionId(id);
      setPayee(route.params.payee);
      setTransactionAmount(route.params.transactionAmount.toString());
      setTransactionType(route.params.transactionType);
      setSelectedEnvelope(route.params.envelopeName);
      if (route.params.transactionDate) {
        const date = new Date(route.params.transactionDate);
        setTransactionDate(date); // Set as Date object
      }
      setSelectedAccount(route.params.accountName);
      setNote(route.params.transactionNote);
    }
  }, [id, route.params]);

  // code for setting data in a single object for adding transaction
  const handleAddTransaction = () => {
    const transaction = {
      payee: payee,
      transactionAmount: transactionAmount, 
      transactionType: transactionType,
      envelopeName: selectedEnvelope,
      envelopeRemainingIncome: envelopeRemainingIncome, // now added
      accountName: accountName,
      transactionDate: transactionDate, 
      transactionNote: note,
    };
    console.log('Transaction values to be added:', transaction);
    insertTransaction(transaction);
  };
  
  // code for adding transaction, updating envelope, updating Income table or monthly budget
  const insertTransaction = (transaction) => {
    db.transaction((tx) => {
      // Insert the transaction into the Transactions table
      tx.executeSql(
        `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, envelopeRemainingIncome, accountName, transactionDate, transactionNote) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          transaction.payee,
          transaction.transactionAmount,
          transaction.transactionType,
          transaction.envelopeName,
          transaction.envelopeRemainingIncome,
          transaction.accountName,
          transaction.transactionDate,
          transaction.transactionNote,
        ],
        (_, result) => {
          console.log('Transaction inserted successfully:', result);

          // Now update the corresponding envelope based on the transactionType
          const amount = transaction.transactionAmount;
          const envelopeName = transaction.envelopeName;
          const transactionType = transaction.transactionType;
          // const accountName = transaction.accountName; // for Income table

          // Update the envelope based on the transaction type
          if (transactionType === 'Credit') {
            tx.executeSql(
              `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?;`,
              [amount, envelopeName],
              (_, updateResult) => {
                console.log('Envelope updated successfully for credit:', updateResult);
                navigation.goBack();
              },
              (_, error) => {
                console.error('Error updating envelope for credit:', error.message);
              }
            );
            // to update Income table 
            tx.executeSql(
              `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = 'My Account' AND budgetPeriod = 'Monthly';`,
              [amount],
              (_, updateResult) => {
                console.log('Income table updated successfully for credit:', updateResult);
              },
              (_, error) => {
                console.error('Error updating Income table for credit:', error.message);
              }
            );
          } else if (transactionType === 'Expense') {
            tx.executeSql(
              `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeName = ?;`,
              [amount, envelopeName],
              (_, updateResult) => {
                console.log('Envelope updated successfully for expense:', updateResult);
                navigation.goBack();
              },
              (_, error) => {
                console.error('Error updating envelope for expense:', error.message);
              }
            );
            // to update Income table for expense
            tx.executeSql(
              `UPDATE Income SET budgetAmount = budgetAmount - ? WHERE accountName = 'My Account' AND budgetPeriod = 'Monthly';`,
              [amount],
              (_, updateResult) => {
                console.log('Income table updated successfully for expense:', updateResult);
              },
              (_, error) => {
                console.error('Error updating Income table for expense:', error.message);
              }
            );
          }
        },
        (_, error) => {
          console.error('Error inserting transaction', error.code, error.message);
        }
      );
    });
  };

  // code to delte transaction
  const handleDeleteTransaction = () => {
    if (id) {
      db.transaction((tx) => {
        // First, retrieve the transaction details
        tx.executeSql(
          `SELECT transactionAmount, transactionType, envelopeName FROM Transactions WHERE id = ?;`,
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const { transactionAmount, transactionType, envelopeName } = rows.item(0);

              // Based on transactionType, adjust the envelope amount
              if (transactionType === 'Credit') {
                // If it was a credit, subtract the amount from the envelope
                tx.executeSql(
                  `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeName = ?;`,
                  [transactionAmount, envelopeName],
                  (_, updateResult) => {
                    console.log('Envelope updated successfully for deleted credit:', updateResult);
                  },
                  (_, error) => {
                    console.error('Error updating envelope for deleted credit:', error.message);
                  }
                );
                // Subtract the amount from Income table budgetAmount for "My Account" and "Monthly"
                tx.executeSql(
                  `UPDATE Income SET budgetAmount = budgetAmount - ? WHERE accountName = ? AND budgetPeriod = ?;`,
                  [transactionAmount, "My Account", "Monthly"],
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
                  `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?;`,
                  [transactionAmount, envelopeName],
                  (_, updateResult) => {
                    console.log('Envelope updated successfully for deleted expense:', updateResult);
                  },
                  (_, error) => {
                    console.error('Error updating envelope for deleted expense:', error.message);
                  }
                );
                // Add the amount back to Income table budgetAmount for "My Account" and "Monthly"
                tx.executeSql(
                  `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = ? AND budgetPeriod = ?;`,
                  [transactionAmount, "My Account", "Monthly"],
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
  const handleUpdateTransaction = () => {
    db.transaction((tx) => {
      // Step 1: Fetch existing transaction details
      tx.executeSql(
        `SELECT transactionAmount, transactionType, envelopeName FROM Transactions WHERE id = ?;`,
        [transactionId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const existingTransaction = rows.item(0);
            const { transactionAmount: oldAmount, transactionType: oldType, envelopeName: oldEnvelope } = existingTransaction;

            // Step 2: Revert impact on the old envelope based on old transaction details
            if (oldEnvelope) {
              let revertAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
              tx.executeSql(
                `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?;`,
                [revertAmount, oldEnvelope],
                () => console.log('Reverted impact on old envelope successfully'),
                (error) => console.error('Error reverting impact on old envelope', error)
              );
            }

            // Also, revert impact on the Income table based on the old type
            let revertIncomeAmount = oldType === 'Credit' ? -oldAmount : oldAmount;
            tx.executeSql(
              `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = "My Account" AND budgetPeriod = "Monthly";`,
              [revertIncomeAmount],
              () => console.log('Reverted impact on Income table successfully'),
              (error) => console.error('Error reverting Income table', error)
            );

            // Step 3: Apply impact on the new or updated envelope based on new transaction details
            let newAmountImpact = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
            tx.executeSql(
              `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?;`,
              [newAmountImpact, selectedEnvelope],
              () => console.log('Updated impact on new envelope successfully'),
              (error) => console.error('Error updating new envelope', error)
            );

            // Also, update the Income table based on the new transaction type
            let newIncomeAmount = transactionType === 'Credit' ? transactionAmount : -transactionAmount;
            tx.executeSql(
              `UPDATE Income SET budgetAmount = budgetAmount + ? WHERE accountName = "My Account" AND budgetPeriod = "Monthly";`,
              [newIncomeAmount],
              () => console.log('Updated impact on Income table successfully'),
              (error) => console.error('Error updating Income table', error)
            );

            // Step 4: Update the transaction in the Transactions table
            tx.executeSql(
              `UPDATE Transactions SET payee = ?, transactionAmount = ?, transactionType = ?, envelopeName = ?, envelopeRemainingIncome = ?, accountName = ?, transactionDate = ?, transactionNote = ? WHERE id = ?;`,
              [
                payee,
                transactionAmount,
                transactionType,
                selectedEnvelope,
                envelopeRemainingIncome,
                selectedAccount,
                transactionDate.toISOString(),
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

  return (
    <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
      <StatusBar backgroundColor={colors.munsellgreen} />
      <View>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
          <Appbar.Content
            title={edit_transaction ? "Edit Transaction" : "Add Transaction"}
            titleStyle={styles.appbar_title}
          />
          <Appbar.Action
            onPress={edit_transaction ? handleUpdateTransaction : handleAddTransaction}
            icon="check"
            color={colors.white}
          />   
          {edit_transaction && (
            <Appbar.Action onPress={handleDeleteTransaction} icon="delete" color={colors.white} />
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
                onChangeText={setPayee}
                mode="flat"
                placeholder='Whom did you pay?'
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
        {/* transaction amount and type */}
        <View style={styles.amt_type_view}>
          <View style={styles.amt_view}>
            <Text style={styles.payee_title}>Amount</Text>
            <View style={styles.name_input_view}>
              <View style={styles.input_view}>
                {/* <TextInput
                  value={transactionAmount}
                  onChangeText={handleTransactionAmountChange}
                  mode="flat"
                  placeholder='0.00'
                  style={[
                    styles.input,
                    focusedInput === 'payee' ? styles.focusedInput : {}
                  ]}
                  theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                  textColor={colors.black}
                  dense={true}
                  keyboardType='numeric'
                  onFocus={() => setFocusedInput('transactionAmount')}
                  onBlur={() => setFocusedInput(null)}
                /> */}
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
                  <Text style={styles.selectionText}>{selectedEnvelope || '-Select Envelope-'}</Text>
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
                      setEnvelopeMenuVisible(false);
                      setEnvelopeRemainingIncome(item.filledIncome);
                    }}
                    title={`${item.envelopeName} [${item.filledIncome.toFixed(2) || 0} left]`}
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
                <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleAccountMenuToggle}>
                  <Text style={styles.selectionText}>
                    {selectedAccount
                      ? `[${selectedAccount}] ${budgetAmount}`
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
                    title={`${item.accountName} [${budgetAmount.toFixed(2)} left]`}
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

});
