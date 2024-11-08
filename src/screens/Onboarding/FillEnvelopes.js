import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, ScrollView, Animated, FlatList, Pressable, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Appbar, Button, Checkbox, TextInput, RadioButton, Modal, Portal, Provider, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
import colors from '../../constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VectorIcon } from '../../constants/vectoricons';
import { db, fetchTotalEnvelopesAmount, fetchTotalIncome } from '../../database/database';
import Images from '../../constants/images';
import Calculator from './Calculator';
import CustomProgressBar from '../../components/CustomProgressBar';

const { width: screenWidth } = dimensions;

const FillEnvelopes = () => {
  const route = useRoute();
  const fill_envelope = route.params?.fill_envelope;
  const navigation = useNavigation();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const [totalBudgetAmount, setTotalBudgetAmount] = useState(0);
  useFocusEffect(() => {
    fetchTotalIncome(setTotalBudgetAmount);
  });

  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const handleValueChange = (customAmount) => {
    setCustomAmount(customAmount);
    setCalculatorVisible(false);
  };

  const [visible, setVisible] = React.useState(false);
  const [checked, setChecked] = React.useState(true);
  const toggleMenu = () => setVisible(!visible);

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
  };

  const handleTooltipPress = () => {
    toggleTooltip();
    navigation.navigate('About');
  };

  // code related to account selection
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  // console.log('selected option is: ', selectedOption);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  const handleSelectOption = (option) => {
    setSelectedOption(option);
    hideModal();
  };

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');

  const showAccountModal = () => setAccountModalVisible(true);
  const hideAccountModal = () => setAccountModalVisible(false);
  const handleSelectAccount = (option) => {
    setSelectedAccount(option);
    hideAccountModal();
  };

  // code for date 
  const [date, setDate] = useState(new Date());
  // console.log('todays date is: ', date);
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  // for flatlist
  const [envelopes, setEnvelopes] = useState([]);
  // console.log('envelopes', envelopes);

  const fetchEnvelopes = useCallback(() => {
    getAllEnvelopes(setEnvelopes);
  }, []);

  // Use useEffect to call the function on component mount
  useEffect(() => {
    fetchEnvelopes();
  }, [fetchEnvelopes]); // Add fetchEnvelopes as a dependency


  // function to get all envelopes their rows
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

  // for showing total sum of all envelopes incomes single sumup of all
  const [totalIncome, setTotalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setTotalIncome);
    }, [])
  );

  // Automatically fill all envelopes when selectedOption changes to 'fillAll'
  const [filledIncomes, setFilledIncomes] = useState([]);

  useEffect(() => {
    if (selectedOption === 'Fill ALL Envelopes' && date) {
      handleFillAll();
    }
  }, [selectedOption, date]);

  const handleFillAll = () => {
    const incomeRecords = envelopes.map(envelope => ({
      envelopeId: envelope.envelopeId,
      amount: envelope.amount,
      budgetPeriod: envelope.budgetPeriod,
      envelopeName: envelope.envelopeName,
      filledIncome: envelope.amount,
      fillDate: date,
    }));
    fillAllEnvelopes(incomeRecords, fetchAndLogFilledIncomes);
  };

  const fillAllEnvelopes = (incomeRecords, callback) => {
    console.log('Incoming records in fill all envelopes: ', incomeRecords);

    db.transaction(tx => {
      incomeRecords.forEach(record => {
        const { envelopeId, amount, budgetPeriod, envelopeName, filledIncome, fillDate } = record;
        console.log('record data to be filled', record);

        // Check if the record exists first
        tx.executeSql(
          `SELECT * FROM envelopes WHERE envelopeId = ?;`,
          [envelopeId],
          (tx, results) => {
            if (results.rows.length > 0) {
              // If the record exists, update it
              console.log(`Updating existing record for envelopeId: ${envelopeId}`);
              tx.executeSql(
                `UPDATE envelopes SET envelopeName = ?, amount = ?, budgetPeriod = ?, filledIncome = ?, fillDate = ? WHERE envelopeId = ?;`,
                [envelopeName, amount, budgetPeriod, filledIncome, fillDate, envelopeId],
                (tx, results) => {
                  console.log(`Record updated for envelopeId: ${envelopeId}`);
                },
                (tx, error) => {
                  console.error('Error updating record:', error);
                }
              );
            } else {
              // If the record does not exist, insert a new one
              console.log(`Inserting new record for envelopeId: ${envelopeId}`);
              tx.executeSql(
                `INSERT INTO envelopes (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate) VALUES (?, ?, ?, ?, ?, ?);`,
                [envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate],
                (tx, results) => {
                  console.log(`New record inserted for envelopeId: ${envelopeId}`);
                },
                (tx, error) => {
                  console.error('Error inserting new record:', error);
                }
              );
            }
          },
          (tx, error) => {
            console.error('Error checking for existing record:', error);
          }
        );
      });
    },
      (error) => {
        console.error('Transaction error:', error);
      },
      () => {
        console.log('success : insert/update');
        if (callback) callback();
      });
  };

  const fetchAndLogFilledIncomes = () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate FROM envelopes;`,
        [],
        (tx, results) => {
          const rows = results.rows;
          let records = [];

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            records.push({
              envelopeId: item.envelopeId,
              envelopeName: item.envelopeName,
              amount: item.amount,
              budgetPeriod: item.budgetPeriod,
              filledIncome: item.filledIncome,
              fillDate: item.fillDate,
            });
          }
          setFilledIncomes(records)
          // console.log('Filled Incomes record is:', records);
        },
        (tx, error) => {
          console.error('Error fetching filled incomes:', error);
        }
      );
    });
  };


  // for individually filling
  const [customAmountModal, setCustomAmountModal] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  const [customAmountOption, setCustomAmountOption] = useState('noChange');
  const [customAmount, setCustomAmount] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [individualIncomes, setIndividualIncomes] = useState([]);
  // console.log('individualIncomes state is : ', individualIncomes);

  const openModal = (item) => {
    setSelectedEnvelope(item);
    setCustomAmountModal(true);
  };
  const closeModal = () => {
    setCustomAmountModal(false);
    setCustomAmountOption('nochange');
    setCustomAmount('');
  };

  const handleDone = () => {
    if (!selectedEnvelope) return;
    // console.log('Selected Envelope:', selectedEnvelope); here fillDate is null and filledIncome is null and we have to fill it
    const envelopeId = selectedEnvelope.envelopeId;
    const envelopeName = selectedEnvelope.envelopeName;
    const amount = selectedEnvelope.amount;
    const budgetPeriod = selectedEnvelope.budgetPeriod;
    let filledIncome;
    if (customAmountOption === 'noChange') {
      closeModal();
      return;
    }
    if (customAmountOption === 'equalAmount') {
      filledIncome = selectedEnvelope.amount;
    } else if (customAmountOption === 'customAmount' && customAmount) {
      filledIncome = parseFloat(customAmount);
    }
    if (filledIncome !== undefined) {
      handleFillIndividual(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date);
      fetchAndLogIndividualIncomes();
    }
    closeModal();
  };

  const handleFillIndividual = (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date) => {
    // console.log('input values for individual fill of envelope:', envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date);
    fillIndividualEnvelope(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date);
  };

  // const saveOrUpdateSingleIncome = (selectedEnvelopeName, filledIncome, fillDate, callback) => {
  //   console.log('Parameters:', {
  //     selectedEnvelopeName,
  //     filledIncome,
  //     fillDate
  //   });

  //   db.transaction(tx => {
  //     // First attempt to update the record
  //     tx.executeSql(
  //       `UPDATE FilledIncome SET filledIncome = ?, selectedEnvelopeName = ?, fillDate = ? WHERE envelopeId = ?;`,
  //       [filledIncome, fillDate, selectedEnvelopeName],
  //       (tx, results) => {
  //         // Check if any rows were affected
  //         if (results.rowsAffected > 0) {
  //           console.log(`Record updated for envelopeId: ${envelopeId}`);
  //           console.log(`Updated values - filledIncome: ${filledIncome}, selectedEnvelopeName: ${selectedEnvelopeName}, fillDate: ${fillDate}`);
  //         } else {
  //           // If no rows were affected, insert a new record
  //           console.log(`No record found for envelopeId: ${envelopeId}. Inserting a new record.`);
  //           tx.executeSql(
  //             `INSERT INTO FilledIncome (envelopeId, selectedEnvelopeName, filledIncome, fillDate) VALUES (?, ?, ?, ?);`,
  //             [envelopeId, filledIncome, selectedEnvelopeName, fillDate],
  //             (tx, results) => {
  //               console.log(`New record inserted for envelopeId: ${envelopeId}`);
  //               console.log(`Inserted values - envelopeId: ${envelopeId}, selectedEnvelopeName: ${selectedEnvelopeName}, filledIncome: ${filledIncome}, fillDate: ${fillDate}`);
  //             },
  //             (tx, error) => {
  //               console.error('Error inserting new record:', error);
  //             }
  //           );
  //         }
  //       },
  //       (tx, error) => {
  //         console.error('Error updating record:', error);
  //       }
  //     );
  //   },
  //     (error) => {
  //       console.error('Transaction error:', error);
  //     },
  //     () => {
  //       console.log('Transaction completed.');
  //       if (callback) callback();
  //     });
  // };

  const fillIndividualEnvelope = (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date, callback) => {
    db.transaction(
      (tx) => {
        // Check if the record exists first
        tx.executeSql(
          `SELECT * FROM envelopes WHERE envelopeId = ?;`,
          [envelopeId],
          (tx, results) => {
            if (results.rows.length > 0) {
              // If the record exists, update it
              console.log(`Updating existing record for envelopeId: ${envelopeId}`);
              tx.executeSql(
                `UPDATE envelopes 
               SET envelopeName = ?, amount = ?, budgetPeriod = ?, filledIncome = ?, fillDate = ? 
               WHERE envelopeId = ?;`,
                [envelopeName, amount, budgetPeriod, filledIncome, date, envelopeId],
                (tx, results) => {
                  console.log(`Record updated for envelopeId and record: ${envelopeId}`);
                },
                (tx, error) => {
                  console.error('Error updating record:', error);
                }
              );
            } else {
              // If the record does not exist, insert a new one
              console.log(`Inserting new record for envelopeId: ${envelopeId}`);
              tx.executeSql(
                `INSERT INTO envelopes (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate) 
               VALUES (?, ?, ?, ?, ?, ?);`,
                [envelopeId, envelopeName, amount, budgetPeriod, filledIncome, date],
                (tx, results) => {
                  console.log(`New record inserted for envelopeId: ${envelopeId}`);
                },
                (tx, error) => {
                  console.error('Error inserting new record:', error);
                }
              );
            }
          },
          (tx, error) => {
            console.error('Error checking for existing record:', error);
          }
        );
      },
      (error) => {
        console.error('Transaction error:', error);
      },
      () => {
        console.log('Success: Insert/Update');
        if (callback) callback();
      }
    );
  };


  const fetchAndLogIndividualIncomes = () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate FROM envelopes;`,
        [],
        (tx, results) => {
          const rows = results.rows;
          let records = [];

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            records.push({
              envelopeId: item.envelopeId,
              envelopeName: item.envelopeName,
              amount: item.amount,
              budgetPeriod: item.budgetPeriod,
              filledIncome: item.filledIncome,
              fillDate: item.fillDate,
            });
          }
          setIndividualIncomes(records)
          // console.log('individual filled record is:', records);
        },
        (tx, error) => {
          console.error('Error fetching filled incomes:', error);
        }
      );
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      // Check if selectedOption is "Fill Individually"
      if (selectedOption === "Fill Individually") {
        // Execute the SQL query to clear filledIncome and fillDate
        db.transaction(tx => {
          tx.executeSql(
            'UPDATE envelopes SET filledIncome = 0, fillDate = NULL',
            [],
            // () => console.log('All filledIncome and fillDate values cleared successfully'),
            // console.log('after running fetcha and log individual in clear effect'),
            fetchAndLogIndividualIncomes(),
            (_, error) => {
              console.log('Error clearing filledIncome and fillDate values:', error);
              return true;
            }
          );
        });
      }
    }, [selectedOption]) // Dependency array ensures effect runs when selectedOption changes
  );

  return (
    <TouchableWithoutFeedback style={{ flex: 1 }} onPress={isTooltipVisible ? handleOutsidePress : null}>
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
          <Appbar.Content
            title="Fill Envelopes"
            titleStyle={styles.appbar_title} />
          <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
        </Appbar.Header>
        <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
          <TouchableOpacity onPress={handleTooltipPress}>
            <Text style={styles.tooltipText}>Help</Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.scroll_view}>

          <View style={styles.how_to_fill_view}>
            <Text style={styles.title}>How to fill Envelopes</Text>
            <TouchableOpacity style={styles.selectionView} onPress={showModal}>
              <Text style={styles.selectionText}>{selectedOption}</Text>
              <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
            </TouchableOpacity>
            <Portal>
              <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.htf_modalContainer}>
                <View style={styles.htf_modalContent}>
                  <View style={styles.htf_image_view}>
                    <Image style={styles.htf_modalImage} source={Images.expenseplannerimage} />
                  </View>
                  <View style={styles.htf_how_to_fill_view}>
                    <Text style={styles.htf_modalText}>How do you want to fund your envelopes?</Text>
                  </View>
                </View>
                <RadioButton.Group onValueChange={handleSelectOption} value={selectedOption}>
                  <View style={styles.htf_radioButton}>
                    <RadioButton color={colors.brightgreen} value="Fill ALL Envelopes" />
                    <Text style={styles.htf_radio_texts}>Fill ALL Envelopes</Text>
                  </View>
                  <View style={styles.htf_radioButton}>
                    <RadioButton color={colors.brightgreen} value="Fill Individually" />
                    <Text style={styles.htf_radio_texts}>Fill Individually</Text>
                  </View>
                </RadioButton.Group>
              </Modal>
            </Portal>
          </View>

          {selectedOption && (
            <>
              <View style={styles.how_to_fill_view}>
                <Text style={styles.title}>Amount</Text>
                <View style={styles.selectionView}>
                  <Text style={styles.selectionText}>{totalIncome}</Text>
                </View>
              </View>

              <View style={styles.how_to_fill_view}>
                <Text style={styles.title}>Account</Text>
                <TouchableOpacity style={styles.selectionView} onPress={showAccountModal}>
                  <Text style={styles.selectionText}>
                    {selectedAccount ? `${selectedAccount} [ ${totalBudgetAmount} ]` : 'Select Account'}
                  </Text>
                  <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
                </TouchableOpacity>
                <Portal>
                  <Modal visible={accountModalVisible} onDismiss={hideAccountModal} contentContainerStyle={styles.htf_modalContainer}>
                    <View style={styles.htf_modalContent}>
                      <Text style={styles.htf_modalText}>Account</Text>
                    </View>
                    <RadioButton.Group onValueChange={handleSelectAccount} value={selectedAccount}>
                      <View style={styles.htf_radioButton}>
                        <RadioButton color={colors.brightgreen} value="My Account" />
                        <Text style={styles.htf_radio_texts}>My Account</Text>
                      </View>
                      {/* <View style={styles.htf_radioButton}>
                        <RadioButton color={colors.brightgreen} value="Debit Account" />
                        <Text style={styles.htf_radio_texts}>Debit Account</Text>
                      </View> */}
                    </RadioButton.Group>
                  </Modal>
                </Portal>
              </View>

              <View style={styles.how_to_fill_view}>
                <Text style={styles.title}>Date</Text>
                <TouchableOpacity
                  style={styles.dueDateInput}
                  onPress={() => setShow(true)}
                >
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </TouchableOpacity>
              </View>
              {show && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onChange}
                />
              )}


              {/* your envelopes code */}
              <View style={styles.budget_period_view} >
                <Text style={styles.monthly_txt}>Your Envelopes</Text>
              </View>

              {/* Monthly Envelopes fill all Flatlist sqlite */}
              {selectedOption === 'Fill ALL Envelopes' && (
                <>
                  <FlatList
                    data={envelopes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      // Access the amount directly from item
                      const amount = item.amount;
                      // Find the corresponding filled income value for this envelope
                      const filledIncome = filledIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;

                      return (
                        <View style={styles.item_view}>
                          <TouchableOpacity style={styles.item}>
                            <View style={styles.left_view}>
                              <VectorIcon name="envelope" size={18} color={colors.gray} type="fa" />
                            </View>
                            <View style={styles.right_view}>
                              <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                              <View style={styles.progress_bar_view}>
                                <CustomProgressBar filledIncome={filledIncome} amount={amount} />
                              </View>
                              <Text style={styles.item_text_amount}><Text style={styles.budgeted_amount}>Add budgeted amount of </Text>{filledIncome}</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                    scrollEnabled={false}
                    contentContainerStyle={styles.flatListContainer}
                  />
                </>
              )}

              {/* monthly envelopes fill individual flat list sqlite */}
              {selectedOption === 'Fill Individually' && (
                <>
                  <FlatList
                    data={envelopes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {

                      const filledIncome = individualIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;
                      const amount = item.amount;

                      return (
                        <View style={styles.item_view}>
                          <TouchableOpacity
                            style={styles.item}
                            onPress={() => openModal(item)}
                          >
                            <View style={styles.left_view}>
                              <VectorIcon name="envelope" size={18} color="gray" type="fa" />
                            </View>
                            <View style={styles.right_view}>
                              <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                              <View style={styles.bar_icon_view}>
                                <View style={styles.progress_bar_view}>
                                  <CustomProgressBar filledIncome={filledIncome} amount={amount} />
                                </View>
                                <View style={styles.progress_bar_view_icon}>
                                  <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
                                </View>
                              </View>
                              <Text style={styles.item_text_amount}>
                                {filledIncome ? (
                                  <>
                                    <Text style={styles.budgeted_amount}>Add budgeted amount of </Text>
                                    {filledIncome}
                                  </>
                                ) : (
                                  <Text style={styles.budgeted_amount}>No Change</Text>
                                )}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                    scrollEnabled={false}
                    contentContainerStyle={styles.flatListContainer}
                  />
                </>
              )}
            </>
          )}

        </ScrollView>

        {/* modal for custom amount input   */}
        <Modal visible={customAmountModal} onDismiss={closeModal} contentContainerStyle={styles.modalContainer_ca}>
          <View style={styles.icon_envelope_name}>
            <View style={styles.left_view}>
              <VectorIcon name="envelope" size={20} color="gray" type="fa" />
            </View>
            <Text style={styles.modalTitle_ca}>{selectedEnvelope?.envelopeName}</Text>
          </View>

          <RadioButton.Group onValueChange={value => setCustomAmountOption(value)} value={customAmountOption}>
            {[
              { label: 'No Change', value: 'noChange' },
              {
                label: `Set to Budget Amt (${selectedEnvelope?.amount || ''})`,
                value: 'equalAmount'
              },
              { label: 'Set to Specific Amount', value: 'customAmount' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCustomAmountOption(item.value)}
                style={{ marginLeft: 5, flexDirection: 'row', alignItems: 'center' }}
              >
                <RadioButton
                  value={item.value}
                  color={colors.brightgreen}
                  style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}
                />
                <Text style={{ color: colors.black }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>

          {customAmountOption === 'customAmount' && (
            <View style={styles.input_view}>
              {/* <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                mode="flat"
                placeholder='Amount'
                style={styles.input}
                theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                textColor={colors.black}
                keyboardType='numeric'
                dense={true}
                onFocus={() => setFocusedInput('customAmount')}
                onBlur={() => setFocusedInput(null)}
              /> */}
              <TouchableWithoutFeedback
                onPressIn={() => setFocusedInput(true)}
                onPress={() => {
                  Keyboard.dismiss();
                  setCalculatorVisible(true);
                }}
              >
                <View style={[styles.input, focusedInput ? styles.focusedInput : styles.unfocused]}>
                  <Text style={{ color: colors.black }}>{customAmount || 'Amount'}</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}

          <View style={styles.cancel_done_view}>
            <Button
              mode="text"
              onPress={closeModal}
              style={styles.backButton}
              labelStyle={styles.backText}
              rippleColor={colors.gray}
            >
              Cancel
            </Button>
            <Button
              mode="text"
              onPress={handleDone}
              style={styles.backButton}
              labelStyle={styles.backText}
              rippleColor={colors.gray}
            >
              Done
            </Button>
          </View>
        </Modal>

        <Calculator
          visible={calculatorVisible}
          textInputValue={customAmount}
          onValueChange={handleValueChange}
          onClose={() => setCalculatorVisible(false)}
        />

        {!fill_envelope && (
        <View style={styles.secondView}>
          <View style={styles.left_icon_btn_view}>
            <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii" />
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              // onPress={() => console.log('later press')}
              style={styles.backButton}
              labelStyle={styles.backText}
              rippleColor={colors.gray}
            >
              BACK
            </Button>
          </View>
          <View style={styles.right_icon_btn_view}>
            <Button
              mode="text" // Use 'contained' for a filled button
              onPress={() => navigation.navigate('RegisterAccount')}
              // onPress={() => console.log('later press')}
              style={styles.nextButton}
              labelStyle={styles.nextText}
              rippleColor={colors.gray}
            >
              NEXT
            </Button>
            <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii" />
          </View>
        </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

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
  scroll_view: {
    flex: 1,
    marginBottom: hp('7%'),
    // backgroundColor: 'green',
  },


  how_to_fill_view: {
    // backgroundColor: 'black',
    paddingHorizontal: hp('1.5%'),
  },
  title: {
    fontSize: hp('2%'),
    color: colors.gray,
    marginTop: hp('1%'),
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

  // modal styles for first how to fill modal
  htf_modalContainer: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    paddingHorizontal: hp('2%'),
    width: '85%',
    maxWidth: hp('50%'),
    alignSelf: 'center',
  },
  htf_modalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  htf_image_view: {
    width: hp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  htf_modalImage: {
    width: '90%',
    height: hp('5%'),
    resizeMode: 'contain',
  },
  htf_how_to_fill_view: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 1,
  },
  htf_modalText: {
    fontSize: hp('2.4%'),
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'flex-start',
  },
  htf_radio_texts: {
    fontSize: hp('2.4%'),
    color: colors.black,
  },
  htf_radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1%'),
    flexWrap: 'wrap',
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

  // your envelopes
  budget_period_view: {
    height: hp('5%'),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: wp('3%'),
    marginTop: hp('2%'),
  },
  monthly_txt: {
    fontSize: hp('2%'),
    fontWeight: '500',
    color: colors.black
  },
  //flatlist styles
  item_view: {
    // flexDirection: 'row',
  },
  item: {
    paddingVertical: hp('1%'),
    paddingHorizontal: hp('1.3%'),
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  left_view: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: hp('2%'),
    marginLeft: hp('2%'),
  },
  right_view: {
    flex: 1,
    marginRight: hp('3%'),
  },
  item_text_name: {
    fontSize: hp('2.2%'),
    color: colors.gray,
    fontWeight: '600',
  },
  progress_bar_view: {
    paddingVertical: hp('0.2'),
    flex: 1,
    paddingRight: hp('2%'),
  },
  bar_icon_view: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progress_bar_view_icon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item_text_amount: {
    color: colors.black,
    marginRight: hp('1%'),
  },

  modalContainer_ca: {
    backgroundColor: 'white',
    marginHorizontal: hp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: hp('1%'),
  },
  icon_envelope_name: {
    flexDirection: 'row',
  },
  modalTitle_ca: {
    fontSize: hp('2.5%'),
    color: colors.gray,
    fontWeight: 'bold',

  },
  cancel_done_view: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  input_view: {
    marginHorizontal: hp('2.5%'),
    marginBottom: hp('2%'),
  },
  input: {
    height: hp('5%'),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: hp('2.5%'),
    color: colors.black,
    justifyContent: 'center',
    marginTop: hp('1%'),
  },
  focusedInput: {
    borderBottomWidth: 2,
    borderBottomColor: colors.brightgreen,
  },

  customAmountInput_ca: {
    backgroundColor: 'transparent',
    width: hp('20%'),
    alignSelf: 'center',
    paddingLeft: 0,
  },


  secondView: {
    // backgroundColor: colors.black,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: hp('7%'),
    paddingHorizontal: hp('3%'),
    marginHorizontal: hp('3%'),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  left_icon_btn_view: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  right_icon_btn_view: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  backText: {
    fontSize: hp('2%'),
    color: colors.androidbluebtn,
  },
  nextText: {
    fontSize: hp('2%'),
    color: colors.androidbluebtn,
  },

});

export default FillEnvelopes;
