import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { Appbar, Modal, Portal, Button, TextInput, RadioButton, IconButton, Menu, Divider } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { BarChart } from "react-native-chart-kit";
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns'; // For formatting dates
import moment from 'moment';
import { db } from '../../database/database';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import { Dimensions } from 'react-native';

const { width: screenWidth } = dimensions;

const IncomeVsSpending = () => {
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

  // code for getting user id from redux
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector((state) => state.user.user_id);
  const temp_user_id = useSelector((state) => state.user.temp_user_id);

  // Memoize tempUserId based on isAuthenticated and user_id
  const tempUserId = useMemo(() => {
    if (isAuthenticated) {
      return user_id;
    } else {
      return -1;
    }
  }, [isAuthenticated, user_id]);

  // No need to manage tempUserId state manually
  // useFocusEffect(
  //   useCallback(() => {
  //     // Log or handle tempUserId usage whenever the screen gains focus
  //     // console.log('useFocusEffect triggered with tempUserId:', tempUserId);
  //   }, [tempUserId])
  // );

  // code for modal of dates
  const [visible, setVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState('');
  const [modalSelectedRange, setModalSelectedRange] = useState('');

  const fetchLastSelectedRange = async () => {
    try {
      const savedRange = await AsyncStorage.getItem('selectedRange');
      if (savedRange) {
        if (savedRange === 'custom') {
          // Default to 'thisMonth' if custom range is invalid or missing
          const defaultRange = 'thisMonth';
          setSelectedRange(defaultRange);
          setModalSelectedRange(defaultRange);
          await AsyncStorage.setItem('selectedRange', defaultRange);
          handleSetDateRange(defaultRange);
        } else {
          setSelectedRange(savedRange);
          setModalSelectedRange(savedRange);
          handleSetDateRange(savedRange);
        }
      } else {
        // Default to 'thisMonth' if no saved range
        const defaultRange = 'thisMonth';
        setSelectedRange(defaultRange);
        setModalSelectedRange(defaultRange);
        await AsyncStorage.setItem('selectedRange', defaultRange);
        handleSetDateRange(defaultRange);
      }
    } catch (error) {
      console.error('Error retrieving or setting default range:', error);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      fetchLastSelectedRange();
    }, [])
  );

  const handleModalSelection = (value) => {
    setModalSelectedRange(value);
  };

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [customFromDate, setCustomFromDate] = useState(null);
  const [customToDate, setCustomToDate] = useState(null);

  const [formattedFromDate, setFormattedFromDate] = useState(null);
  const [formattedToDate, setFormattedToDate] = useState(null);
  // console.log('formattedFromDate in IncomeVsSpending', formattedFromDate);
  // console.log('formattedToDate in IncomeVsSpending', formattedToDate);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  // just to show on UI below graph
  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');  // Format: "Nov 1, 2024"
  };
  useEffect(() => {
    if (!selectedRange) return;  // Don't run if selectedRange is not yet set

    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    // Format and set the dates
    setFromDate(formatDate(startOfMonth));
    setToDate(formatDate(endOfMonth));
  }, [selectedRange]);

  // manually call function
  const handleSetButtonPress = async () => {
    try {
      setSelectedRange(modalSelectedRange); // Update the app's main selected range
      await AsyncStorage.setItem('selectedRange', modalSelectedRange); // Save to AsyncStorage
      handleSetDateRange(modalSelectedRange); // Update the dates
    } catch (error) {
      console.error('Error saving selected range:', error);
    }
  };

  const handleSetDateRange = (selectedRange) => {
    // Only update if selectedRange is defined
    if (!selectedRange) return;
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

  // Format the dates after fromDate and toDate have been updated like used in sqlite 2024-11-30
  useEffect(() => {
    if (fromDate && toDate) {
      const formattedFrom = formatDateSql(fromDate);
      const formattedTo = formatDateSql(toDate);

      setFormattedFromDate(formattedFrom);
      setFormattedToDate(formattedTo);
    }
  }, [fromDate, toDate]);   

  // code related to dates ends here


  // code to filter and calculate values start here
  const [envelopes, setEnvelopes] = useState([]);
  // console.log('all envelopes data :', envelopes);

  // code to filter envelopes with date
  const fetchRecordsWithinDateRange = (fromDate, toDate) => {
    const formattedFromDate = formatDateSql(fromDate);
    const formattedToDate = formatDateSql(toDate);

    db.transaction((tx) => {
      const fetchQuery = `
        SELECT * 
        FROM envelopes 
        WHERE fillDate BETWEEN ? AND ? AND user_id = ?;
      `;
      tx.executeSql(
        fetchQuery,
        [formattedFromDate, formattedToDate, tempUserId],
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

  // for testing just to log filtered envelopes
  useFocusEffect(
    React.useCallback(() => {
      if (fromDate && toDate) {
        fetchRecordsWithinDateRange(fromDate, toDate);
      }
    }, [fromDate, toDate])
  );

  // useFocusEffect(
  //   useCallback(() => {
  //     db.transaction((tx) => {
  //       const fetchAllQuery = `
  //           SELECT * 
  //           FROM envelopes `;

  //       tx.executeSql(
  //         fetchAllQuery,
  //         [],
  //         (_, { rows }) => {
  //           const allData = [];
  //           for (let i = 0; i < rows.length; i++) {
  //             allData.push(rows.item(i));
  //           }
  //           // console.log("Fetched All Data from envelopes:", allData);
  //         },
  //         (_, error) => {
  //           console.error("Error Fetching All Data:", error);
  //           return true;
  //         }
  //       );
  //     });
  //   }, [])
  // );

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

  // code to search and only log all Transactions
  useFocusEffect(
    React.useCallback(() => {
      if (fromDate && toDate) {
        filterTransactions(fromDate, toDate);
      }
    }, [fromDate, toDate])
  );
 
  // useFocusEffect(
  //   useCallback(() => {
  //     db.transaction((tx) => {
  //       const fetchAllQuery = `
  //           SELECT * 
  //           FROM Transactions`;

  //       tx.executeSql(
  //         fetchAllQuery,
  //         [],
  //         (_, { rows }) => {
  //           const allData = [];
  //           for (let i = 0; i < rows.length; i++) {
  //             allData.push(rows.item(i));
  //           }
  //           // console.log("Fetched All Data from transactions:", allData);
  //         },
  //         (_, error) => {
  //           console.error("Error Fetching All Data:", error);
  //           return true;
  //         }
  //       );
  //     });
  //   }, [])
  // );

  const groupByMonth = (data, dateKey) => {
    return data.reduce((acc, item) => {
      const date = new Date(item[dateKey]);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();  // e.g., 2024
      const monthYearKey = `${month} , ${year}`;
      if (!acc[monthYearKey]) acc[monthYearKey] = [];
      acc[monthYearKey].push(item);
      return acc;
    }, {});
  };

  // code for calculating monthly income from Income table
  const [incomeRecord, setIncomeRecord ] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      if (fromDate && toDate) {
        fetchIncomeWithinDateRange(fromDate, toDate);
      }
    }, [fromDate, toDate])
  );

  const fetchIncomeWithinDateRange = (fromDate, toDate) => {
    const formattedFromDate = formatDateSql(fromDate);
    const formattedToDate = formatDateSql(toDate);

    db.transaction((tx) => {
      const fetchQuery = `
      SELECT * 
      FROM Income 
      WHERE incomeDate BETWEEN ? AND ? AND user_id = ?;
    `;

      tx.executeSql(
        fetchQuery,
        [formattedFromDate, formattedToDate, tempUserId],
        (_, { rows }) => {
          const incomeData = [];
          for (let i = 0; i < rows.length; i++) {
            incomeData.push(rows.item(i));
          }
          setIncomeRecord(incomeData);
        },
        (_, error) => {
          console.error("Error Fetching Income Data:", error);
          return true;
        }
      );
    });
  };


  const envelopesByMonth = groupByMonth(envelopes, "fillDate");
  const transactionsByMonth = groupByMonth(transactions, "transactionDate");
  const incomeByMonth = groupByMonth(incomeRecord, "incomeDate");

  // older code working fine and taking income from envelopes 
  // const monthlyData = Object.keys({ ...envelopesByMonth, ...transactionsByMonth }).map((month) => {
  //   const monthEnvelopes = envelopesByMonth[month] || [];
  //   const monthTransactions = transactionsByMonth[month] || [];

  //   const income = monthEnvelopes.reduce((sum, envelope) => sum + (envelope.amount || 0), 0); // calculates Income by summing up all budgeted amounts of all envelopes

  //   // calculate spending by summing all expenses and summing all creditis and then minus credites from expenses...from all transactions of current month
  //   const rawSpending = monthTransactions.reduce((sum, transaction) => {
  //     if (transaction.transactionType === "Expense") return sum + transaction.transactionAmount;
  //     if (transaction.transactionType === "Credit") return sum - transaction.transactionAmount;
  //     return sum;
  //   }, 0);

  //   // console.log('raw spending is: ', rawSpending);

  //   const spending = Math.abs(rawSpending); // Ensure spending is positive
  //   const netTotal = income - spending; // Keep rawSpending for accurate netTotal calculation

  //   return { month, income, spending, netTotal };
  // });

  // new code latest....taking and calculating income from Income table spending from transactions of current month
  const monthlyData = Object.keys({ ...envelopesByMonth, ...transactionsByMonth, ...incomeByMonth }).map((month) => {
    const monthEnvelopes = envelopesByMonth[month] || [];
    const monthTransactions = transactionsByMonth[month] || [];
    const monthIncomes = incomeByMonth[month] || [];

    const income = monthIncomes.reduce((sum, income) => sum + (income.monthlyAmount || 0), 0);

    // older code in which it was also considering credit type transactions for calculating spending
    // const spending = monthTransactions.reduce((sum, transaction) => {
    //   if (transaction.transactionType === "Expense") return sum + transaction.transactionAmount;
    //   if (transaction.transactionType === "Credit") return sum - transaction.transactionAmount;
    //   return sum;
    // }, 0);

    // new code in which it's considering only expense type transactions for calculating spending latest
    const spending = monthTransactions.reduce((sum, transaction) => {
      if (
        transaction.transactionType === "Expense" &&
        transaction.envelopeName !== null
      ) return sum + transaction.transactionAmount;
      return sum;
    }, 0);

    const netTotal = income - spending;

    return { month, income, spending, netTotal };
  });


  // for bar graph dynamically extract the months and their corresponding income and spending

  const barsColors = {
    brightgreen: colors.brightgreen,
    danger: colors.danger,
  };

  // Create labels for months
  // const labels = monthlyData.flatMap((item) => ["", item.month, ""]);
  const labels = monthlyData.flatMap((item) => ["", item.month.split(' ')[0], ""]);
  // console.log('labels are : ', labels);

  // Create bar values (income and spending)
  // const barValues = monthlyData.flatMap(item => [item.income, 0, item.spending]);
  const barValues = monthlyData.flatMap(item => [
    Math.abs(item.income), // Always positive for graph
    0,                    // Separator (if needed)
    Math.abs(item.spending) // Always positive for graph
  ]);
  // console.log('barValues are : ', barValues);

  // Create bar colors
  const barColors = monthlyData.flatMap(() => [
    (opacity = 1) => barsColors.brightgreen,
    (opacity = 1) => 'transparent',
    (opacity = 1) => barsColors.danger,
  ]);

  // Calculate the maximum value from the data (this will scale the bars dynamically)
  const maxDataValue = Math.max(...barValues);
  // console.log('maxDataValue: ', maxDataValue);

  // Calculate the Y-axis labels based on the max value in the data
  const yInterval = Math.ceil(maxDataValue / 5); // Divide the max value into 5 intervals
  const yLabels = Array.from({ length: 6 }, (_, index) => index * yInterval);
  // console.log('Y-axis Labels: ', yLabels);

  // Dynamically adjust bar width based on the total number of bars
  const totalBars = barValues.length;
  // console.log('totalBars = ' + totalBars);
  const barPercentage = Math.max(0.1, 1.4 - (totalBars - 0.1) * (1.5 / 24));
  // console.log('barPercentage = ' + barPercentage);

  // Prepare chart data
  const data = {
    labels: labels,
    datasets: [
      {
        data: barValues, // Use original values (no scaling)
        colors: barColors, // Alternate colors for income and spending
      },
    ],
  };

  // Configure the bar chart
  const barChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientTo: "cyan",
    backgroundGradientToOpacity: 0,
    backgroundGradientFrom: "cyan",
    backgroundGradientFromOpacity: 0,
    color: (opacity = 1) => `#000000`, // Set axis color
    barPercentage: barPercentage, // Adjust bar width dynamically
    propsForBackgroundLines: {
      stroke: "#808080",
      strokeWidth: 0.5,
      strokeDasharray: "",
    },
    propsForVerticalLabels: {
      fontSize: 12,
    },
    // formatYLabel: (yValue) => yValue, // Show Y-axis labels normally without formatting
    formatYLabel: (yValue) => parseInt(yValue, 10).toString(), // Remove decimals
  };

  // Output useful values
  // console.log('maxDataValue: ', maxDataValue);
  // console.log('yLabels: ', yLabels);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
        <Appbar.Content title="Income vs Spending" titleStyle={styles.appbar_title} />
        <Appbar.Action onPress={showModal} icon="calendar" color={colors.white} />
        <Appbar.Action onPress={handleRightIconTrPress} icon="dots-vertical" color={colors.white} />
      </Appbar.Header>

      <View style={styles.graph_view}>
        <BarChart
          data={data}
          width={hp("48%")}
          height={hp("41%")}
          chartConfig={barChartConfig}
          yAxisSuffix=" "
          // verticalLabelRotation={-30}
          fromZero={true}
          withHorizontalLabels={true}
          withInnerLines={true}
          withCustomBarColorFromData={true}
          flatColor={true}
          showBarTops={false}
          yAxisLabel=""
        />
      </View>

      <View style={styles.txt_amt_view}>
        <Text style={styles.txt_amt_texts}>{fromDate} - {toDate}</Text>
      </View>

      <View style={styles.envelope_text_amount_view}>
        <View style={styles.envelope_txt_amt_view}>
          <View style={styles.envelope_column_name_legend}>
            <Text style={styles.envelope_text}></Text>
          </View>
          <View style={styles.envelope_column_name_legend}>
            <View style={[styles.legendSquare, { backgroundColor: colors.brightgreen }]} />
            <Text style={styles.envelope_text}>Income</Text>
          </View>
          <View style={styles.envelope_column}>
            <View style={[styles.legendSquare, { backgroundColor: colors.danger }]} />
            <Text style={styles.percentage_text}>Spending</Text>
          </View>
          <View style={styles.envelope_column}>
            <Text style={styles.envelope_amount}>Net</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {monthlyData.map(({ month, income, spending, netTotal }, index) => (
          <React.Fragment key={month}>
            <View style={styles.envelope_text_amount_view}>
              <View style={styles.envelope_txt_amt_view}>
                <View style={styles.envelope_column_name_legend_month}>
                  <Text style={styles.envelope_text}>{month}</Text>
                </View>
                <View style={styles.envelope_column_name_legend}>
                  <Text style={styles.envelope_text}>{income || 0}.00</Text>
                </View>
                <View style={styles.envelope_column}>
                  <Text style={styles.percentage_text}>{spending || 0}.00</Text>
                </View>
                <View style={styles.envelope_column}>
                  <Text style={styles.envelope_amount_net_total}>{netTotal || 0}.00</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* <View style={styles.envelope_text_amount_view}>
        {incomeVsSpending.map((data, index) => (
          <View key={index} style={styles.envelope_txt_amt_view}>
            <View style={styles.envelope_column_name_legend}>
              <Text style={styles.envelope_text}>{getMonthName(data.month)}</Text>
            </View>
            <View style={styles.envelope_column_name_legend}>
              <Text style={styles.envelope_text}>{data.income}.00</Text>
            </View>
            <View style={styles.envelope_column}>
              <Text style={styles.percentage_text}>{data.spending}.00</Text>
            </View>
            <View style={styles.envelope_column}>
              <Text style={styles.envelope_amount_net_total}>{data.netTotal}.00</Text>
            </View>
          </View>
        ))}
      </View> */}



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
              // onValueChange={value => setSelectedRange(value)}
              // value={selectedRange}
              // onValueChange={handleValueChange} 
              onValueChange={handleModalSelection}
              // value={selectedRange}
              value={modalSelectedRange}

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

            {modalSelectedRange === 'custom' && (
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
                // onPress={handleSetDateRange}
                onPress={handleSetButtonPress}
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

export default IncomeVsSpending

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
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: hp('3%'),
    marginLeft: hp('3%'),
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


  // views styles
  envelope_text_amount_view: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: hp('1.5%'),
    // backgroundColor: 'cyan',
  },
  legendSquare: {
    width: 8,
    height: 8,
    marginRight: 8,
    marginTop: 6,
  },
  envelope_txt_amt_view: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    // backgroundColor: 'yellow',
  },
  envelope_column_name_legend_month: {
    flex: 1,
    // height: 50,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginLeft: hp('1%'),
    // backgroundColor: 'pink',
  },
  envelope_column_name_legend: {
    flex: 1,
    // height: 50,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    flexDirection: 'row',
    // backgroundColor: 'green',
  },
  envelope_column: {
    flex: 1,
    // height: 50,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    flexDirection: 'row',
    // backgroundColor: 'purple',
  },
  envelope_text: {
    fontSize: hp('2%'),
    color: colors.black,
    marginRight: hp('1%'),
  },
  percentage_text: {
    fontSize: hp('2%'),
    color: colors.black,
    textAlign: 'center',
  },
  envelope_amount: {
    fontSize: hp('2%'),
    color: colors.black,
    textAlign: 'right',
  },
  envelope_amount_net_total: {
    fontSize: hp('2%'),
    color: colors.black,
    textAlign: 'right',
    fontWeight: 'bold',
  },


  //dynamically generated view styles
  monthlySummaryContainer: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  month: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },


})
