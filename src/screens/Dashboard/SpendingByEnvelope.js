import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image, } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { Appbar, Modal, Portal, Button, TextInput, RadioButton, IconButton, Menu } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { BarChart, PieChart } from "react-native-chart-kit";
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import randomColor from 'randomcolor';
import { db } from '../../database/database';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import { getOrAssignEnvelopeColor } from '../../utils/envelopeColorManager';

const { width: screenWidth } = dimensions;

const SpendingByEnvelope = () => {
    const navigation = useNavigation();

    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    // code for menu help and settings
    const [trMenuVisible, setTrMenuVisible] = useState(false);
    const openMenuTr = () => setTrMenuVisible(true);
    const closeMenuTr = () => setTrMenuVisible(false);
    const handleRightIconTrPress = () => {
        if (trMenuVisible) {
            closeMenuTr();
        } else {
            openMenuTr();
        }
    };
    const handleMenuOptionPress = (screen) => {
        closeMenuTr();
        navigation.navigate(screen, {
            from_spendbyenvelope: true
        });
    };

    // code for getting user id
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector((state) => state.user.user_id);
    const temp_user_id = useSelector((state) => state.user.temp_user_id);

    // Memoize tempUserId based on isAuthenticated and user_id
    const tempUserId = useMemo(() => {
        if (isAuthenticated) {
            return user_id; // Set to the current user's ID
        } else {
            return -1; // Default value when not authenticated
        }
    }, [isAuthenticated, user_id]);

    // console.log('value of tempUserId in SpendingByEnvelope', tempUserId);

    // No need to manage tempUserId state manually
    useFocusEffect(
        useCallback(() => {
            // Log or handle tempUserId usage whenever the screen gains focus
            // console.log('useFocusEffect triggered with tempUserId:', tempUserId);
        }, [tempUserId])
    );


    // code for modal of dates
    const [visible, setVisible] = useState(false);
    const [selectedRange, setSelectedRange] = useState('thisMonth');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    // console.log('values of todate and from date after custom is:', fromDate, toDate);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [customFromDate, setCustomFromDate] = useState(null);
    const [customToDate, setCustomToDate] = useState(null);

    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);

    // just to show in UI above the graph
    const formatDate = (date) => {
        return moment(date).format('MMM D, YYYY');  // Format: "Nov 1, 2024"
    };
    useFocusEffect(
        React.useCallback(() => {
            // Set default dates to "thisMonth" range
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');
            setFromDate(formatDate(startOfMonth)); // initially set from date as current month start date
            setToDate(formatDate(endOfMonth));     // set to date as current month end date

            // No cleanup needed, so we return undefined
            return undefined;
        }, [])
    );

    const handleSetDateRange = () => {
        const formatDate = (date) => {
            return moment(date).format('MMM D, YYYY');  // e.g. "Nov 1, 2024"
        };

        if (selectedRange === 'thisMonth') {
            const startOfMonth = moment().startOf('month');
            const endOfMonth = moment().endOf('month');
            setFromDate(formatDate(startOfMonth));
            setToDate(formatDate(endOfMonth));
        } else if (selectedRange === 'lastMonth') {
            const startOfLastMonth = moment().subtract(1, 'month').startOf('month');
            const endOfLastMonth = moment().subtract(1, 'month').endOf('month');
            setFromDate(formatDate(startOfLastMonth));
            setToDate(formatDate(endOfLastMonth));
        } else if (selectedRange === 'last30Days') {
            const endDate = moment();
            const startDate = moment().subtract(30, 'days');
            setFromDate(formatDate(startDate));
            setToDate(formatDate(endDate));
        } else if (selectedRange === 'last90Days') {
            const endDate = moment();
            const startDate = moment().subtract(90, 'days');
            setFromDate(formatDate(startDate));
            setToDate(formatDate(endDate));
        } else if (selectedRange === 'thisYear') {
            const startOfYear = moment().startOf('year');
            const endOfYear = moment().endOf('year');
            setFromDate(formatDate(startOfYear));
            setToDate(formatDate(endOfYear));
        } else if (selectedRange === 'lastYear') {
            const startOfLastYear = moment().subtract(1, 'year').startOf('year');
            const endOfLastYear = moment().subtract(1, 'year').endOf('year');
            setFromDate(formatDate(startOfLastYear));
            setToDate(formatDate(endOfLastYear));
        } else if (selectedRange === 'custom') {
            const customFrom = moment(customFromDate);
            const customTo = moment(customToDate);
            setFromDate(formatDate(customFrom));
            setToDate(formatDate(customTo));
        }

        hideModal();
    };

    const onChangeFromDate = (event, selectedDate) => {
        const currentDate = selectedDate || customFromDate;
        setShowFromPicker(false);
        setCustomFromDate(currentDate);
    };

    const onChangeToDate = (event, selectedDate) => {
        const currentDate = selectedDate || customToDate;
        setShowToPicker(false);
        setCustomToDate(currentDate);
    };

    // Handler to clear dates
    const clearFromDate = () => setCustomFromDate('');
    const clearToDate = () => setCustomToDate('');

    // code for getting current year start and end date for yearly envelopes filtering
    const startOfYear = moment().startOf('year').toISOString();
    const endOfYear = moment().endOf('year').toISOString();
    // Format the dates using the formatDateSql function
    const formattedFromDateYearly = formatDateSql(startOfYear);
    const formattedToDateYearly = formatDateSql(endOfYear);

    // console.log(' date of formattedFromDateYearly', formattedFromDateYearly);
    // console.log(' date of formattedToDateYearly', formattedToDateYearly);

    // code for selecting envelopes on basis of date range start here 
    const [envelopes, setEnvelopes] = useState([]);
    // console.log('all envelopes in spending by envelope:', envelopes);

    // code to filter envelopes with date
    const fetchRecordsWithinDateRange = (fromDate, toDate, formattedFromDateYearly, formattedToDateYearly) => {
        const formattedFromDate = formatDateSql(fromDate);
        const formattedToDate = formatDateSql(toDate);

        db.transaction((tx) => {
            //         const fetchQuery = `
            //     SELECT * 
            //     FROM envelopes 
            //     WHERE fillDate BETWEEN ? AND ? AND user_id = ?;
            //   `;
            const fetchQuery = `
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
                fetchQuery,
                [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly],
                (_, { rows }) => {
                    const allData = [];
                    for (let i = 0; i < rows.length; i++) {
                        allData.push(rows.item(i));
                    }
                    setEnvelopes(allData);
                },
                (_, error) => {
                    console.error("Error Fetching Data:", error);
                    return true;
                }
            );
        });
    };

    useFocusEffect(
        React.useCallback(() => {
            if (fromDate && toDate && formattedFromDateYearly && formattedToDateYearly) {
                fetchRecordsWithinDateRange(fromDate, toDate, formattedFromDateYearly, formattedToDateYearly);
            }
        }, [fromDate, toDate, formattedFromDateYearly, formattedToDateYearly])
    );

    // code to search all envelopes and to just log them
    useFocusEffect(
        useCallback(() => {
            db.transaction((tx) => {
                const fetchAllQuery = `
            SELECT * 
            FROM envelopes `;

                tx.executeSql(
                    fetchAllQuery,
                    [],
                    (_, { rows }) => {
                        const allData = [];
                        for (let i = 0; i < rows.length; i++) {
                            allData.push(rows.item(i));
                        }
                        // console.log("Fetched All Data from envelopes:", allData);
                    },
                    (_, error) => {
                        console.error("Error Fetching All Data:", error);
                        return true;
                    }
                );
            });
        }, [])
    );

    // code to filter transactions by date
    const [transactions, setTransactions] = useState([]);
    const filterTransactions = (fromDate, toDate) => {

        const formattedFromDate = formatDateSql(fromDate);
        const formattedToDate = formatDateSql(toDate);

        db.transaction((tx) => {
            const fetchQuery = `
        SELECT * 
        FROM Transactions 
        WHERE transactionDate BETWEEN ? AND ? AND user_id = ?;
      `;
            tx.executeSql(
                fetchQuery,
                [formattedFromDate, formattedToDate, tempUserId],
                (_, { rows }) => {
                    const allData = [];
                    for (let i = 0; i < rows.length; i++) {
                        allData.push(rows.item(i));
                    }
                    setTransactions(allData);

                },
                (_, error) => {
                    console.error("Error Fetching Data:", error);
                    return true;
                }
            );
        });
    };

    useFocusEffect(
        React.useCallback(() => {
            if (fromDate && toDate) {
                filterTransactions(fromDate, toDate);
            }
        }, [fromDate, toDate])
    );

    // code to search and just log all Transactions
    useFocusEffect(
        useCallback(() => {
            db.transaction((tx) => {
                const fetchAllQuery = `
            SELECT * 
            FROM Transactions`;

                tx.executeSql(
                    fetchAllQuery,
                    [],
                    (_, { rows }) => {
                        const allData = [];
                        for (let i = 0; i < rows.length; i++) {
                            allData.push(rows.item(i));
                        }
                        // console.log("Fetched All Data from transactions:", allData);
                    },
                    (_, error) => {
                        console.error("Error Fetching All Data:", error);
                        return true;
                    }
                );
            });
        }, [])
    );

    // code to calculate required values from filtered envelopes and transactions

    const [income, setIncome] = useState(0);
    const [spending, setSpending] = useState(0);
    const [netTotal, setNetTotal] = useState(0);
    const [spendingByEnvelope, setSpendingByEnvelope] = useState([]);

    // code to calculate required values from filtered envelopes and transactions
    const calculateIncomeAndSpending = (transactions, envelopes, userId) => {
        // Check for null or empty arrays
        if (!transactions || !transactions.length || !envelopes || !envelopes.length) {
            console.log("No data available for calculations.");
            setIncome(0);
            setSpendingByEnvelope([]);
            setSpending(0);
            return null;
        }
        // Calculate total income by summing up the amount value of all envelopes within that month...
        const totalIncome = envelopes
            .filter((envelope) => envelope.user_id === userId)
            .reduce((sum, envelope) => sum + (envelope.amount || 0), 0);
        // console.log("Total Income:", totalIncome);
        setIncome(totalIncome);
        // Calculate spending by envelope from transactions
        const envelopeSpending = {};
        let totalExpenseSpending = 0;

        transactions
            .filter((transaction) => transaction.user_id === userId && transaction.transactionType === "Expense")
            .forEach((transaction) => {
                const { envelopeName, transactionAmount } = transaction;

                // Initialize envelope spending if not already done
                if (!envelopeSpending[envelopeName]) {
                    envelopeSpending[envelopeName] = 0;
                }

                // Add transaction amount to the envelope's spending
                envelopeSpending[envelopeName] += transactionAmount;
                totalExpenseSpending += transactionAmount; // Sum up total expenses
            });

        // transactions
        //     .filter((transaction) => transaction.user_id === userId)
        //     .forEach((transaction) => {
        //         const { envelopeName, transactionAmount, transactionType } = transaction;

        //         if (!envelopeSpending[envelopeName]) {
        //             envelopeSpending[envelopeName] = 0;
        //         }

        //         // to calculate total spending of all envelopes as expense
        //         if (transactionType === "Expense") {
        //             envelopeSpending[envelopeName] += transactionAmount;
        //             totalExpenseSpending += transactionAmount;
        //         } else if (transactionType === "Credit") {
        //             envelopeSpending[envelopeName] -= transactionAmount;
        //         }
        //     });

        const spendingByEnvelope = Object.entries(envelopeSpending).map(([envelopeName, envelopeSpending]) => ({
            envelopeName,
            envelopeSpending,
        }));

        setSpendingByEnvelope(spendingByEnvelope);
        console.log(' ========== spendByEnvelope:', spendingByEnvelope);
        setSpending(totalExpenseSpending);
        console.log(' ========== total spendings:', totalExpenseSpending);

        return { totalIncome, spendingByEnvelope };
    };

    // just for testing only log them
    useEffect(() => {
        // console.log("Final Results: ", { transactions, envelopes });
        if (!transactions || !transactions.length || !envelopes || !envelopes.length) {
            // console.log("No transactions or envelopes data to process.");
            setIncome(0);
            setSpendingByEnvelope([]);
            setSpending(0);
            return;
        }

        const results = calculateIncomeAndSpending(transactions, envelopes, user_id);
        if (results) {
            const { totalIncome, spendingByEnvelope } = results;
            // console.log("Calculated Results: ", { totalIncome, spendingByEnvelope });
        }
    }, [transactions, envelopes]);

    // Net total effect calculation based on income and spending although not being used in this screen
    useFocusEffect(
        useCallback(() => {
            setNetTotal(income - spending);
        }, [income, spending])
    );

    // full code and logic to filter and calculate values end here


    // code to generate data for pie graph
    const [pieData, setPieData] = useState([]);

    // This function generates pie chart data and ensures consistent envelope colors
    useEffect(() => {
        const generatePieData = async () => {
            const data = await Promise.all(
                spendingByEnvelope
                    // .filter(item => (item.envelopeSpending || 0) > 0)  // Filter out negative spending
                    .map(async (item) => {
                        const envelopeSpending = item.envelopeSpending || 0;
                        const envelopeColor = await getOrAssignEnvelopeColor(item.envelopeName);  // Get or generate the color

                        return {
                            name: item.envelopeName,
                            population: envelopeSpending,
                            color: envelopeColor,
                            legendFontColor: "#7F7F7F",
                            legendFontSize: 15
                        };
                    })
            );
            setPieData(data);  // Update the state with the generated data
        };

        generatePieData();
    }, [spendingByEnvelope]);  // Re-run when spendingByEnvelope changes

    const pieChartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content title="Spending by Envelope" titleStyle={styles.appbar_title} />
                <Appbar.Action onPress={showModal} icon="calendar" color={colors.white} />
                <Appbar.Action onPress={handleRightIconTrPress} icon="dots-vertical" color={colors.white} />
            </Appbar.Header>

            <View style={styles.date_from_to_view}>
                <Text style={styles.date_from_to_text}>
                    {fromDate} - {toDate}
                </Text>
            </View>

            <View style={styles.graph_view}>
                <PieChart
                    // data={pieData}
                    data={
                        pieData.length > 0
                            ? pieData
                            : [
                                {
                                    name: "No Data",
                                    population: 1,
                                    color: "darkgray",
                                    legendFontColor: "#7F7F7F",
                                    legendFontSize: 15,
                                },
                            ]
                    }
                    width={hp('43%')}
                    height={hp('43%')}
                    chartConfig={pieChartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    center={[75, 0]}
                    hasLegend={false}
                />
            </View>

            <View style={styles.txt_amt_view}>
                <Text style={styles.txt_amt_texts}>Total Spending: {spending}.00</Text>
            </View>

            {/* <ScrollView style={{ flex: 1 }}>
                <View style={styles.envelope_txt_amt_parent_view}>
                    {spendingByEnvelope.some(item => (item.envelopeSpending || 0) > 0) ? (
                        spendingByEnvelope
                            .filter(item => (item.envelopeSpending || 0) > 0)
                            .map((item, index) => {
                                const envelopeName = item.envelopeName;
                                const envelopeSpending = item.envelopeSpending || 0;
                                const envelopeColor = pieData[index]?.color || randomColor();

                                // Calculate the total of all envelope spendings
                                const totalEnvelopeSpending = spendingByEnvelope
                                    .filter(item => (item.envelopeSpending || 0) > 0)
                                    .reduce((sum, item) => sum + (item.envelopeSpending || 0), 0);

                                // Calculate the percentage for the current envelope
                                // no decimal
                                // const percentage = Math.round((envelopeSpending / totalEnvelopeSpending) * 100);
                                // one decimal
                                const percentage = Math.round(((envelopeSpending / totalEnvelopeSpending) * 100) * 10) / 10;


                                return (
                                    <View style={styles.envelope_text_amount_view} key={index}>
                                        <View style={[styles.legendSquare, { backgroundColor: envelopeColor }]} />
                                        <View style={styles.envelope_txt_amt_view}>
                                            <View style={styles.envelope_column_name_legend}>
                                                <Text style={styles.envelope_text}>{envelopeName}</Text>
                                            </View>
                                            <View style={styles.envelope_column}>
                                                <Text style={styles.percentage_text}>{percentage}%</Text>
                                            </View>
                                            <View style={styles.envelope_column}>
                                                <Text style={styles.envelope_amount}>{envelopeSpending}.00</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                    ) : (
                        <View style={styles.emptyState}>
                            <Image
                                source={Images.expenseplannerimagegray}
                                style={styles.emptyImage}
                            />
                            <View style={styles.emptyTextContainer}>
                                <Text style={styles.emptyText}>No spending records found for the selected date range.</Text>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView> */}

            {/* this code dont calculate negative values */}
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.envelope_txt_amt_parent_view}>
                    {spendingByEnvelope.length > 0 ? (
                        spendingByEnvelope.map((item, index) => {
                            const envelopeName = item.envelopeName;
                            const envelopeSpending = item.envelopeSpending || 0;
                            const envelopeColor = pieData[index]?.color || randomColor();

                            // Calculate the total of all envelope spendings (including negative values)
                            const totalEnvelopeSpending = spendingByEnvelope.reduce(
                                (sum, item) => sum + (item.envelopeSpending || 0),
                                0
                            );

                            // Calculate the percentage for the current envelope
                            // one decimal
                            const percentage = Math.round(((envelopeSpending / totalEnvelopeSpending) * 100) * 10) / 10;

                            return (
                                <View style={styles.envelope_text_amount_view} key={index}>
                                    <View style={[styles.legendSquare, { backgroundColor: envelopeColor }]} />
                                    <View style={styles.envelope_txt_amt_view}>
                                        <View style={styles.envelope_column_name_legend}>
                                            <Text style={styles.envelope_text}>{envelopeName}</Text>
                                        </View>
                                        <View style={styles.envelope_column}>
                                            <Text style={styles.percentage_text}>{percentage}%</Text>
                                        </View>
                                        <View style={styles.envelope_column}>
                                            <Text style={styles.envelope_amount}>
                                                {envelopeSpending.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Image
                                source={Images.expenseplannerimagegray}
                                style={styles.emptyImage}
                            />
                            <View style={styles.emptyTextContainer}>
                                <Text style={styles.emptyText}>No spending records found for the selected date range.</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>


            <Portal>
                <Modal
                    visible={trMenuVisible}
                    onDismiss={closeMenuTr}
                    contentContainerStyle={{
                        backgroundColor: 'transparent',
                    }}
                    theme={{
                        colors: {
                            backdrop: 'transparent',
                        },
                    }}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={closeMenuTr}
                        activeOpacity={0}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity
                                onPress={() => handleMenuOptionPress('Help')}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Help</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleMenuOptionPress('Settings')}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </Portal>


            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
                    <View style={styles.modalInnerContainer}>
                        <Text style={styles.modalTitle}>Select Dates</Text>
                        <RadioButton.Group
                            onValueChange={value => setSelectedRange(value)}
                            value={selectedRange}
                        >
                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="thisMonth" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>This Month</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="lastMonth" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>Last Month</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="last30Days" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>Last 30 Days</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="last90Days" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>Last 90 Days</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="thisYear" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>This Year</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="lastYear" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>Last Year</Text>
                            </View>

                            <View style={styles.radioButtonContainer}>
                                <RadioButton value="custom" color={colors.androidbluebtn} uncheckedColor={colors.androidbluebtn} />
                                <Text style={styles.radioButtonLabel}>Custom</Text>
                            </View>
                        </RadioButton.Group>

                        {selectedRange === 'custom' && (
                            <View style={styles.inputContainer}>
                                <TouchableOpacity
                                    onPress={() => setShowFromPicker(true)}
                                    style={styles.dateInputWrapper}
                                >
                                    <TextInput
                                        placeholder='From Date'
                                        placeholderTextColor={'gray'}
                                        value={customFromDate ? moment(customFromDate).format('DD-MM-YYYY') : ''}
                                        editable={false}
                                        style={styles.input}
                                        textColor='black'
                                    />
                                    <IconButton
                                        icon="close"
                                        onPress={clearFromDate}
                                        style={styles.clearIcon}
                                        color="black"
                                        size={12}
                                    />
                                </TouchableOpacity>
                                {showFromPicker && (
                                    <DateTimePicker
                                        value={customFromDate || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeFromDate}
                                    />
                                )}

                                <TouchableOpacity
                                    onPress={() => setShowToPicker(true)}
                                    style={styles.dateInputWrapper}
                                >
                                    <TextInput
                                        placeholder='To Date'
                                        placeholderTextColor={'gray'}
                                        value={customToDate ? moment(customToDate).format('DD-MM-YYYY') : ''}
                                        editable={false}
                                        style={styles.input}
                                        textColor='black'
                                    />
                                    <IconButton
                                        icon="close"
                                        onPress={clearToDate}
                                        style={styles.clearIcon}
                                        color="white"
                                        size={12}
                                    />
                                </TouchableOpacity>
                                {showToPicker && (
                                    <DateTimePicker
                                        // value={customToDate}
                                        value={customToDate || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeToDate}
                                    />
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtonContainer}>
                            <Button
                                mode="text"
                                onPress={hideModal}
                                style={styles.setButton}
                                rippleColor={colors.gray}
                                textColor={colors.androidbluebtn}
                            >
                                CANCEL
                            </Button>
                            <Button
                                mode="text"
                                onPress={handleSetDateRange}
                                style={styles.setButton}
                                rippleColor={colors.gray}
                                textColor={colors.androidbluebtn}
                            >
                                SET
                            </Button>
                        </View>

                    </View>
                </Modal>
            </Portal>

        </View>
    )
}

export default SpendingByEnvelope

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

    date_from_to_view: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: hp('1%'),
    },
    date_from_to_text: {
        fontSize: hp('2.5%'),
        color: colors.black,
        fontWeight: 'bold',
    },

    graph_view: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    txt_amt_view: {
        backgroundColor: '#d7d7d7',
        justifyContent: 'center',
        alignItems: 'center',
        height: hp('5%'),

    },
    txt_amt_texts: {
        fontSize: hp('2.2%'),
        color: colors.black,
        fontWeight: 'bold',
    },

    name_percentage_amt_view: {
        backgroundColor: 'transparent',
        height: hp('5%'),

    },



    // menu styles
    overlay: {
        flex: 1,
        // backgroundColor: 'transparent',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    menuContainer: {
        width: 170,
        backgroundColor: '#fff',
        padding: 5,
        position: 'absolute',
        right: wp('3%'),
        top: hp('-49%'),
    },
    menuOption: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },


    // modal styles
    dateText: {
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        color: 'black',
    },

    modalContainer: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 3,
        marginHorizontal: hp('5.2%')
    },
    modalInnerContainer: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 3,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: 'black',
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButtonLabel: {
        marginLeft: 10,
        fontSize: 16,
        color: 'black',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dateInputWrapper: {
        flexDirection: 'row',
    },
    input: {
        width: hp('10%'),
        height: hp('4%'),
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        fontSize: 12,
        color: 'black',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,

    },
    inputLabel: {
        fontSize: 10,
    },
    clearIcon: {
        backgroundColor: colors.androidbluebtn,
        borderRadius: 1,
        width: 22,
        height: 18,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    setButton: {
        marginTop: 5,
    },



    // 
    envelope_txt_amt_parent_view: {
        // paddingHorizontal: hp('1.5%'),
    },
    envelope_text_amount_view: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp('1.5%'),
        paddingHorizontal: hp('1.5%'),
        borderBottomWidth: 0.5,
        borderColor: colors.gray,
    },
    legendSquare: {
        width: 8,
        height: 8,
        marginRight: 8,
    },
    envelope_txt_amt_view: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    envelope_column_name_legend: {
        flex: 1, // Ensures equal spacing for each column
        justifyContent: 'center',
        alignItems: 'flex-start', // Align text to the left within each column
    },
    envelope_column: {
        flex: 1, // Ensures equal spacing for each column
        justifyContent: 'center',
        alignItems: 'flex-end', // Align text to the left within each column
    },
    envelope_text: {
        fontSize: hp('2%'),
        color: colors.black,
        marginRight: hp('1%'),
    },
    percentage_text: {
        fontSize: hp('2%'),
        color: colors.black,
        textAlign: 'center', // Align percentage in the center of its column
    },
    envelope_amount: {
        fontSize: hp('2%'),
        color: colors.black,
        textAlign: 'right', // Align spending amount to the right
    },

    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp('8%'),
    },
    emptyImage: {
        width: hp('8%'),
        height: hp('8%'),
        marginBottom: hp('4%'),
    },
    emptyTextContainer: {
        maxWidth: hp('30%'),
        // backgroundColor: 'yellow',
    },
    emptyText: {
        fontSize: hp('2.4%'),
        color: colors.gray,
        textAlign: 'center',
        alignSelf: 'center',
    },



})
