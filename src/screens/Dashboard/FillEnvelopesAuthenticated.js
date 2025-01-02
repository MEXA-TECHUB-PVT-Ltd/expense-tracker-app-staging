import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, ScrollView, Animated, FlatList, Pressable, BackHandler, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Appbar, Button, Checkbox, TextInput, RadioButton, Modal, Portal, Snackbar, Provider, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
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
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

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

    // for individually filling start
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
        // console.log('Selected Envelope:', selectedEnvelope); // here fillDate is null and filledIncome is null and we have to fill it
        const envelopeId = selectedEnvelope.envelopeId;
        const envelopeName = selectedEnvelope.envelopeName; // was being used in handleFillIndividual when inside handleDone not now
        const amount = selectedEnvelope.amount; // same
        const budgetPeriod = selectedEnvelope.budgetPeriod; // same

        let filledIncome;
        let actionType; // determine whether to "add" or "set" the filledIncome

        if (customAmountOption === 'noChange') {
            closeModal();
            return;
        }
        if (customAmountOption === 'equalAmount') {
            filledIncome = selectedEnvelope.amount;
            actionType = 'set';
        } else if (customAmountOption === 'addToAmount') {
            filledIncome = selectedEnvelope.amount;
            actionType = 'add';
        } else if (customAmountOption === 'customAmount' && customAmount) {
            filledIncome = parseFloat(customAmount);
            actionType = 'set';
        } else if (customAmountOption === 'addToCustomAmount' && customAmount) {
            filledIncome = parseFloat(customAmount);
            actionType = 'add';
        }

        if (filledIncome !== undefined) {
            // **Deduplication and update Logic Start**
            const existingEnvelopeIndex = updatedEnvelopes.findIndex(
                (env) => env.envelopeId === envelopeId && env.fillDate === formattedFillDate
            );

            if (existingEnvelopeIndex !== -1) {
                // If envelope already exists, update only the filledIncome
                const updatedEnvelope = {
                    ...updatedEnvelopes[existingEnvelopeIndex],
                    filledIncome,
                    actionType, // just locally in updatedEnvelopes pass actionType either add or set for queries
                };

                const newEnvelopes = [...updatedEnvelopes];
                const previousFilledIncome = newEnvelopes[existingEnvelopeIndex].filledIncome || 0;
                newEnvelopes[existingEnvelopeIndex] = updatedEnvelope;

                // Update local states
                setUpdatedEnvelopes(newEnvelopes);
                setUsedThisFill((prev) => prev - previousFilledIncome + filledIncome); // to locally show on UI whenever user filles in envelope
                // console.log('Envelope updated to avoid duplication:', updatedEnvelope);
            } else {
                // If envelope does not already exist, add it to the state
                setUpdatedEnvelopes((prev) => [...prev, { ...selectedEnvelope, filledIncome, fillDate: formattedFillDate, actionType }]);
                // Update local state
                setUsedThisFill((prev) => prev + filledIncome); // to locally show on UI whenever user fills in an envelope
                // console.log('New envelope added to updatedEnvelopes:', { ...selectedEnvelope, filledIncome, fillDate: formattedFillDate });
            }
            // **Deduplication and update Logic End**

            // dont call functions directly because we want to update db when check icon is pressed older code
            // handleFillIndividual(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
            // fetchAndLogIndividualIncomes(tempUserId);
        } else {
            console.log('Filled income is undefined, skipping update.');
        }
        closeModal();
    };

    // older code when were calling it in handleDone, immediately update table now not being used
    // const handleFillIndividual = (envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId) => {
    //     // console.log('values for individual fill envelope:', envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
    //     fillIndividualEnvelope(envelopeId, envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId);
    //     // Fetch total envelopes amount after insertion to update the UI
    //     fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    // };


    // second last latest
    // const fillIndividualEnvelope = (
    //     envelopeId,
    //     envelopeName,
    //     amount,
    //     budgetPeriod,
    //     filledIncome,
    //     formattedFillDate,
    //     tempUserId,
    //     callback
    // ) => {
    //     db.transaction(
    //         (tx) => {
    //             // Check if the record exists first
    //             tx.executeSql(
    //                 `SELECT * FROM envelopes WHERE envelopeId = ? AND user_id = ?;`,
    //                 [envelopeId, tempUserId],
    //                 (tx, results) => {
    //                     if (results.rows.length > 0) {
    //                         // If the record exists, update it
    //                         // console.log(`Updating existing record for envelopeId: ${envelopeId}`);
    //                         tx.executeSql(
    //                             `UPDATE envelopes 
    //                         SET envelopeName = ?, amount = ?, budgetPeriod = ?, filledIncome = ?, fillDate = ?, user_id = ? 
    //                         WHERE envelopeId = ?;`,
    //                             [envelopeName, amount, budgetPeriod, filledIncome, formattedFillDate, tempUserId, envelopeId],
    //                             (tx, results) => {
    //                                 // console.log(`Record updated for envelopeId and record: ${envelopeId}`);
    //                             },
    //                             (tx, error) => {
    //                                 console.error('Error updating record:', error);
    //                             }
    //                         );
    //                     } else {
    //                         console.log(`No record found for envelopeId: ${envelopeId}. Update skipped.`);
    //                     }
    //                 },
    //                 (tx, error) => {
    //                     console.error('Error checking for existing record:', error);
    //                 }
    //             );
    //         },
    //         (error) => {
    //             console.error('Transaction error:', error);
    //         },
    //         () => {
    //             console.log('Success: Envelope Update Individually');
    //             if (callback) callback(tempUserId);
    //         }
    //     );
    // };

    // latest fill individual 
    const fillIndividualEnvelope = (
        envelopeId,
        envelopeName,
        amount,
        budgetPeriod,
        filledIncome,
        formattedFillDate,
        tempUserId,
        actionType, // Add actionType parameter
        callback
    ) => {
        db.transaction(
            (tx) => {
                // Check if the record exists first
                tx.executeSql(
                    `SELECT * FROM envelopes WHERE envelopeId = ? AND user_id = ?;`,
                    [envelopeId, tempUserId],
                    (tx, results) => {
                        if (results.rows.length > 0) {
                            // If the record exists, determine the query based on actionType
                            let query = '';
                            let queryParams = [];

                            if (actionType === 'add') {
                                query = `UPDATE envelopes 
                                     SET envelopeName = ?, amount = ?, budgetPeriod = ?, 
                                         filledIncome = filledIncome + ?, fillDate = ?, user_id = ? 
                                     WHERE envelopeId = ?;`;
                                queryParams = [
                                    envelopeName,
                                    amount,
                                    budgetPeriod,
                                    filledIncome, // Add to existing filledIncome
                                    formattedFillDate,
                                    tempUserId,
                                    envelopeId,
                                ];
                            } else if (actionType === 'set') {
                                query = `UPDATE envelopes 
                                     SET envelopeName = ?, amount = ?, budgetPeriod = ?, 
                                         filledIncome = ?, fillDate = ?, user_id = ? 
                                     WHERE envelopeId = ?;`;
                                queryParams = [
                                    envelopeName,
                                    amount,
                                    budgetPeriod,
                                    filledIncome, // Directly set filledIncome
                                    formattedFillDate,
                                    tempUserId,
                                    envelopeId,
                                ];
                            }

                            // Execute the appropriate query
                            tx.executeSql(
                                query,
                                queryParams,
                                (tx, results) => {
                                    console.log(
                                        `Record updated for envelopeId: ${envelopeId} with actionType: ${actionType}`
                                    );
                                },
                                (tx, error) => {
                                    console.error('Error updating record:', error);
                                }
                            );
                        } else {
                            console.log(`No record found for envelopeId: ${envelopeId}. Update skipped.`);
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
                console.log('Success: Envelope Update Individually');
                if (callback) callback(tempUserId);
            }
        );
    };




    const fetchAndLogIndividualIncomes = (tempUserId) => {
        // console.log('value of tempUserId inside fetchAndLogIndividualIncomes: ', tempUserId);
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

    // to clear filledIncome and fillDate in database...i think we dont need this or need to change logic
    // as this was for case where we had common screen fill envelopes 
    // useFocusEffect(
    //     React.useCallback(() => {
    //         // Do nothing if the user is authenticated
    //         if (isAuthenticated) {
    //             return; // Exit early if the condition is met
    //         }
    //         // Check if selectedOption is "Keep Unallocated"
    //         if (selectedOption === "Keep Unallocated") {
    //             // Execute the SQL query to clear filledIncome and fillDate
    //             db.transaction(tx => {
    //                 tx.executeSql(
    //                     'UPDATE envelopes SET filledIncome = 0, fillDate = NULL WHERE user_id = ?;',
    //                     [tempUserId],
    //                     () => console.log('All filledIncome and fillDate values cleared successfully'),
    //                     // console.log('after running fetcha and log individual in clear effect'),
    //                     fetchAndLogIndividualIncomes(tempUserId),
    //                     (_, error) => {
    //                         console.log('Error clearing filledIncome and fillDate values:', error);
    //                         return true;
    //                     }
    //                 );
    //             });
    //         }
    //     }, [selectedOption, tempUserId])
    // );


    // start of new code for two buttons

    const [payee, setPayee] = useState(''); // common for both buttons
    const [focusedInputAmount, setFocusedInputAmount] = useState(false);
    // which we want to add to envelopes or keep in unallocated table (for keep unallocated and fill each envelope scenario)
    const [unallocatedIncome, setUnallocatedIncome] = useState(0);
    // console.log('unallocated -0-0-0-0-0-0-0-: ' + unallocatedIncome);

    const [selectedButton, setSelectedButton] = useState('newIncome');
    const handleNewIncomePress = () => {
        setSelectedButton('newIncome');
        resetStates();
    };

    const handleUnallocatedPress = () => {
        setSelectedButton('unallocated');
        resetStates();
        getUnallocatedIncome(tempUserId);
    };

    // calculator for unallocatedIncome
    const [calculatorVisibleUAI, setCalculatorVisibleUAI] = useState(false);
    const handleValueChangeUAI = (income) => {
        setUnallocatedIncome(income);
        setCalculatorVisibleUAI(false);
    };

    const [totalUnallocatedIncome, setTotalUnallocatedIncome] = useState(0); // from db
    const [leftUnallocated, setLeftUnallocated] = useState(0); // left unallocated local state initially equal to value from db
    // console.log('value of left unallocated: =====', leftUnallocated);
    const [usedThisFill, setUsedThisFill] = useState(0); // track locally whatever we filled in all envelopes individually as sum of all
    

    // Recalculate leftUnallocated whenever usedThisFill changes
    // useEffect(() => {
    //     setLeftUnallocated(totalUnallocatedIncome - usedThisFill);
    // }, [usedThisFill, totalUnallocatedIncome]);

    // Recalculate leftUnallocated whenever totalUnallocatedIncome or unallocatedIncome changes initially uallocatedIncome state is 0
    // we are finally updating it in Unallocated table

    useFocusEffect(
        useCallback(() => {
            const combinedUnallocated = totalUnallocatedIncome + Number(unallocatedIncome || 0);
            setLeftUnallocated(combinedUnallocated - usedThisFill);
        }, [usedThisFill, totalUnallocatedIncome, unallocatedIncome])
    );

    // to resert local states values
    const resetStates = () => {
        setUsedThisFill(0);
        setUnallocatedIncome(0);
        setUpdatedEnvelopes([]);
        setLeftUnallocated(totalUnallocatedIncome);
    };

    const getUnallocatedIncome = (userId) => {
        db.transaction(tx => {
            tx.executeSql(
                `SELECT unallocatedIncome 
       FROM Unallocated 
       WHERE user_id = ?`,
                [userId],
                (_, result) => {
                    // Dynamically handle rows
                    const totalUnallocatedIncome = result.rows.length > 0
                        ? result.rows.item(0).unallocatedIncome
                        : 0;

                    // console.log('Total Unallocated Income:', totalUnallocatedIncome);
                    setTotalUnallocatedIncome(totalUnallocatedIncome);
                    setLeftUnallocated(totalUnallocatedIncome); // initially set the left unallocated to total unallocated income from db
                },
                (_, error) => {
                    console.log('Error fetching Unallocated income:', error);
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

    const handleCheckPress = () => {
        if (selectedButton === 'newIncome') {
            if (!selectedOption) {
                if (!payee) {
                    setOptionsSnackbarVisible(true);
                    return;
                }
            }
            if (!selectedOption) {
                setHowToFillSnackbarVisible(true);
                return;
            }
        }
        if (selectedOption === 'Keep Unallocated') {
            if (!payee) {
                setPayeeSnackbarVisible(true);
                return;
            }
            if (!unallocatedIncome) {
                setOptionsSnackbarVisible(true);
                return;
            }
            const amountToFill = unallocatedIncome;
            const fillDate = formattedFillDate;
            const userId = tempUserId;

            if (userId && amountToFill) {
                updateUnallocatedIncome(amountToFill, fillDate, userId); // works correctly
            }
            handleAddTransactionKU();

        } else if (selectedOption === 'Fill Each Envelope') {
            if (!payee) {
                setPayeeSnackbarVisible(true);
                return;
            }

            const unallocated = unallocatedIncome; // income we are adding as new income
            const remainingUnallocated = leftUnallocated; // income that is leftover after filling envelopes & we want it as unallocated
            const usedthisFill = usedThisFill; // for scenario two... amount that is one time filled in envelopes
            // const totalUnallocated = totalUnallocatedIncome; // for scenario two... now dont need  initially remaingin unallocated income from db
            const fillDate = formattedFillDate;
            const userId = tempUserId;

            // Scenario 1: Set amount but don't fill envelopes (update unallocatedIncome)
            if (
                remainingUnallocated &&
                updatedEnvelopes.every(envelope => envelope.filledIncome === undefined) &&
                updatedEnvelopes.length === 0 // Additional condition for case when just opened app and yet state is empty to keep it at false
            ) {
                // If no envelope is filled and unallocatedEnvelopes is empty, just add the amount to the unallocatedIncome
                if (userId && remainingUnallocated) {
                    updateUnallocatedIncomeFU(remainingUnallocated, fillDate, userId); // Works correctly
                }
                handleAddTransactionFee(); // add transaction also...it will work same like for keep unallocated..check values to pass to it...
            }

            // Scenario 2: Don't set amount but fill envelopes (update envelopes and then unallocatedIncome)
            else if (unallocated === 0 && usedthisFill !== undefined) {
                // If envelopes are filled but amount is not set, update envelopes
                updatedEnvelopes.forEach((envelope) => {
                    const { envelopeId, envelopeName, amount, budgetPeriod, filledIncome, actionType } = envelope;
                    if (filledIncome !== undefined) {
                        fillIndividualEnvelope(
                            envelopeId,
                            envelopeName,
                            amount,
                            budgetPeriod,
                            filledIncome,
                            formattedFillDate,
                            tempUserId,
                            actionType
                        );
                    }
                });

                // no need for this as we already did this and leftUnallocated has final value we need to set in table Unallocated
                // Get the current unallocated income from your state (totalUnallocatedIncome)
                // const currentUnallocatedIncome = totalUnallocated || 0;
                // Calculate the remaining unallocated income after filling envelopes
                // const remainingUnallocated = currentUnallocatedIncome - usedthisFill;

                // Update the unallocated income in the database
                if (userId && remainingUnallocated !== undefined) {
                    updateUnallocatedIncomeFU(remainingUnallocated, formattedFillDate, userId); // set or insert unallocated amount not update  works correctly
                }
                handleAddTransactionFee(); // also add transaction for it...
            }

            // Scenario 3: Set amount and also fill envelopes (update both envelopes and unallocatedIncome)
            else if (unallocated && updatedEnvelopes.some(envelope => envelope.filledIncome !== undefined)) {
                // Fill envelopes with the specified amounts
                updatedEnvelopes.forEach((envelope) => {
                    const { envelopeId, envelopeName, amount, budgetPeriod, filledIncome, actionType } = envelope;
                    if (filledIncome !== undefined) {
                        fillIndividualEnvelope(
                            envelopeId,
                            envelopeName,
                            amount,
                            budgetPeriod,
                            filledIncome,
                            formattedFillDate,
                            tempUserId,
                            actionType
                        );
                    }
                });

                // also now dont need it as already did it final state is leftUallocated
                // After filling the envelopes, update the unallocated income with the remaining unallocated amount
                // const remainingUnallocated = leftUnallocated + (unallocatedIncome - usedThisFill); // Subtract the used fill amount

                if (userId && remainingUnallocated !== undefined) {
                    updateUnallocatedIncomeFU(remainingUnallocated, formattedFillDate, userId); // verify if we need to run this too...
                }

                handleAddTransactionFee();
                navigation.navigate('TopTab'); // navigate if necessary like if not navigated in functions above..
            }
        } else if (selectedButton === 'unallocated') {

            const remainingUnallocated = leftUnallocated;
            const fillDate = formattedFillDate;
            const userId = tempUserId;

            if (!payee) {
                setOptionsSnackbarVisible(true);
                return;
            } else {
                updatedEnvelopes.forEach((envelope) => {
                    const { envelopeId, envelopeName, amount, budgetPeriod, filledIncome, actionType } = envelope;
                    // Only update those envelopes where filledIncome is set
                    if (filledIncome !== undefined) {
                        fillIndividualEnvelope(
                            envelopeId,
                            envelopeName,
                            amount,
                            budgetPeriod,
                            filledIncome,
                            formattedFillDate,
                            tempUserId,
                            actionType
                        );
                    }
                });
                fetchAndLogIndividualIncomes(tempUserId);
                if (userId && remainingUnallocated !== undefined && remainingUnallocated !== null) {
                    updateUnallocatedIncomeFU(remainingUnallocated, fillDate, userId); // works correctly
                }

                handleAddTransaction(); // only this one is extra like which is for addinga a transaction also....

                navigation.navigate('TopTab');
            }
        } else {
            console.log('No option selected.');
        }
    };


    // for keep unallocated insert or update unallocated income in db
    const updateUnallocatedIncome = (amountToFill, fillDate, userId) => {
        db.transaction(tx => {
            // Check if a record exists for the given user_id
            tx.executeSql(
                `SELECT * FROM Unallocated WHERE user_id = ?`,
                [userId],
                (_, result) => {
                    if (result.rows.length > 0) {
                        // Record exists, update unallocatedIncome
                        tx.executeSql(
                            `UPDATE Unallocated 
                        SET unallocatedIncome = unallocatedIncome + ?, 
                            fillDate = ? 
                        WHERE user_id = ?`,
                            [amountToFill, fillDate, userId],
                            () => {
                                // console.log('Unallocated amount updated successfully for new income');
                                navigation.navigate('TopTab');
                            },
                            (_, error) => console.log('Error updating Unallocated data:', error)
                        );
                    } else {
                        // Record does not exist, insert a new record
                        tx.executeSql(
                            `INSERT INTO Unallocated (envelopeName, unallocatedIncome, fillDate, user_id) 
                        VALUES (?, ?, ?, ?)`,
                            ['Available', amountToFill, fillDate, userId],
                            () => {
                                console.log('Unallocated amount inserted successfully');
                                navigation.navigate('TopTab');
                            },
                            (_, error) => console.log('Error inserting Unallocated data:', error)
                        );
                    }
                },
                (_, error) => console.log('Error fetching Unallocated data:', error)
            );
        }, error => {
            console.log('Transaction Error:', error);
        });
    };

    // for fill individual envelope but only update unallocated table not set it
    // const updateUnallocatedIncomeFIE = (remainingUnallocated, fillDate, userId) => {
    //     db.transaction(tx => {
    //         // Check if a record exists for the given user_id
    //         tx.executeSql(
    //             `SELECT * FROM Unallocated WHERE user_id = ?`,
    //             [userId],
    //             (_, result) => {
    //                 if (result.rows.length > 0) {
    //                     // Record exists, update unallocatedIncome
    //                     tx.executeSql(
    //                         `UPDATE Unallocated 
    //                     SET unallocatedIncome = unallocatedIncome + ?, 
    //                         fillDate = ? 
    //                     WHERE user_id = ?`,
    //                         [remainingUnallocated, fillDate, userId],
    //                         () => {
    //                             // console.log('Unallocated amount updated successfully for new income');
    //                             navigation.navigate('TopTab');
    //                         },
    //                         (_, error) => console.log('Error updating Unallocated data:', error)
    //                     );
    //                 } else {
    //                     // Record does not exist, insert a new record
    //                     tx.executeSql(
    //                         `INSERT INTO Unallocated (envelopeName, unallocatedIncome, fillDate, user_id) 
    //                     VALUES (?, ?, ?, ?)`,
    //                         ['Available', remainingUnallocated, fillDate, userId],
    //                         () => {
    //                             console.log('Unallocated amount inserted successfully');
    //                             navigation.navigate('TopTab');
    //                         },
    //                         (_, error) => console.log('Error inserting Unallocated data:', error)
    //                     );
    //                 }
    //             },
    //             (_, error) => console.log('Error fetching Unallocated data:', error)
    //         );
    //     }, error => {
    //         console.log('Transaction Error:', error);
    //     });
    // };

    // for From Unallocated directly set
    const updateUnallocatedIncomeFU = (remainingUnallocated, fillDate, userId) => {
        db.transaction(tx => {
            // Check if a record exists for the given user_id
            tx.executeSql(
                `SELECT * FROM Unallocated WHERE user_id = ?`,
                [userId],
                (_, result) => {
                    // console.log('Unallocated data  ==================:', result);
                    if (result.rows.length > 0) {
                        // Record exists, update unallocatedIncome with leftUnallocated
                        tx.executeSql(
                            `UPDATE Unallocated 
                        SET unallocatedIncome = ?, 
                            fillDate = ? 
                        WHERE user_id = ?`,
                            [remainingUnallocated, fillDate, userId],
                            () => {
                                // console.log('Unallocated amount updated successfully for from unallocated');
                                navigation.navigate('TopTab');
                            },
                            (_, error) => console.log('Error updating Unallocated data:', error)
                        );
                    } else {
                        // Record does not exist, insert a new record with leftUnallocated
                        tx.executeSql(
                            `INSERT INTO Unallocated (envelopeName, unallocatedIncome, fillDate, user_id) 
                        VALUES (?, ?, ?, ?)`,
                            ['Available', remainingUnallocated, fillDate, userId],
                            () => {
                                console.log('Unallocated amount inserted successfully');
                                navigation.navigate('TopTab');
                            },
                            (_, error) => console.log('Error inserting Unallocated data:', error)
                        );
                    }
                },
                (_, error) => console.log('Error fetching Unallocated data:', error)
            );
        }, error => {
            console.log('Transaction Error:', error);
        });
    };

    const [payeeSnackbarVisible, setPayeeSnackbarVisible] = useState(false);
    const [optionsSnackbarVisible, setOptionsSnackbarVisible] = useState(false);
    const [howToFillSnackbarVisible, setHowToFillSnackbarVisible] = useState(false);

    // all code that is to add transactions...start here
    // From unallocated option
    const { transaction, editOrdelete } = route.params; // when we will try to edit or delete transactions on basis of groupId
    // console.log(editOrdelete);
    console.log('full log of transaction : =-=-=-=-=-=-= ', transaction);
    useEffect(() => {
        if (transaction) {
            const { payee, selectedButton, selectedOption, envelopeDetails, transactionAmount } = transaction;

            setPayee(payee);
            setSelectedButton(selectedButton || null);
            setSelectedOption(selectedOption || null);

            // Parse envelopeDetails and set it in updatedEnvelopes
            if (envelopeDetails) {
                try {
                    const parsedEnvelopes = JSON.parse(envelopeDetails);
                    setUpdatedEnvelopes(parsedEnvelopes); // Set parsed envelope details

                    // Calculate the sum of filledIncome from all envelopes
                    // this is used when try to update transaction for case where we have two transactions...
                    const totalFilledIncome = parsedEnvelopes.reduce((sum, envelope) => {
                        return sum + (envelope.filledIncome || 0);
                    }, 0);
                    setUsedThisFill(totalFilledIncome);

                } catch (error) {
                    console.error('Error parsing envelopeDetails:', error);
                }
            }

            // Check conditions for setting unallocatedIncome
            if (selectedButton === "newIncome" && selectedOption === "Fill Each Envelope") {
                setUnallocatedIncome(transactionAmount);
            }

            // Set usedThisFill with transactionAmount
            // setUsedThisFill(transactionAmount); directly set see where it could be used
            // also see this where it could be used
            // if (!envelopeDetails) {
            //     setUsedThisFill(transactionAmount);
            // }
        }
    }, [transaction]);

    // second last code where it was just inserting transaction when just set payee
    // const handleAddTransaction = () => {
    //     const transactionType = usedThisFill <= 0 ? 'Expense' : 'Credit';
    //     const transaction = {
    //         payee: payee,
    //         transactionAmount: usedThisFill,
    //         transactionType: transactionType,
    //         envelopeName: 'Distribution',
    //         transactionDate: formattedFillDate,  // currently selected date
    //         user_id: tempUserId,
    //         navigationScreen: 'fillEnvelops', 
    //     };
    //     // console.log('All values in transaction array while inserting transaction: ', transaction);
    //     // Serialize the updatedEnvelopes array to store in envelopeDetails column
    //     const envelopeDetails = JSON.stringify(updatedEnvelopes);
    //     // console.log('All envelopes in json formate as envelopeDetails: ', envelopeDetails);
    //     // Call the insertTransaction function and pass the serialized envelopeDetails
    //     insertTransaction(transaction, envelopeDetails);
    // };

    // const insertTransaction = (transaction, envelopeDetails) => {
    //     db.transaction((tx) => {
    //         // Insert the transaction into the Transactions table, now without filledAmount
    //         tx.executeSql(
    //             `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, user_id, navigationScreen, envelopeDetails) 
    //         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    //             [
    //                 transaction.payee,
    //                 transaction.transactionAmount,
    //                 transaction.transactionType,
    //                 transaction.envelopeName,
    //                 transaction.transactionDate,
    //                 transaction.user_id,
    //                 transaction.navigationScreen || null, // default null if navigationScreen is not provided
    //                 envelopeDetails, // Pass the serialized envelopeDetails
    //             ],
    //             (_, result) => {
    //                 console.log('Transaction inserted successfully with envelope details.');
    //             },
    //             (_, error) => {
    //                 console.error('Transaction failed. Error code:', error.code, 'Error message:', error.message);
    //             }
    //         );
    //     });
    // };


    //...all code that is to add transactions...end here


    // latest code in which for From Unallocated add transactions for all scenarios...
    const handleAddTransaction = () => {
        const groupId = uuidv4(); // Generate a unique groupId for linking transactions

        // Check if usedThisFill is zero or positive/negative
        if (usedThisFill === 0 && (!updatedEnvelopes || updatedEnvelopes.length === 0)) {
            // Case 1: No envelopes filled, just set payee
            const transaction = {
                payee: payee,
                transactionAmount: usedThisFill,
                transactionType: 'Expense', // When no envelopes are filled, it's an 'Expense'
                envelopeName: 'Distribution',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId,  // Group ID links the transaction
                selectedButton: selectedButton,
                selectedOption: selectedOption || null,
            };

            // Serialize the envelope details as empty (because no envelopes are filled)
            const envelopeDetails = JSON.stringify([]);

            // Insert the transaction
            insertTransaction(transaction, envelopeDetails);

        } else if (updatedEnvelopes && usedThisFill === 0) {
            // New Case: Envelopes filled but their sum is zero
            const transaction = {
                payee: payee,
                transactionAmount: usedThisFill,
                transactionType: 'Expense', // Treated as an 'Expense'
                envelopeName: 'Distribution',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId,  // Group ID links the transaction
                selectedButton: selectedButton,
                selectedOption: selectedOption || null,
            };

            // Serialize the envelope details
            const envelopeDetails = JSON.stringify(updatedEnvelopes);

            // Insert the single transaction
            insertTransaction(transaction, envelopeDetails);

        } else if (usedThisFill > 0 || usedThisFill < 0) {
            // Case 2: Envelopes filled and usedThisFill > 0 or < 0
            // Second transaction for 'Available' (Insert it first for order in Transactions screen)
            const secondTransaction = {
                payee: payee,
                transactionAmount: usedThisFill,
                transactionType: usedThisFill > 0 ? 'Expense' : 'Credit', // Reverse the transaction type if negative
                envelopeName: '(Available)',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId, // Same group ID for both transactions
                selectedButton: selectedButton,
                selectedOption: selectedOption || null,
            };

            // First transaction for 'Distribution' (Insert it second just for showing it up in Transactions screen)
            const firstTransaction = {
                payee: payee,
                transactionAmount: usedThisFill,
                transactionType: usedThisFill > 0 ? 'Credit' : 'Expense', // Credit if positive, Expense if negative
                envelopeName: 'Distribution',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId, // Same group ID for both transactions
                selectedButton: selectedButton, // Pass selectedButton state
                selectedOption: selectedOption || null, 
            };

            // Serialize the envelope details as required (since we are filling envelopes)
            const envelopeDetails = JSON.stringify(updatedEnvelopes);
            // console.log('envelopeDetails that are in group as json formate =0=0=0=0=0=0=0', envelopeDetails);

            // Insert both transactions, with Available first
            insertTransaction(secondTransaction, envelopeDetails);
            insertTransaction(firstTransaction, envelopeDetails);
        }
    };

    const insertTransaction = (transaction, envelopeDetails) => {
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, user_id, navigationScreen, envelopeDetails, groupId, selectedButton, selectedOption)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    transaction.payee,
                    transaction.transactionAmount,
                    transaction.transactionType,
                    transaction.envelopeName,
                    transaction.transactionDate,
                    transaction.user_id,
                    transaction.navigationScreen || null, // default null if navigationScreen is not provided
                    envelopeDetails, // Pass the serialized envelopeDetails
                    transaction.groupId,  // Pass the groupId for linking
                    transaction.selectedButton || null, // Pass selectedButton state (or null if empty)
                    transaction.selectedOption || null,
                ],
                (_, result) => {
                    console.log('Transaction inserted successfully with envelope details.');
                },
                (_, error) => {
                    console.error('Transaction failed. Error code:', error.code, 'Error message:', error.message);
                }
            );
        });
    };

    // update/delete code related to ==========  From Unallocated  ==========
    // handle function for updating firstly old values and then new values when updating a transaction

    // both work perfectly fine to just update envelopes filledIncome
    // function handleUpdateTransaction(transaction) {
    //     // Log the transaction object to see its structure
    //     console.log(' all values inside transaction to take values out of it -0-0-0-0-0-0-0-0-0-0-',transaction);

    //     // Check if transaction and envelopeDetails are defined
    //     if (!transaction || !transaction.envelopeDetails) {
    //         console.error('Transaction or envelopeDetails is undefined');
    //         return; // Exit the function if the necessary data is not available
    //     }

    //     const { envelopeDetails, user_id } = transaction;

    //     // Parse the envelopeDetails JSON string into an array of objects
    //     let envelopes;
    //     try {
    //         envelopes = JSON.parse(envelopeDetails);
    //     } catch (error) {
    //         console.error('Error parsing envelopeDetails:', error);
    //         return; // Exit the function if parsing fails
    //     }

    //     // Prepare the data object to pass to the update function
    //     const data = {
    //         envelopes: envelopes,
    //         user_id: user_id
    //     };

    //     // Call the function to update the envelopes
    //     updateEnvelopesFilledIncome(data);
    // }
    // function updateEnvelopesFilledIncome(data) {
    //     const { envelopes, user_id } = data;

    //     // Start a transaction for updating envelopes
    //     db.transaction((tx) => {
    //         envelopes.forEach((envelope) => {
    //             const { envelopeId, filledIncome } = envelope;

    //             // Determine whether we should add or subtract from the filledIncome
    //             let updateAmount = Math.abs(filledIncome); // Always work with positive values for update

    //             // Construct the SQL query to update the filledIncome for the envelope
    //             const query = filledIncome < 0
    //                 ? `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ? AND user_id = ?`  // If negative, add it
    //                 : `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ? AND user_id = ?`;  // If positive, subtract it

    //             // Execute the SQL query for each envelope
    //             tx.executeSql(
    //                 query,
    //                 [updateAmount, envelopeId, user_id],
    //                 (tx, results) => {
    //                     console.log(`Updated filledIncome for envelopeId: ${envelopeId} by amount: ${updateAmount}`);
    //                 },
    //                 (tx, error) => {
    //                     console.error('Error updating envelope filledIncome:', error);
    //                 }
    //             );
    //         });
    //     },
    //         (error) => {
    //             console.error('Transaction error for updating filledIncome:', error);
    //         },
    //         () => {
    //             console.log('Success: Envelope FilledIncome Updated');
    //         });
    // }

    // works fine along with updating envelopes also update unallocated
    // function handleUpdateTransaction(transaction) {
    //     // Log the transaction object to see its structure
    //     console.log(' all values inside transaction to take values out of it -0-0-0-0-0-0-0-0-0-0-', transaction);

    //     // Check if transaction and envelopeDetails are defined
    //     if (!transaction || !transaction.envelopeDetails) {
    //         console.error('Transaction or envelopeDetails is undefined');
    //         return; // Exit the function if the necessary data is not available
    //     }

    //     const { envelopeDetails, user_id, transactionAmount } = transaction;

    //     // Parse the envelopeDetails JSON string into an array of objects
    //     let envelopes;
    //     try {
    //         envelopes = JSON.parse(envelopeDetails);
    //     } catch (error) {
    //         console.error('Error parsing envelopeDetails:', error);
    //         return; // Exit the function if parsing fails
    //     }

    //     // Prepare the data object to pass to the update function
    //     const data = {
    //         envelopes: envelopes,
    //         user_id: user_id,
    //         transactionAmount: transactionAmount
    //     };

    //     // Call the function to update the envelopes and unallocated income
    //     updateEnvelopesFilledIncome(data);
    // }
    // function updateEnvelopesFilledIncome(data) {
    //     const { envelopes, user_id, transactionAmount } = data;

    //     // Start a transaction for updating envelopes
    //     db.transaction((tx) => {
    //         // First, update the envelopes' filledIncome based on the envelopes array
    //         envelopes.forEach((envelope) => {
    //             const { envelopeId, filledIncome } = envelope;

    //             // Determine whether we should add or subtract from the filledIncome
    //             let updateAmount = Math.abs(filledIncome); // Always work with positive values for update

    //             // Construct the SQL query to update the filledIncome for the envelope
    //             const query = filledIncome < 0
    //                 ? `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ? AND user_id = ?`  // If negative, add it
    //                 : `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ? AND user_id = ?`;  // If positive, subtract it

    //             // Execute the SQL query for each envelope
    //             tx.executeSql(
    //                 query,
    //                 [updateAmount, envelopeId, user_id],
    //                 (tx, results) => {
    //                     console.log(`Updated filledIncome for envelopeId: ${envelopeId} by amount: ${updateAmount}`);
    //                 },
    //                 (tx, error) => {
    //                     console.error('Error updating envelope filledIncome:', error);
    //                 }
    //             );
    //         });

    //         // Now, update the Unallocated table based on the transactionAmount
    //         let unallocatedUpdateAmount = Math.abs(transactionAmount); // Always work with positive values for update

    //         const unallocatedQuery = transactionAmount < 0
    //             ? `UPDATE Unallocated SET unallocatedIncome = unallocatedIncome + ? WHERE user_id = ?`  // If negative, increase it
    //             : `UPDATE Unallocated SET unallocatedIncome = unallocatedIncome - ? WHERE user_id = ?`;  // If positive, decrease it

    //         // Execute the SQL query for Unallocated table
    //         tx.executeSql(
    //             unallocatedQuery,
    //             [unallocatedUpdateAmount, user_id],
    //             (tx, results) => {
    //                 console.log(`Updated unallocatedIncome for user_id: ${user_id} by amount: ${unallocatedUpdateAmount}`);
    //             },
    //             (tx, error) => {
    //                 console.error('Error updating unallocatedIncome:', error);
    //             }
    //         );
    //     },
    //         (error) => {
    //             console.error('Transaction error for updating filledIncome and unallocatedIncome:', error);
    //         },
    //         () => {
    //             console.log('Success: Envelope FilledIncome and Unallocated Income Updated');
    //             navigation.navigate('TopTab');
    //         });
    // }

    // this along with envelopes old unallocated old also update envelopes new unallocated new and transaction new values
    // may be working expectidely but yes it update values of tables...envelopes, Transactions, Unallocated
    function handleUpdateTransaction(transaction) {
        // console.log('Transaction details:', transaction);
        if (!transaction || !transaction.envelopeDetails) {
            console.error('Transaction or envelopeDetails is undefined');
            return;
        }
        const { envelopeDetails, user_id, transactionAmount, groupId } = transaction;
        let envelopes;
        try {
            envelopes = JSON.parse(envelopeDetails);
        } catch (error) {
            console.error('Error parsing envelopeDetails:', error);
            return;
        }
        const data = {
            envelopes,
            user_id,
            transactionAmount,
            groupId, // Adding this to use in Transactions table updates
            // for new values
            updatedEnvelopes,
            usedThisFill,
            payee,
        };
        // Call the function to update envelopes, unallocated, and transactions
        updateEnvelopesAndTables(data);
    }
    function updateEnvelopesAndTables(data) {
        const { envelopes, user_id, transactionAmount, groupId, updatedEnvelopes, usedThisFill, payee } = data;
        console.log('Envelopes ==================:', envelopes);
        console.log('Updated Envelopes ==========:', updatedEnvelopes);
        console.log('Used This Fill =============:', usedThisFill);
        console.log('Payee ======================:', payee);
        // query that reverses filledIncome that was already in transaction for each envelope
        db.transaction(
            (tx) => {
                // Updating the envelopes' filledIncome based on existing transaction details
                envelopes.forEach((envelope) => {
                    const { envelopeId, filledIncome } = envelope;
                    console.log('filledIncome for envelopes like that is from transaction variable:', filledIncome);

                    // let updateAmount = Math.abs(filledIncome);
                    let updateAmount = filledIncome;  // removed abs function
                    const query =
                        filledIncome < 0
                            ? `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ? AND user_id = ?`
                            : `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ? AND user_id = ?`;

                    tx.executeSql(
                        query,
                        [updateAmount, envelopeId, user_id],
                        (tx, results) => {
                            console.log(`Updated filledIncome for envelopeId: ${envelopeId}`);
                        },
                        (tx, error) => {
                            console.error('Error updating envelope filledIncome:', error);
                        }
                    );
                });

                // query for Updating Unallocated table based on existing transactionAmount reverses
                // let unallocatedUpdateAmount = Math.abs(transactionAmount);
                let unallocatedUpdateAmount = transactionAmount; // removed abs function

                const unallocatedQuery =
                    transactionAmount < 0
                        ? `UPDATE Unallocated SET unallocatedIncome = unallocatedIncome + ? WHERE user_id = ?`
                        : `UPDATE Unallocated SET unallocatedIncome = unallocatedIncome - ? WHERE user_id = ?`;

                tx.executeSql(
                    unallocatedQuery,
                    [unallocatedUpdateAmount, user_id],
                    (tx, results) => {
                        console.log(`Updated unallocatedIncome for user_id: ${user_id}`);
                    },
                    (tx, error) => {
                        console.error('Error updating unallocatedIncome:', error);
                    }
                );

                // query to update new values of filledIncome in envelopes table
                updatedEnvelopes.forEach((newEnvelope) => {
                    const { envelopeId, filledIncome } = newEnvelope;

                    tx.executeSql(
                        `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeId = ? AND user_id = ?`,
                        [filledIncome, envelopeId, user_id],
                        (tx, results) => {
                            console.log(`Added filledIncome for envelopeId: ${envelopeId}`);
                        },
                        (tx, error) => {
                            console.error('Error adding filledIncome for new envelope:', error);
                        }
                    );
                });

                // query to update new usedThisFill amount as transacitonAmount in Unallocated table
                if (usedThisFill) {
                    tx.executeSql(
                        `UPDATE Unallocated SET unallocatedIncome = unallocatedIncome + ? WHERE user_id = ?`,
                        [usedThisFill, user_id],
                        (tx, results) => {
                            console.log(`Updated unallocatedIncome with new transactionAmount for user_id: ${user_id}`);
                        },
                        (tx, error) => {
                            console.error('Error updating unallocatedIncome for new transactionAmount:', error);
                        }
                    );
                }

                // Updating Transactions table for the groupId also payee
                tx.executeSql(
                    `UPDATE Transactions 
                        SET transactionAmount = ?,
                        transactionDate = ?, 
                        payee = ? 
                        WHERE groupId = ? AND user_id = ?`,
                    [
                        usedThisFill,
                        new Date().toISOString(),
                        payee,
                        groupId,
                        user_id
                    ],
                    (tx, results) => {
                        console.log(`Updated Transactions table for groupId: ${groupId} and payee: ${payee}`);
                    },
                    (tx, error) => {
                        console.error('Error updating Transactions table:', error);
                    }
                );

                // Convert updatedEnvelopes to a JSON string
                const updatedEnvelopesJSON = JSON.stringify(updatedEnvelopes);
                // Query to directly and completely update envelopeDetails for the specific groupId and user_id
                const updateTransactionQuery = `
                    UPDATE Transactions
                    SET envelopeDetails = ?
                    WHERE groupId = ? AND user_id = ?`;

                // Execute the update query
                tx.executeSql(
                    updateTransactionQuery,
                    [updatedEnvelopesJSON, groupId, user_id],
                    (tx, results) => {
                        console.log(`Successfully updated envelopeDetails for groupId: ${groupId}, user_id: ${user_id}`);
                    },
                    (tx, error) => {
                        console.error('Error updating envelopeDetails in Transactions table:', error);
                    }
                );

            },
            (error) => {
                console.error('Transaction error:', error);
            },
            () => {
                console.log('Success: Envelopes, Unallocated, and Transactions updated.');
                navigation.navigate('TopTab');
            }
        );
    }

    // code to update transaction end here for From Unallocated

    // Handle function for reverting envelopes and unallocated income
    const handleDeleteTransaction = (transaction) => {
        const {
            envelopeDetails,
            transactionAmount,
            groupId,
            user_id,
        } = transaction;

        if (!envelopeDetails || !user_id || !groupId || transactionAmount == null) {
            console.error('Missing required transaction data.');
            return;
        }

        const envelopeArray = JSON.parse(envelopeDetails);
        console.log('all values in envelopeArray especially filledIncome: ', envelopeArray);
        envelopeArray.forEach(({ envelopeId, filledIncome }) => {
            if (envelopeId && filledIncome !== undefined) {
                // Revert the exact filledIncome for each envelope
                updateEnvelopeFilledIncome(envelopeId, filledIncome, user_id);
            }
        });
        adjustUnallocatedIncome(transactionAmount, user_id);
        deleteTransactionGroup(groupId);
    };

    // Update filledIncome for individual envelopes
    const updateEnvelopeFilledIncome = (envelopeId, revertAmount, userId) => {
        db.transaction(
            (tx) => {
                // Determine whether to add or subtract based on the sign of revertAmount
                const query = revertAmount < 0
                    ? `UPDATE envelopes SET filledIncome = filledIncome + ABS(?) WHERE envelopeId = ? AND user_id = ?;`
                    : `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeId = ? AND user_id = ?;`;

                tx.executeSql(
                    query,
                    [Math.abs(revertAmount), envelopeId, userId],
                    (tx, results) => {
                        console.log(`Updated filledIncome for envelopeId: ${envelopeId} by amount: ${revertAmount}`);
                    },
                    (tx, error) => {
                        console.error('Error updating envelope filledIncome:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for updating filledIncome:', error);
            },
            () => {
                console.log('Success: Envelope FilledIncome Updated');
            }
        );
    };

    // Adjust the unallocated income based on the transactionAmount
    const adjustUnallocatedIncome = (transactionAmount, userId) => {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    `UPDATE Unallocated
                 SET unallocatedIncome = unallocatedIncome + ?
                 WHERE envelopeName = 'Available' AND user_id = ?;`,
                    [transactionAmount, userId],
                    (tx, results) => {
                        console.log(`Updated unallocatedIncome by amount: ${transactionAmount}`);
                    },
                    (tx, error) => {
                        console.error('Error updating Unallocated income:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for updating Unallocated income:', error);
            },
            () => {
                console.log('Success: Unallocated Income Updated');
            }
        );
    };

    // Delete the transaction group based on groupId
    const deleteTransactionGroup = (groupId) => {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    `DELETE FROM transactions
                    WHERE groupId = ?;`,
                    [groupId],
                    (tx, results) => {
                        console.log(`Deleted transaction group with groupId: ${groupId}`);
                        navigation.navigate('TopTab');
                    },
                    (tx, error) => {
                        console.error('Error deleting transaction group:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for deleting transaction group:', error);
            },
            () => {
                console.log('Success: Transaction Group Deleted');
            }
        );
    };
    // code of transactions end here for scenario of From Unallocated

    // =========  keep unallocated  ========= insert start
    const handleAddTransactionKU = () => {
        // Check if the transaction is "Credit" or "Expense"
        const transactionType = unallocatedIncome <= 0 ? 'Expense' : 'Credit';
        // Create the transaction object
        const transaction = {
            payee: payee,
            transactionAmount: unallocatedIncome,  // Use unallocatedIncome instead of usedThisFill
            transactionType: transactionType,
            envelopeName: 'My Account',  // Set this dynamically for Unallocated
            transactionDate: formattedFillDate,  // Currently selected date
            user_id: tempUserId,  // Pass the correct user ID
            navigationScreen: 'fillEnvelops',  // Set screen for navigation context
            selectedButton: selectedButton,
            selectedOption: selectedOption,
        };
        // console.log('Transaction details when inserting for keep unallocated;;;;;: ', transaction);
        insertTransactionKU(transaction);
    };

    const insertTransactionKU = (transaction) => {
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, user_id, navigationScreen, selectedButton, selectedOption)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    transaction.payee,
                    transaction.transactionAmount,
                    transaction.transactionType,
                    transaction.envelopeName,
                    transaction.transactionDate,
                    transaction.user_id,
                    transaction.navigationScreen || null,
                    transaction.selectedButton || null,
                    transaction.selectedOption || null,
                ],
                (_, result) => {
                    console.log('Transaction inserted successfully without envelope details.');
                },
                (_, error) => {
                    console.error('Transaction failed. Error code:', error.code, 'Error message:', error.message);
                }
            );
        });
    };
    // code to insert transaction for ===== Keep Unallocated ==== ends

    // =========  keep unallocated  ========= delete start here
    useEffect(() => {
        if (transaction && transaction.selectedOption === 'Keep Unallocated') {
            setPayee(transaction.payee);
            setSelectedOption(transaction.selectedOption);
            setSelectedButton(transaction.selectedButton);
            setUnallocatedIncome(transaction.transactionAmount);
            setDate(new Date(transaction.transactionDate));  // Set date value, parsing if necessary
        }
    }, [transaction]);

    // =========  keep unallocated  ========= delete function
    const handleDeleteTransactionKU = (transaction) => {
        const {id, transactionAmount, user_id} = transaction;
        if (!id || !user_id || transactionAmount == null) {
            console.error('Missing required transaction data.');
            return;
        }
        adjustUnallocatedIncomeKU(transactionAmount, user_id);
        deleteTransactionKU(id);
        console.log('Transaction deleted.');
        navigation.navigate('TopTab');
    };

    // ===== keep unallocated ===== update table query when delete a transaction
    const adjustUnallocatedIncomeKU = (transactionAmount, user_id) => {
        db.transaction(
            (tx) => {
                const adjustmentAmount = transactionAmount >= 0 ? -transactionAmount : Math.abs(transactionAmount);

                tx.executeSql(
                    `UPDATE Unallocated
                 SET unallocatedIncome = unallocatedIncome + ?
                 WHERE envelopeName = 'Available' AND user_id = ?;`,
                    [adjustmentAmount, user_id],
                    (tx, results) => {
                        console.log(
                            `Updated unallocatedIncome ${transactionAmount >= 0 ? 'decreased' : 'increased'
                            } by amount: ${Math.abs(transactionAmount)}`
                        );
                    },
                    (tx, error) => {
                        console.error('Error updating Unallocated income:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for updating Unallocated income:', error);
            },
            () => {
                console.log('Success: Unallocated Income Updated');
            }
        );
    };
    // function and query to delete keep unallocated transaction
    const deleteTransactionKU = (id) => {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    `DELETE FROM transactions WHERE id = ?;`,
                    [id],
                    (tx, results) => {
                        console.log(`Deleted transaction with id: ${id}`);
                    },
                    (tx, error) => {
                        console.error('Error deleting transaction:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for deleting transaction:', error);
            },
            () => {
                console.log('Success: Transaction Deleted');
            }
        );
    };
    // code to delete transaction for case ===== Keep Unallocated ===== end

    // code to update transaction for case ===== Keep Unallocated ===== start
    const handleUpdateTransactionKU = (transaction) => {
        const { id, transactionAmount, user_id } = transaction;
        const newpayee = payee;
        const newUnallocatedIncome = unallocatedIncome;
        const transactionDate = formattedFillDate;
        updateTransactionKU(id, transactionAmount, user_id, newpayee, newUnallocatedIncome, transactionDate);
        navigation.navigate('TopTab');
    };
    const updateTransactionKU = (id, transactionAmount, user_id, newpayee, newUnallocatedIncome, transactionDate) => {
        db.transaction(
            (tx) => {
                // Query 1: Update transactionAmount and payee 
                tx.executeSql(
                    `UPDATE Transactions 
                    SET transactionAmount = ?, payee = ?, transactionDate = ? 
                    WHERE id = ?;`,
                    [newUnallocatedIncome, newpayee, transactionDate, id],
                    (_, results) => {
                        console.log(`Updated transaction amount, payee, and transaction date with id: ${id}`);
                    },
                    (_, error) => {
                        console.error('Error updating transaction amount:', error);
                    }
                );
              
                // Query 2: Adjust unallocatedIncome based on transactionAmount
                tx.executeSql(
                    `UPDATE Unallocated 
                SET unallocatedIncome = unallocatedIncome + ? 
                WHERE envelopeName = 'Available' AND user_id = ?;`,
                    [transactionAmount > 0 ? -transactionAmount : Math.abs(transactionAmount), user_id],
                    (_, results) => {
                        console.log(
                            `UnallocatedIncome ${transactionAmount > 0 ? 'decreased' : 'increased'
                            } by ${Math.abs(transactionAmount)}`
                        );
                    },
                    (_, error) => {
                        console.error('Error updating Unallocated income for transactionAmount:', error);
                    }
                );
                // Query 3: Adjust unallocatedIncome based on newUnallocatedIncome
                tx.executeSql(
                    `UPDATE Unallocated 
                SET unallocatedIncome = unallocatedIncome + ? 
                WHERE envelopeName = 'Available' AND user_id = ?;`,
                    [newUnallocatedIncome, user_id],
                    (_, results) => {
                        console.log(
                            `UnallocatedIncome ${newUnallocatedIncome > 0 ? 'increased' : 'decreased'
                            } by ${Math.abs(newUnallocatedIncome)}`
                        );
                    },
                    (_, error) => {
                        console.error('Error updating Unallocated income for newUnallocatedIncome:', error);
                    }
                );
            },
            (error) => {
                console.error('Transaction error for updating transaction:', error);
            },
            () => {
                console.log('Success: Transaction Updated');
            }
        );
    };
    // code for updating transaction of ===== Keep Unallocated ===== ends here

    // code for inserting transaction of ===== fill each envelope ===== start
    const handleAddTransactionFee = () => {
        const groupId = uuidv4();

        // Case 2: where envelopes are filled also unallocatedIncome set or not..although it is by default to 0
        if (updatedEnvelopes && updatedEnvelopes.length > 0) {
            const transaction = {
                payee: payee,
                transactionAmount: unallocatedIncome,
                transactionType: unallocatedIncome <= 0 ? 'Expense' : 'Credit',
                envelopeName: 'My Account',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId,
                selectedButton: selectedButton,
                selectedOption: 'Fill Each Envelope',
            };

            const envelopeDetails = JSON.stringify(updatedEnvelopes);
            insertTransactionFee(transaction, envelopeDetails);
        } else {
            // Case 1: No envelopes filled, just set payee and transaction details
            const transaction = {
                payee: payee,
                transactionAmount: unallocatedIncome,
                transactionType: unallocatedIncome <= 0 ? 'Expense' : 'Credit',
                envelopeName: 'My Account',
                transactionDate: formattedFillDate,
                user_id: tempUserId,
                navigationScreen: 'fillEnvelops',
                groupId: groupId,
                selectedButton: selectedButton,
                selectedOption: 'Keep Unallocated',
            };

            const envelopeDetails = JSON.stringify([]);
            insertTransactionFee(transaction, envelopeDetails);
        }
    };

    // The insertTransaction function (as provided earlier):
    const insertTransactionFee = (transaction, envelopeDetails) => {
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, user_id, navigationScreen, envelopeDetails, groupId, selectedButton, selectedOption)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    transaction.payee,
                    transaction.transactionAmount,
                    transaction.transactionType,
                    transaction.envelopeName,
                    transaction.transactionDate,
                    transaction.user_id,
                    transaction.navigationScreen || null, // default null if navigationScreen is not provided
                    envelopeDetails, // Pass the serialized envelopeDetails (empty or filled)
                    transaction.groupId,  // Pass the groupId for linking
                    transaction.selectedButton || null, // Pass selectedButton state (or null if empty)
                    transaction.selectedOption || null, // Pass selectedOption state (or null if empty)
                ],
                (_, result) => {
                    console.log('Transaction inserted successfully with envelope details.');
                },
                (_, error) => {
                    console.error('Transaction failed. Error code:', error.code, 'Error message:', error.message);
                }
            );
        });
    };


    // code for inserting transaction of ===== fill each envelope ===== end here

    return (
        <TouchableWithoutFeedback style={{ flex: 1 }} onPress={isTooltipVisible ? handleOutsidePress : null}>
            <View style={styles.container}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content
                        title="Fill Envelopes"
                        titleStyle={styles.appbar_title} />

                    {/* to insert/update transaction From Unallocated */}
                    {selectedButton === 'unallocated' && (
                        <Appbar.Action
                            onPress={() => {
                                if (editOrdelete) {
                                    handleUpdateTransaction(transaction);
                                } else {
                                    handleCheckPress();
                                }
                            }}
                            icon="check"
                            color={colors.white}
                        />
                    )}
                    {/* to insert/update transaction keep Unallocated */}
                    {selectedButton === 'newIncome' && selectedOption === 'Keep Unallocated' && (
                        <Appbar.Action
                            onPress={() => {
                                if (editOrdelete) {
                                    handleUpdateTransactionKU(transaction);
                                } else {
                                    handleCheckPress();
                                }
                            }}
                            icon="check"
                            color={colors.white}
                        />
                    )}
                    {/* to insert/update transaction Fill Each Envelope */}
                    {selectedButton === 'newIncome' && selectedOption === 'Fill Each Envelope' && (
                        <Appbar.Action
                            onPress={() => {
                                if (editOrdelete) {
                                    // update function call here for From Fill Each Envelope
                                } else {
                                    handleCheckPress();
                                }
                            }}
                            icon="check"
                            color={colors.white}
                        />
                    )}


                    {/* to delete transactions of From Unallocated */}
                    {editOrdelete && selectedButton === 'unallocated' && (
                        <Appbar.Action
                            onPress={() => handleDeleteTransaction(transaction)}
                            icon="delete"
                            color={colors.white}
                        />
                    )}
                    {/* to delte transactions of Keep Unallocated */}
                    {editOrdelete && selectedButton === 'newIncome' && selectedOption === 'Keep Unallocated' && (
                        <Appbar.Action
                            onPress={() => handleDeleteTransactionKU(transaction)}
                            icon="delete"
                            color={colors.white}
                        />
                    )}
                    {/* to delte transactions of Fill Each Envelope */}
                    {editOrdelete && selectedButton === 'newIncome' && selectedOption === 'Fill Each Envelope' && (
                        <Appbar.Action
                            // onPress={() => handleDeleteTransactionFEE(transaction)}
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

                <ScrollView style={styles.scroll_view}>
                    {!editOrdelete && (
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
                    )}

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

                            {selectedButton === 'newIncome' && selectedOption && (
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
                                            <Text style={leftUnallocated < 0 ? styles.boldText_total_income : styles.boldText_total_income_green}>{leftUnallocated}.00</Text>
                                            <Text style={styles.grayText}>Left Unallocated</Text>
                                        </View>
                                    </View>

                                    {/* Second View */}
                                    <View style={styles.equalSection}>
                                        {/* First Row */}
                                        <View style={styles.row}>
                                            <Text style={styles.boldText}>{totalUnallocatedIncome}.00</Text>
                                            <Text style={styles.grayText}>Currently Unallocated</Text>
                                        </View>

                                        {/* Second Row */}
                                        <View style={styles.row}>
                                            <Text style={styles.boldText}>{usedThisFill}.00</Text>
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


                            {selectedButton === 'unallocated' && (
                                <>
                                    <FlatList
                                        data={envelopes}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => {
                                            // console.log('Rendering item:', item); // Log the current item being rendered

                                            const updatedEnvelope = updatedEnvelopes.find(envelope => envelope.envelopeId === item.envelopeId);
                                            const filledIncome = updatedEnvelope ? updatedEnvelope.filledIncome : 0; // Show updated filledIncome, else 0
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
                            // {
                            //     label: `Set to Budget Amt (${selectedEnvelope?.amount || ''})`,
                            //     value: 'equalAmount'
                            // },
                            { label: `Add to Budget Amt (${selectedEnvelope?.amount || ''})`, 
                                value: 'addToAmount'
                            },
                            // { label: 'Set Specific Amount', value: 'customAmount' },
                            { label: 'Add Specific Amount', value: 'addToCustomAmount' },
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

                    {(customAmountOption === 'customAmount' || customAmountOption === 'addToCustomAmount') && (
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

                <Snackbar
                    visible={payeeSnackbarVisible}
                    onDismiss={() => setPayeeSnackbarVisible(false)}
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
                        <Text style={styles.snack_bar_text}>Enter payee name</Text>
                    </View>
                </Snackbar>

                <Snackbar
                    visible={optionsSnackbarVisible}
                    onDismiss={() => setOptionsSnackbarVisible(false)}
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
                        <Text style={styles.snack_bar_text}>All fields are required.</Text>
                    </View>
                </Snackbar>

                <Snackbar
                    visible={howToFillSnackbarVisible}
                    onDismiss={() => setHowToFillSnackbarVisible(false)}
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
                        <Text style={styles.snack_bar_text}>Choose how to fill your envelopes.</Text>
                    </View>
                </Snackbar>

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
        marginTop: hp('0.4%'),
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
    boldText_total_income_green: {
        fontSize: hp('1.8%'),
        color: colors.brightgreen,
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

export default FillEnvelopes;
