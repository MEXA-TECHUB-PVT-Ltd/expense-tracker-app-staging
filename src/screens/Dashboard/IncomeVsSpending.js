import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { Appbar, Modal, Portal, Button, TextInput, RadioButton, IconButton, Menu } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
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

  // code for getting user id from redux
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector((state) => state.user.user_id);
  const temp_user_id = useSelector((state) => state.user.temp_user_id);

  // Memoize tempUserId based on isAuthenticated and user_id
  const tempUserId = useMemo(() => {
    if (isAuthenticated) {
      return user_id; // Set to the current user's ID
    } else {
      return -1; // Default value when not authenticated means temp_user_id as in redux it also have value -1
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
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    // Format and set the dates
    setFromDate(formatDate(startOfMonth));
    setToDate(formatDate(endOfMonth));
  }, []);
 

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

  // Format the dates after fromDate and toDate have been updated like used in sqlite 2024-11-30
  useEffect(() => {
    if (fromDate && toDate) {
      const formattedFrom = formatDateSql(fromDate);
      const formattedTo = formatDateSql(toDate);

      setFormattedFromDate(formattedFrom);
      setFormattedToDate(formattedTo);
    }
  }, [fromDate, toDate]);   


  // faisal code for filtering envelopes and transactions start here

  // faisal code start here 
  const [envelopes, setEnvelopes] = useState([]);
  // console.log('all envelopes data :', envelopes);

  // faisal code filter envelopes with date
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

  useFocusEffect(
    React.useCallback(() => {
      if (fromDate && toDate) {
        fetchRecordsWithinDateRange(fromDate, toDate);
      }
    }, [fromDate, toDate])
  );

  // faisal code to search all envelopes and log them
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


  // faisal code to filter transactions by date
  const [transactions, setTransactions] = useState([]);
  // console.log('all transactions data :', transactions);
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

  // faisal code to search and log all Transactions
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

  // faisal code end here

  // new code for getting values for income from envelopes and for other values from Transactions table no date range

  const [income, setIncome] = useState(0);
  const [spending, setSpending] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [spendingByEnvelope, setSpendingByEnvelope] = useState([]);

  // new code to calculate values from envelopes and transactions array

  // useFocusEffect(
  //   useCallback(() => {
  //     // Calculate total income
  //     const totalIncome = envelopes
  //       .filter((envelope) => envelope.user_id === tempUserId)
  //       .reduce((sum, envelope) => sum + (envelope.amount || 0), 0);
  //     // console.log('income inside useFocusEffect: ', totalIncome);
  //     setIncome(totalIncome);

  //     // Calculate spending by envelope
  //     const spendingMap = {};

  //     transactions
  //       .filter((transaction) => transaction.user_id === tempUserId)
  //       .forEach((transaction) => {
  //         const { envelopeName, transactionType, transactionAmount } = transaction;

  //         if (!spendingMap[envelopeName]) {
  //           spendingMap[envelopeName] = 0;
  //         }

  //         if (transactionType === "Expense") {
  //           spendingMap[envelopeName] += transactionAmount || 0;
  //         } else if (transactionType === "Credit") {
  //           spendingMap[envelopeName] -= transactionAmount || 0;
  //         }
  //       });

  //     const envelopeData = Object.entries(spendingMap).map(([envelopeName, envelopeSpending]) => ({
  //       envelopeName,
  //       envelopeSpending,
  //     }));

  //     const totalSpending = envelopeData.reduce((sum, { envelopeSpending }) => sum + envelopeSpending, 0);

  //     setSpendingByEnvelope(envelopeData);
  //     setSpending(totalSpending);
  //   }, [tempUserId, envelopes, transactions])
  // );

  // useFocusEffect(
  //   useCallback(() => {
  //     setNetTotal(income - spending);
  //   }, [income, spending])
  // );

  // irfan code to count for each month
  

  const groupByMonth = (data, dateKey) => {
    return data.reduce((acc, item) => {
      const month = new Date(item[dateKey]).toLocaleString("default", { month: "short" });
      if (!acc[month]) acc[month] = [];
      acc[month].push(item);
      return acc;
    }, {});
  };

  // Process data month-by-month
  const envelopesByMonth = groupByMonth(envelopes, "fillDate");
  const transactionsByMonth = groupByMonth(transactions, "transactionDate");

  const monthlyData = Object.keys({ ...envelopesByMonth, ...transactionsByMonth }).map((month) => {
    const monthEnvelopes = envelopesByMonth[month] || [];
    const monthTransactions = transactionsByMonth[month] || [];

    const income = monthEnvelopes.reduce((sum, envelope) => sum + (envelope.amount || 0), 0);
    const spending = monthTransactions.reduce((sum, transaction) => {
      if (transaction.transactionType === "Expense") return sum + transaction.transactionAmount;
      if (transaction.transactionType === "Credit") return sum - transaction.transactionAmount;
      return sum;
    }, 0);

    const netTotal = income - spending;

    return { month, income, spending, netTotal };
  });

  console.log('monthlyData values:', monthlyData);


  // irfan code for getting values for income from envelopes no date range
  // useFocusEffect(
  //   useCallback(() => {
  //     db.transaction((tx) => {
  //       const incomeQuery = `
  //       SELECT SUM(amount) as totalIncome 
  //       FROM envelopes
  //       WHERE user_id = ?`;

  //       tx.executeSql(
  //         incomeQuery,
  //         [tempUserId], // Pass tempUserId here
  //         (_, { rows }) => {
  //           const totalIncome = rows.item(0).totalIncome || 0;
  //           console.log("Income Query Success:", incomeQuery, rows.item(0));
  //           setIncome(totalIncome);
  //         },
  //         (_, error) => {
  //           console.error("Income Query Error:", incomeQuery, error);
  //           return true;
  //         }
  //       );

  //       const spendingQuery = `
  //       SELECT envelopeName, 
  //         SUM(CASE WHEN transactionType = 'Expense' THEN transactionAmount ELSE 0 END) -
  //         SUM(CASE WHEN transactionType = 'Credit' THEN transactionAmount ELSE 0 END) AS envelopeSpending
  //       FROM Transactions
  //       WHERE user_id = ?
  //       GROUP BY envelopeName`;

  //       tx.executeSql(
  //         spendingQuery,
  //         [tempUserId], // Pass tempUserId here
  //         (_, { rows }) => {
  //           const envelopeData = [];
  //           let totalSpending = 0;

  //           for (let i = 0; i < rows.length; i++) {
  //             const { envelopeName, envelopeSpending } = rows.item(i);
  //             const spending = envelopeSpending || 0;
  //             envelopeData.push({ envelopeName, envelopeSpending: spending });
  //             totalSpending += spending;
  //           }

  //           console.log("Spending Query Success:", spendingQuery, envelopeData);
  //           setSpendingByEnvelope(envelopeData);
  //           setSpending(totalSpending);
  //         },
  //         (_, error) => {
  //           console.error("Spending Query Error:", spendingQuery, error);
  //           return true;
  //         }
  //       );
  //     });
  //   }, [tempUserId])
  // );


  // useFocusEffect(
  //   useCallback(() => {
  //     setNetTotal(income - spending);
  //   }, [income, spending])
  // );


  // Generate a list of months between fromDate and toDate start
  //  const [incomeVsSpending, setIncomeVsSpending] = useState([]);
  
  // // Format dates for SQLite queries (assuming the format needed is 'YYYY-MM-DD')
  // const formattedFromDateIS = moment('2024-01-01').format('YYYY-MM-DD'); // Example
  // const formattedToDateIS = moment('2024-12-31').format('YYYY-MM-DD'); // Example

  // // Generate a list of months between fromDate and toDate
  // useEffect(() => {
  //   const months = [];
  //   const start = moment(formattedFromDateIS);
  //   const end = moment(formattedToDateIS);

  //   // Generate an array of months in the date range
  //   while (start.isBefore(end) || start.isSame(end)) {
  //     months.push(start.format('YYYY-MM')); // e.g., "2024-11"
  //     start.add(1, 'month');
  //   }

  //   // Initialize the state with empty months
  //   console.log("Generated Months:", months); // Log to track generated months
  //   setIncomeVsSpending(months.map((month) => ({
  //     month,
  //     income: 0,
  //     spending: 0,
  //     netTotal: 0,
  //   })));
  // }, [formattedFromDateIS, formattedToDateIS]);

  // useFocusEffect(
  //   useCallback(() => {
  //     console.log("Fetching data for income and spending...");

  //     db.transaction((tx) => {
  //       // Query to get the monthly income totals
  //       const incomeQuery = `
  //         SELECT strftime('%Y-%m', fillDate) AS month, SUM(amount) as totalIncome
  //         FROM envelopes
  //         WHERE fillDate BETWEEN ? AND ?
  //         GROUP BY month
  //         ORDER BY month ASC`;

  //       console.log("Executing Income Query:", incomeQuery, [formattedFromDateIS, formattedToDateIS]);

  //       tx.executeSql(
  //         incomeQuery,
  //         [formattedFromDateIS, formattedToDateIS],
  //         (_, { rows }) => {
  //           const incomeData = [];
  //           console.log("Income Query Result:", rows); // Log the query result
  //           for (let i = 0; i < rows.length; i++) {
  //             const { month, totalIncome } = rows.item(i);
  //             incomeData.push({ month, income: totalIncome || 0 });
  //           }
  //           console.log("Income Data:", incomeData); // Log parsed income data

  //           // Merge income data with the existing state
  //           setIncomeVsSpending((prevData) => {
  //             return prevData.map((data) => {
  //               const incomeMonth = incomeData.find((item) => item.month === data.month);
  //               const income = incomeMonth ? incomeMonth.income : 0;
  //               const spendingMonth = spendingData.find((item) => item.month === data.month);
  //               const spending = spendingMonth ? spendingMonth.spending : 0;
  //               const netTotal = income - spending;
  //               return { ...data, income, spending, netTotal };
  //             });
  //           });
  //         },
  //         (_, error) => {
  //           console.error("Income Query Error:", incomeQuery, error);
  //           return true;
  //         }
  //       );

  //       // Query to get the monthly spending totals
  //       const spendingQuery = `
  //         SELECT strftime('%Y-%m', fillDate) AS month, SUM(amount - filledIncome) AS totalSpending
  //         FROM envelopes
  //         WHERE fillDate BETWEEN ? AND ?
  //         GROUP BY month
  //         ORDER BY month ASC`;

  //       console.log("Executing Spending Query:", spendingQuery, [formattedFromDateIS, formattedToDateIS]);

  //       tx.executeSql(
  //         spendingQuery,
  //         [formattedFromDateIS, formattedToDateIS],
  //         (_, { rows }) => {
  //           const spendingData = [];
  //           console.log("Spending Query Result:", rows); // Log the query result
  //           for (let i = 0; i < rows.length; i++) {
  //             const { month, totalSpending } = rows.item(i);
  //             spendingData.push({ month, spending: totalSpending || 0 });
  //           }
  //           console.log("Spending Data:", spendingData); // Log parsed spending data

  //           // Merge spending data with the existing state
  //           setIncomeVsSpending((prevData) => {
  //             return prevData.map((data) => {
  //               const spendingMonth = spendingData.find((item) => item.month === data.month);
  //               const spending = spendingMonth ? spendingMonth.spending : 0;
  //               const incomeMonth = incomeData.find((item) => item.month === data.month);
  //               const income = incomeMonth ? incomeMonth.income : 0;
  //               const netTotal = income - spending;
  //               return { ...data, income, spending, netTotal };
  //             });
  //           });
  //         },
  //         (_, error) => {
  //           console.error("Spending Query Error:", spendingQuery, error);
  //           return true;
  //         }
  //       );
  //     });
  //   }, [formattedFromDateIS, formattedToDateIS])
  // );

  // // Get month name from YYYY-MM format
  // const getMonthName = (monthString) => {
  //   const [year, month] = monthString.split('-');
  //   return `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
  // };

  // for individual counting of each month end here


  // for bar graph dynamically extract the months and their corresponding income and spending


  // Define bar colors
  const barsColors = {
    brightgreen: colors.brightgreen,
    danger: colors.danger,
  };

  // Create labels
  const labels = monthlyData.flatMap((item, index) => ["", item.month, ""]);

  // Create bar values (income and spending)
  const barValues = monthlyData.flatMap(item => [item.income, null, item.spending]);

  // Create bar colors
  const barColors = monthlyData.flatMap(() => [
    (opacity = 1) => barsColors.brightgreen,
    (opacity = 1) => 'transparent',
    (opacity = 1) => barsColors.danger,
  ]);

  // Set Y-axis scale with fixed intervals of 1000
  const maxYLabel = 6000; // Fixed maximum value for Y-axis
  const yInterval = 1000; // Fixed interval of 1000

  // Dynamically adjust bar width based on the total number of bars
  const totalBars = barValues.length;
  const barPercentage = Math.max(0.1, 1.4 - (totalBars - 0.1) * (1.5 / 24));

  // Scale bar values relative to maxYLabel
  const scaledBarValues = barValues.map(value => (value !== null ? (value / maxYLabel) * maxYLabel : null));

  // Prepare chart data
  const data = {
    labels: labels,
    datasets: [
      {
        data: scaledBarValues, // Scaled values for bar heights
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
    formatYLabel: (yValue) => {
      console.log('y value', yValue);
      // Format Y-axis labels in "0k, 1k, 2k..."
      return `${yValue / 1000}k`;
    },
  };

  // Output useful values
  console.log('maxYLabel: ', maxYLabel);
  console.log('yInterval: ', yInterval);



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
        {monthlyData.map(({ month, income, spending, netTotal }) => (
          <View key={month} style={styles.envelope_text_amount_view}>
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
  envelope_column_name_legend_month: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: hp('1%'),
  },
  envelope_column_name_legend: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
  },
  envelope_column: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
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
