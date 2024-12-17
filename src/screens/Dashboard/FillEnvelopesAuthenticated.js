import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, ScrollView, Animated, FlatList, Pressable, BackHandler, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Appbar, Button, Checkbox, TextInput, RadioButton, Modal, Portal, Provider, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
import colors from '../../constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { useNavigation, useRoute } from '@react-navigation/native';
import { VectorIcon } from '../../constants/vectoricons';
import { db, fetchTotalEnvelopesAmount, fetchTotalIncome } from '../../database/database';
import Images from '../../constants/images';
import Calculator from '../Onboarding/Calculator';
import CustomProgressBar from '../../components/CustomProgressBar';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import moment from 'moment';

const { width: screenWidth } = dimensions;

const FillEnvelopes = () => {
    const route = useRoute();
    const fill_envelope = route.params?.fill_envelope;
    const navigation = useNavigation();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    // code to get current user id
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(temp_user_id);
    // console.log('value of tempUserId in state', tempUserId);
    useEffect(() => {
        if (isAuthenticated) {
            setTempUserId(user_id);
        } else {
            setTempUserId(temp_user_id);
        }
    }, [isAuthenticated, user_id]);

    // new code no isAuthenticated state as full screen is already in authenticated stack
    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    // to get current month dates and then formate them into our sql date formate
    const [formattedFromDate, setFormattedFromDate] = useState('');
    const [formattedToDate, setFormattedToDate] = useState('');
    // console.log('Formatted From Date in Fill Envelopes:', formattedFromDate);
    // console.log('Formatted To Date in Fill Envelopes:', formattedToDate);

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

    // not being used...
    const [totalBudgetAmount, setTotalBudgetAmount] = useState(0);
    useFocusEffect(() => {
        fetchTotalIncome(setTotalBudgetAmount, tempUserId, formattedFromDate, formattedToDate);
    });

    const [calculatorVisible, setCalculatorVisible] = useState(false);
    const handleValueChange = (customAmount) => {
        setCustomAmount(customAmount);
        setCalculatorVisible(false);
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
        navigation.navigate('Help', { from_fillenvelopes: true });
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
    const [selectedAccount, setSelectedAccount] = useState('My Account');

    const showAccountModal = () => setAccountModalVisible(true);
    const hideAccountModal = () => setAccountModalVisible(false);
    // selected option can be Fill Each Envelope or Keep Unallocated
    const handleSelectAccount = (option) => {
        setSelectedAccount(option);
        hideAccountModal();
    };

    // code for date 
    const [date, setDate] = useState(new Date());
    const formattedFillDate = formatDateSql(date);
    const [show, setShow] = useState(false);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);
    };

    // formate date like this 11/21/2024 just to show on Date field
    const formatDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    };

    // code for getting current year and then formate it
    const startOfYear = moment().startOf('year').toISOString();
    const endOfYear = moment().endOf('year').toISOString();
    const formattedFromDateYearly = formatDateSql(startOfYear);
    const formattedToDateYearly = formatDateSql(endOfYear);
    // console.log(' date of formattedFromDateYearly', formattedFromDateYearly);
    // console.log(' date of formattedToDateYearly', formattedToDateYearly);

    // for flatlist
    const [envelopes, setEnvelopes] = useState([]);
    const [updatedEnvelopes, setUpdatedEnvelopes] = useState([]); // to track updated envelopes using fill individually for authenticated users
    // console.log(' current state of updatedEnvelopes       ==================', updatedEnvelopes);
    // console.log(' current state of envelopes     =======', envelopes);

    const fetchEnvelopes = useCallback(() => {
        getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly]);

    // Use useEffect to call the function on component mount
    useEffect(() => {
        fetchEnvelopes();
    }, [fetchEnvelopes]);


    // function to get all envelopes their rows
    const getAllEnvelopes = (callback, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly) => {
        db.transaction(tx => {
            // const sqlQuery = 'SELECT * FROM envelopes WHERE user_id = ? AND fillDate BETWEEN ? AND ? ORDER BY orderIndex ';
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

    // for showing total sum of all envelopes incomes single sumup of all
    const [totalIncome, setTotalIncome] = useState(0);
    useFocusEffect(
        useCallback(() => {
            fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
        }, [tempUserId, formattedFromDate, formattedToDate, setTotalIncome, formattedFromDateYearly, formattedToDateYearly])
    );

    // useEffect(
    //   useCallback(() => {
    //     fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate);
    //   }, [tempUserId])
    // );

    // Automatically fill all envelopes when selectedOption changes to 'fillAll'
    const [filledIncomes, setFilledIncomes] = useState([]);
    // console.log('values inside filledIncomes', filledIncomes);

    useEffect(() => {
        if (selectedOption === 'Fill Each Envelope' && date) {
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
            fillDate: formattedFillDate,
            user_id: tempUserId,
        }));
        fillAllEnvelopes(incomeRecords, fetchAndLogFilledIncomes);
        // Fetch total envelopes amount after insertion to update the UI
        fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    };

    const fillAllEnvelopes = (incomeRecords, callback) => {
        console.log('Incoming records in fill all envelopes: ', incomeRecords);

        db.transaction(tx => {
            incomeRecords.forEach(record => {
                const { envelopeId, amount, budgetPeriod, envelopeName, filledIncome, fillDate, user_id } = record;
                // console.log('record data to be filled', record);

                // Check if the record exists first
                tx.executeSql(
                    `SELECT * FROM envelopes WHERE envelopeId = ? AND user_id = ?;`,
                    [envelopeId, user_id],
                    (tx, results) => {
                        if (results.rows.length > 0) {
                            // If the record exists, update it
                            console.log(`Updating existing record for envelopeId: ${envelopeId}`);
                            tx.executeSql(
                                `UPDATE envelopes SET envelopeName = ?, amount = ?, budgetPeriod = ?, filledIncome = ?, fillDate = ? WHERE envelopeId = ? AND user_id = ?;`,
                                [envelopeName, amount, budgetPeriod, filledIncome, fillDate, envelopeId, user_id],
                                (tx, results) => {
                                    console.log(`Record updated for envelopeId: ${envelopeId} and user_id: ${user_id}`);
                                },
                                (tx, error) => {
                                    console.error('Error updating record:', error);
                                }
                            );
                        } else {
                            // If the record does not exist, insert a new one
                            console.log(`Inserting new record for envelopeId: ${envelopeId}`);
                            tx.executeSql(
                                `INSERT INTO envelopes (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);`,
                                [envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id],
                                (tx, results) => {
                                    console.log(`New record inserted for envelopeId: ${envelopeId} and user_id: ${user_id}`);
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
                if (callback) callback(tempUserId); // extra check necessary
            });
    };

    const fetchAndLogFilledIncomes = (tempUserId) => {
        db.transaction(tx => {
            tx.executeSql(
                `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id FROM envelopes WHERE user_id = ?;`,
                [tempUserId],
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
                            user_id: item.user_id,
                        });
                    }
                    setFilledIncomes(records)
                    // console.log('Filled Incomes record in FillEnvelopes is:', records);
                },
                (tx, error) => {
                    console.error('Error fetching filled incomes:', error);
                }
            );
        });
    };
    // fill all end here


    // for individually filling
    const [customAmountModal, setCustomAmountModal] = useState(false);
    const [selectedEnvelope, setSelectedEnvelope] = useState(null);
    const [customAmountOption, setCustomAmountOption] = useState('noChange');
    const [customAmount, setCustomAmount] = useState('');
    // console.log('values inside customAmount                =============', customAmount);
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
        console.log('Selected Envelope:', selectedEnvelope); // here fillDate is null and filledIncome is null and we have to fill it
        const envelopeId = selectedEnvelope.envelopeId;
        const envelopeName = selectedEnvelope.envelopeName;
        const amount = selectedEnvelope.amount;
        const budgetPeriod = selectedEnvelope.budgetPeriod;
        // console.log('value of tempUserId in handledone when it is called is: ', tempUserId);
        let filledIncome;
        if (customAmountOption === 'noChange') {
            closeModal();
            return;
        }
        if (customAmountOption === 'equalAmount') {
            filledIncome = selectedEnvelope.amount;
        } else if (customAmountOption === 'customAmount' && customAmount) {
            filledIncome = parseFloat(customAmount);
            console.log('Custom amount option is customAmount, filledIncome set to:', filledIncome);
        }

        // if (filledIncome !== undefined) {
        //   handleFillIndividual(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
        //   fetchAndLogIndividualIncomes(tempUserId);
        // }

        if (filledIncome !== undefined) {
            // Update the selected envelope's filledIncome here
            // const updatedEnvelope = {
            //   ...selectedEnvelope,
            //   filledIncome,
            // };
            // console.log('Updated Envelope:', updatedEnvelope);
            // console.log('Previous updatedEnvelopes:', updatedEnvelopes);
            // setUpdatedEnvelopes(prev => [...prev, updatedEnvelope]); // Track updated envelope
            // console.log('Updated updatedEnvelopes:', [...updatedEnvelopes, updatedEnvelope]);

            // **Deduplication Logic Start**
            // Check if an envelope with the same envelopeId and fillDate already exists in the updatedEnvelopes array
            const existingEnvelopeIndex = updatedEnvelopes.findIndex(
                (env) => env.envelopeId === envelopeId && env.fillDate === formattedFillDate
            );

            if (existingEnvelopeIndex !== -1) {
                // If envelope already exists, update only the filledIncome
                const updatedEnvelope = {
                    ...updatedEnvelopes[existingEnvelopeIndex],
                    filledIncome,
                };

                const newEnvelopes = [...updatedEnvelopes];
                newEnvelopes[existingEnvelopeIndex] = updatedEnvelope;

                setUpdatedEnvelopes(newEnvelopes); // Replace the old state with updated envelopes
                console.log('Envelope updated to avoid duplication:', updatedEnvelope);
            } else {
                // If envelope does not already exist, add it to the state
                setUpdatedEnvelopes(prev => [...prev, { ...selectedEnvelope, filledIncome }]);
                console.log('New envelope added to updatedEnvelopes:', { ...selectedEnvelope, filledIncome });
            }
            // **Deduplication Logic End**


            handleFillIndividual(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
            fetchAndLogIndividualIncomes(tempUserId);
        } else {
            console.log('Filled income is undefined, skipping update.');
        }

        closeModal();
    };

    const handleFillIndividual = (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId) => {
        console.log('input values for individual fill of envelope:', envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
        fillIndividualEnvelope(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
        // Fetch total envelopes amount after insertion to update the UI
        fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    };


    const fillIndividualEnvelope = (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId, callback) => {
        console.log('value of tempUserId inside fillIndividualEnvelope: ', tempUserId);
        db.transaction(
            (tx) => {
                // Check if the record exists first
                tx.executeSql(
                    `SELECT * FROM envelopes WHERE envelopeId = ? AND user_id = ?;`,
                    [envelopeId, tempUserId],
                    (tx, results) => {
                        if (results.rows.length > 0) {
                            // If the record exists, update it
                            console.log(`Updating existing record for envelopeId: ${envelopeId}`);
                            tx.executeSql(
                                `UPDATE envelopes 
                SET envelopeName = ?, amount = ?, budgetPeriod = ?, filledIncome = ?, fillDate = ?, user_id = ? 
                WHERE envelopeId = ?;`,
                                [envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId, envelopeId],
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
                                `INSERT INTO envelopes (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?);`,
                                [envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId],
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
                console.log('Success: Insert/Update individually');
                if (callback) callback(tempUserId); // extra check same like for above we do but necessary
            }
        );
    };


    const fetchAndLogIndividualIncomes = (tempUserId) => {
        console.log('value of tempUserId inside fetchAndLogIndividualIncomes: ', tempUserId);
        db.transaction(tx => {
            tx.executeSql(
                `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id FROM envelopes WHERE user_id = ?;`, // Add `user_id` here
                [tempUserId],
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
                            user_id: item.user_id,
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
            // Do nothing if the user is authenticated
            if (isAuthenticated) {
                return; // Exit early if the condition is met
            }
            // Check if selectedOption is "Keep Unallocated"
            if (selectedOption === "Keep Unallocated") {
                // Execute the SQL query to clear filledIncome and fillDate
                db.transaction(tx => {
                    tx.executeSql(
                        'UPDATE envelopes SET filledIncome = 0, fillDate = NULL WHERE user_id = ?;',
                        [tempUserId],
                        // () => console.log('All filledIncome and fillDate values cleared successfully'),
                        // console.log('after running fetcha and log individual in clear effect'),
                        fetchAndLogIndividualIncomes(tempUserId),
                        (_, error) => {
                            console.log('Error clearing filledIncome and fillDate values:', error);
                            return true;
                        }
                    );
                });
            }
        }, [selectedOption, tempUserId]) // Dependency array ensures effect runs when selectedOption changes
    );


    // query for updating unallocatedIncome in Unallocated table
    // const updateUnallocatedIncome = (unallocatedIncome, fillDate, tempUserId) => {
    //     tx.executeSql(
    //         `UPDATE Unallocated 
    //      SET envelopeName = 'Available', unallocatedIncome = ?, fillDate = ?, user_id = ?`,
    //         [unallocatedIncome, fillDate, tempUserId],
    //         () => console.log('Unallocated data updated successfully'),
    //         (_, error) => {
    //             console.log('Error updating Unallocated data:', error);
    //             return true;
    //         }
    //     );
    // };

    // query for getting total unallocattedIncome
    // tx.executeSql(
    //     `SELECT SUM(unallocatedIncome) as totalUnallocatedIncome 
    //  FROM Unallocated 
    //  WHERE user_id = ?`,
    //     [tempUserId],
    //     (_, result) => {
    //         const totalUnallocatedIncome = result.rows.item(0).totalUnallocatedIncome || 0;
    //         console.log('Total Unallocated Income:', totalUnallocatedIncome);
    //     },
    //     (_, error) => {
    //         console.log('Error fetching Unallocated data:', error);
    //         return true;
    //     }
    // );


    const [payee, setPayee] = useState('');
    const [focusedInputAmount, setFocusedInputAmount] = useState(false);
    const [unallocatedIncome, setUnallocatedIncome] = useState('');
    // console.log('unallocatedIncome   ==================', unallocatedIncome);

    const [selectedButton, setSelectedButton] = useState('newIncome');
    const handleNewIncomePress = () => {
        setSelectedButton('newIncome');
        console.log('FROM NEW INCOME button pressed');
    };

    const handleUnallocatedPress = () => {
        setSelectedButton('unallocated');
        console.log('FROM UNALLOCATED button pressed');
    };

    // calculator for unallocatedIncome
    const [calculatorVisibleUAI, setCalculatorVisibleUAI] = useState(false);
    const handleValueChangeUAI = (income) => {
        console.log('income inside function handleValueChangeUAI       ===========', income);
        setUnallocatedIncome(income);
        setCalculatorVisibleUAI(false);
    };

    const [totalUnallocatedIncome, setTotalUnallocatedIncome] = useState(0);
     const getUnallocatedIncome = (userId) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT SUM(unallocatedIncome) as totalUnallocatedIncome 
             FROM Unallocated 
             WHERE user_id = ?`,
            [userId],
            (_, result) => {
              const totalUnallocatedIncome = result.rows.item(0)?.totalUnallocatedIncome || 0;
              console.log('Total Unallocated Income:', totalUnallocatedIncome);
                setTotalUnallocatedIncome(totalUnallocatedIncome);
            },
            (_, error) => {
              console.log('Error fetching Unallocated income:', error);
              Alert.alert('Error', 'Failed to fetch unallocated income data.');
              return true;
            }
          );
        }, error => {
          console.log('Transaction Error:', error);
        });
      };
    
      // Call the query whenever the screen is focused
      useFocusEffect(
        React.useCallback(() => {
          if (tempUserId) {
            getUnallocatedIncome(tempUserId);
          }
        }, [tempUserId])
      );


    return (
        <TouchableWithoutFeedback style={{ flex: 1 }} onPress={isTooltipVisible ? handleOutsidePress : null}>
            <View style={styles.container}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content
                        title="Fill Envelopes"
                        titleStyle={styles.appbar_title} />
                    <Appbar.Action
                        // onPress={handleCheckPress} 
                        icon="check"
                        color={colors.white}
                    />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>
                <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity onPress={handleTooltipPress}>
                        <Text style={styles.tooltipText}>Help</Text>
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView style={styles.scroll_view}>

                    <View style={styles.top_buttons_view}>
                        <Button
                            mode="contained"
                            onPress={handleNewIncomePress}
                            // style={styles.new_income_btn}
                            style={[
                                styles.new_income_btn,
                                selectedButton === 'newIncome' && styles.selectedButton
                            ]}
                            labelStyle={styles.button_text}
                        >
                            FROM NEW INCOME
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleUnallocatedPress}
                            // style={styles.unallocated_btn}
                            style={[
                                styles.unallocated_btn,
                                selectedButton === 'unallocated' && styles.selectedButton
                            ]}
                            labelStyle={styles.button_text}
                        >
                            FROM UNALLOCATED
                        </Button>
                    </View>

                    <View style={styles.fill_from_view}>
                        <Text style={styles.fill_from_text}>
                            {selectedButton === 'newIncome' ? 'Fill from New Income' : 'Fill from Unallocated'}
                        </Text>
                    </View>

                    {selectedButton === 'newIncome' && (
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>Received From</Text>
                        <TextInput
                            value={payee}
                            onChangeText={setPayee}
                            mode="flat"
                            placeholder='"My Employer" or "Paycheck"'
                            placeholderTextColor={colors.gray}
                            style={[
                                styles.input_payee,
                                focusedInput === 'payee' ? styles.focusedInput_payee : {}
                            ]}
                            theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                            textColor={colors.black}
                            dense={true}
                            // onFocus={() => setFocusedInput('payee')}
                            onFocus={() => {
                                setFocusedInput('payee');       // Set the focused input
                                setFocusedInputAmount(false);    // Set the other state to false
                            }}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    )}

                    {selectedButton === 'unallocated' && (
                        <View style={styles.how_to_fill_view}>
                            <Text style={styles.title}>Description</Text>
                            <TextInput
                                value={payee}
                                onChangeText={setPayee}
                                mode="flat"
                                placeholder='Monthly Envelope Fill'
                                placeholderTextColor={colors.gray}
                                style={[
                                    styles.input_payee,
                                    focusedInput === 'payee' ? styles.focusedInput_payee : {}
                                ]}
                                theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                textColor={colors.black}
                                dense={true}
                                // onFocus={() => setFocusedInput('payee')}
                                onFocus={() => {
                                    setFocusedInput('payee');       // Set the focused input
                                    setFocusedInputAmount(false);    // Set the other state to false
                                }}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>
                    )}

                    {selectedButton === 'newIncome' && (
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>How to fill Envelopes</Text>
                        <TouchableOpacity 
                        style={styles.selectionView} 
                            onPress={() => {
                                showModal();               // Call the showModal function
                                setFocusedInputAmount(false); // Set your state to false
                            }}
                        // onPress={showModal}
                        >
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

                                    <TouchableOpacity onPress={() => handleSelectOption("Fill Each Envelope")} style={styles.htf_radioButton}>
                                        <RadioButton color={colors.brightgreen} value="Fill Each Envelope" />
                                        <Text style={styles.htf_radio_texts}>Fill Each Envelope</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleSelectOption("Keep Unallocated")} style={styles.htf_radioButton}>
                                        <RadioButton color={colors.brightgreen} value="Keep Unallocated" />
                                        <Text style={styles.htf_radio_texts}>Keep Unallocated</Text>
                                    </TouchableOpacity>
                                </RadioButton.Group>
                            </Modal>
                        </Portal>
                    </View>
                    )}

                    {(selectedButton === 'newIncome' || selectedButton === 'unallocated') && (
                        <>
                            {selectedButton === 'newIncome' && selectedOption && (
                            <View style={styles.how_to_fill_view}>

                                <View style={styles.amt_view_income}>
                                    <Text style={styles.payee_title_income}>Amount</Text>
                                    <View style={styles.name_input_view_income}>
                                        <View style={styles.input_view_income}>
                                            <TouchableWithoutFeedback
                                                onPressIn={() => {
                                                    setFocusedInputAmount(true);
                                                }}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    setCalculatorVisibleUAI(true);
                                                }}>
                                                <View style={[styles.touchable_input, focusedInputAmount ? styles.touchable_focusedInput : styles.touchable_input]}>
                                                    <Text style={{ color: colors.black, fontSize: hp('2.5%') }}>{unallocatedIncome || '0.00'}</Text>
                                                </View>
                                            </TouchableWithoutFeedback>
                                        </View>
                                    </View>
                                </View>

                                {/* <Text style={styles.title}>Amount</Text>
                                <View style={styles.selectionView}>
                                    <Text style={styles.selectionText}>{totalIncome}.00</Text>
                                </View> */}
                            </View>
                            )}

                            {selectedButton === 'newIncome' &&  selectedOption &&(
                            <View style={styles.how_to_fill_view}>
                                <Text style={styles.title}>Account</Text>
                                <TouchableOpacity 
                                style={styles.selectionView} 
                                    onPress={() => {
                                        showAccountModal();        // Call the showAccountModal function
                                        setFocusedInputAmount(false); // Set the custom amount focus to false
                                    }}
                                // onPress={showAccountModal}
                                >
                                    <Text style={styles.selectionText}>
                                        {/* older taking value from sum of all income amounts from Income table */}
                                        {/* {selectedAccount ? `${selectedAccount} [${totalBudgetAmount}]` : 'Select Account'} */}
                                        {/* new taking value from sum of all envelopes filledIncome from envelopes table */}
                                        {selectedAccount ? `${selectedAccount}` : 'Select Account'}
                                    </Text>
                                    <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
                                </TouchableOpacity>
                                <Portal>
                                    <Modal visible={accountModalVisible} onDismiss={hideAccountModal} contentContainerStyle={styles.htf_modalContainer}>
                                        <View style={styles.htf_modalContent}>
                                            <Text style={styles.htf_modalText}>Account</Text>
                                        </View>
                                        <RadioButton.Group onValueChange={handleSelectAccount} value={selectedAccount}>
                                            <TouchableOpacity onPress={() => handleSelectAccount("My Account")} style={styles.htf_radioButton}>
                                                <RadioButton color={colors.brightgreen} value="My Account" />
                                                <Text style={styles.htf_radio_texts}>My Account</Text>
                                            </TouchableOpacity>
                                            {/* <View style={styles.htf_radioButton}>
                                                <RadioButton color={colors.brightgreen} value="My Account" />
                                                <Text style={styles.htf_radio_texts}>My Account</Text>
                                            </View>

                                            <TouchableOpacity onPress={() => handleSelectAccount("Debit Account")} style={styles.htf_radioButton}>
                                                <RadioButton color={colors.brightgreen} value="Debit Account" />
                                                <Text style={styles.htf_radio_texts}>Debit Account</Text>
                                            </TouchableOpacity>
                                            <View style={styles.htf_radioButton}>
                                                <RadioButton color={colors.brightgreen} value="Debit Account" />
                                                <Text style={styles.htf_radio_texts}>Debit Account</Text>
                                            </View> */}
                                        </RadioButton.Group>
                                    </Modal>
                                </Portal>
                            </View>
                            )}

                            {selectedButton === 'unallocated' && (
                            <View style={styles.incomes_view}>
                                {/* First View */}
                                <View style={styles.equalSection}>
                                    <View style={styles.row}>
                                            <Text style={totalUnallocatedIncome < 0 ? styles.boldText_total_income : styles.boldText}>{totalUnallocatedIncome}.00</Text>
                                        <Text style={styles.grayText}>Left Unallocated</Text>
                                    </View>
                                </View>

                                {/* Second View */}
                                <View style={styles.equalSection}>
                                    {/* First Row */}
                                    <View style={styles.row}>
                                            <Text style={styles.boldText}>-200.00</Text>
                                        <Text style={styles.grayText}>Currently Unallocated</Text>
                                    </View>

                                    {/* Second Row */}
                                    <View style={styles.row}>
                                            <Text style={styles.boldText}>0.00</Text>
                                        <Text style={styles.grayText}>Used this Fill</Text>
                                    </View>
                                </View>
                            </View>
                            )}

                            {(selectedOption || selectedButton === 'unallocated') && (
                            <View style={styles.how_to_fill_view}>
                                <Text style={styles.title}>Date</Text>
                                <TouchableOpacity
                                    style={styles.dueDateInput}
                                    onPress={() => setShow(true)}
                                >
                                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                                    <VectorIcon name="arrow-drop-down" size={20} color={colors.gray} type="mi" />
                                </TouchableOpacity>
                            </View>
                            )}
                            {show && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={onChange}
                                />
                            )}

                            {(selectedOption === 'Fill Each Envelope' || selectedButton === 'unallocated') && (
                                <View style={styles.budget_period_view}>
                                    <Text style={styles.monthly_txt}>Your Envelopes</Text>
                                </View>
                            )}

                            {/* fill each envelope using unallocatedIncome even we set or not we just update that unallocatedIncome in table */}
                            {selectedOption === 'Fill Each Envelope' && selectedButton === 'newIncome' && (
                                <>

                                    {/* <FlatList
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
                                                            <Text style={styles.item_text_amount}><Text style={styles.budgeted_amount}>Add budgeted amount of {filledIncome}.00 </Text></Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        }}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.flatListContainer}
                                    /> */}

                                    {/* this is for filling each envelope */}
                                    <FlatList
                                        data={envelopes}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => {
                                            // console.log('Rendering item:', item); // Log the current item being rendered

                                            // const filledIncome = individualIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;
                                            // const amount = item.amount;

                                            const updatedEnvelope = updatedEnvelopes.find(envelope => envelope.envelopeId === item.envelopeId);
                                            console.log('Updated Envelope:', updatedEnvelope); // Log the updated envelope if found
                                            const filledIncome = updatedEnvelope ? updatedEnvelope.filledIncome : 0; // Show updated filledIncome, else 0
                                            const amount = item.amount;
                                            // console.log('Amount for envelope:', item.envelopeId, 'is:', amount); // Log amount value

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
                                                                        <Text style={styles.budgeted_amount}>Add budgeted amount of {filledIncome}.00 </Text>
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

                            {/* keep unallocated so dont show flatlist with envelopes place unallocatedIncome directly in table */}
                            {selectedButton === 'unallocated' && (
                                <>
                                    <FlatList
                                        data={envelopes}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => {
                                            // console.log('Rendering item:', item); // Log the current item being rendered

                                            // const filledIncome = individualIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;
                                            // const amount = item.amount;

                                            const updatedEnvelope = updatedEnvelopes.find(envelope => envelope.envelopeId === item.envelopeId);
                                            // console.log('Updated Envelope:', updatedEnvelope); // Log the updated envelope if found
                                            const filledIncome = updatedEnvelope ? updatedEnvelope.filledIncome : 0; // Show updated filledIncome, else 0
                                            const amount = item.amount;
                                            // console.log('Amount for envelope:', item.envelopeId, 'is:', amount); // Log amount value

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
                                                                        <Text style={styles.budgeted_amount}>Add budgeted amount of {filledIncome}.00 </Text>
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

                <Calculator
                    visible={calculatorVisibleUAI}
                    textInputValue={unallocatedIncome}
                    onValueChange={handleValueChangeUAI}
                    onClose={() => setCalculatorVisibleUAI(false)}
                />
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
        marginBottom: hp('2%'),
        // backgroundColor: 'green',
    },

    top_buttons_view: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: hp('1.5%'),
        marginVertical: hp('1.5%'),
    },
    new_income_btn: {
        flex: 1,
        backgroundColor: colors.gray,
        borderRadius: 2,
        marginRight: 3,
        paddingHorizontal: 0,
    },
    unallocated_btn: {
        flex: 1,
        backgroundColor: colors.gray,
        borderRadius: 2,
        marginLeft: 3,
        paddingHorizontal: 0,
    },
    button_text: {
        color: 'white',
        fontSize: hp('1.6%'),
        fontWeight: '600',
    },
    selectedButton: {
        backgroundColor: colors.androidbluebtn,
    },

    fill_from_view: {
        flex: 1,
        paddingVertical: hp('0.7%'),
        flexDirection: 'row',
        backgroundColor: colors.lightGray,
    },
    fill_from_text: {
        fontSize: hp('2%'),
        color: colors.black,
        marginLeft: 5,
        fontWeight: 'bold',
    },

    // styles for textinput
    input_payee: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    focusedInput_payee: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },

    // css for amount toucablview
    amt_view_income: {
        flex: 1,
    },
    payee_title_income: {
        fontSize: hp('2%'),
        color: colors.gray,
        marginTop: hp('1%'),
    },
    name_input_view_income: {
        flexDirection: 'row',
    },
    input_view_income: {
        flex: 1,
        flexDirection: 'row',
    },
    input_income: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    focusedInput_income: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },
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

    // styles for incomes view
    incomes_view: {
        flexDirection: 'row',
        marginHorizontal: hp('1.5%'),
        // backgroundColor: 'green',
        overflow: 'hidden',
        paddingTop: hp('1%'),
        paddingBottom: hp('0%'),
    },
    equalSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap', 
    },
    boldText_total_income: {
        fontSize: hp('1.8%'),
        color: 'red',
        marginRight: 5,
        fontWeight: '500',
    },
    boldText: {
        fontSize: hp('1.8%'),
        color: 'gray',
        marginRight: 5,
        fontWeight: '500',
    },
    grayText: {
        fontSize: hp('1.7%'),
        color: 'gray',
        flexShrink: 1,
    },


    // date view styles
    dueDateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        color: 'black',
        marginTop: 8,
        // backgroundColor: 'magenta',
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
    budgeted_amount: {
        color: colors.gray,
        fontWeight: '500',
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
