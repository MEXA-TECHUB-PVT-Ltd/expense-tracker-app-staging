import { StyleSheet, Text, View, StatusBar, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import colors from '../../constants/colors';
import Images from '../../constants/images';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { BarChart, PieChart } from "react-native-chart-kit";
import { useNavigation } from '@react-navigation/native';
import { db } from '../../database/database';
import randomColor from 'randomcolor';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import { getOrAssignEnvelopeColor } from '../../utils/envelopeColorManager';

const { width: screenWidth } = dimensions;

const Reports = () => {
  const navigation = useNavigation();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [formattedFromDate, setFormattedFromDate] = useState(null);
  const [formattedToDate, setFormattedToDate] = useState(null);

  console.log('value of formattedFromDate: ', formattedFromDate);
  console.log('value of formattedToDate: ', formattedToDate);

  // formate fromDate and toDate just to show on UI like this Nov 1, 2024
  useFocusEffect(
    React.useCallback(() => {
      const startOfMonth = moment().startOf('month').format('MMM D, YYYY'); // e.g., "Nov 1, 2024"
      const endOfMonth = moment().endOf('month').format('MMM D, YYYY');     // e.g., "Nov 30, 2024"
      setFromDate(startOfMonth);
      setToDate(endOfMonth);
      return undefined; // No cleanup required
    }, [])
  );

  // Format the dates after fromDate and toDate have been updated
  useEffect(() => {
    if (fromDate && toDate) {
      // const formattedFrom = moment(fromDate, 'MMM D, YYYY').format('ddd MMM DD YYYY HH:mm:ss [GMT]Z');
      // const formattedTo = moment(toDate, 'MMM D, YYYY').format('ddd MMM DD YYYY HH:mm:ss [GMT]Z');

      const formattedFromDate = formatDateSql(fromDate);
      const formattedToDate = formatDateSql(toDate);

      setFormattedFromDate(formattedFromDate);
      setFormattedToDate(formattedToDate);
    }
  }, [fromDate, toDate]); 

  // code to get user id from redux
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

  console.log('value of tempUserId in SpendingByEnvelope', tempUserId);

  // No need to manage tempUserId state manually
  useFocusEffect(
    useCallback(() => {
      // Log or handle tempUserId usage whenever the screen gains focus
      console.log('useFocusEffect triggered with tempUserId:', tempUserId);
    }, [tempUserId])
  );

  // full faisal code start here

  // faisal code start here for filtering and fetching all data from envelopes and transactions
  const [envelopes, setEnvelopes] = useState([]);

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

  // faisal code for filtering and fetching all data end here

  // code for calculating data from filtered envelopes and transactions

  useFocusEffect(
    useCallback(() => {
      if (!envelopes || !transactions) return;

      // Calculate total income
      const totalIncome = envelopes.reduce((sum, envelope) => {
        return envelope.user_id === tempUserId ? sum + (envelope.amount || 0) : sum;
      }, 0);
      console.log("Total Income:", totalIncome);
      setIncome(totalIncome);

      // Calculate spending by envelope
      const spendingByEnvelope = [];
      let totalSpending = 0;

      // Group transactions by envelopeName
      const groupedTransactions = transactions.reduce((acc, transaction) => {
        if (transaction.user_id === tempUserId) {
          const { envelopeName, transactionType, transactionAmount } = transaction;
          if (!acc[envelopeName]) {
            acc[envelopeName] = { envelopeName, totalExpense: 0, totalCredit: 0 };
          }
          if (transactionType === "Expense") {
            acc[envelopeName].totalExpense += transactionAmount || 0;
          } else if (transactionType === "Credit") {
            acc[envelopeName].totalCredit += transactionAmount || 0;
          }
        }
        return acc;
      }, {});

      // Calculate spending per envelope and total spending
      for (const envelopeName in groupedTransactions) {
        const { totalExpense, totalCredit } = groupedTransactions[envelopeName];
        const envelopeSpending = totalExpense - totalCredit;
        spendingByEnvelope.push({ envelopeName, envelopeSpending });
        totalSpending += envelopeSpending;
      }

      console.log("Spending By Envelope:", spendingByEnvelope);
      console.log("Total Spending:", totalSpending);

      setSpendingByEnvelope(spendingByEnvelope); // Set spending by envelope
      setSpending(totalSpending); // Set total spending
    }, [envelopes, transactions, tempUserId]) // Dependencies
  );


  // full faisal code end here

  // code for getting values

  const [income, setIncome] = useState(0);
  const [spending, setSpending] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [spendingByEnvelope, setSpendingByEnvelope] = useState([]);


  // irfan code for getting income from envelopes table and spending from transactions table but no date filter
  // useFocusEffect(
  //   useCallback(() => {
  //     db.transaction((tx) => {
  //       // console.log('value of tempUserId in reports inside transaction', tempUserId);

  //       // Query for total income filtered by user_id
  //       const incomeQuery = `
  //       SELECT SUM(amount) as totalIncome 
  //       FROM envelopes
  //       WHERE user_id = ?`;

  //       tx.executeSql(
  //         incomeQuery,
  //         [tempUserId],
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

  //       // Query for spending by envelope filtered by user_id
  //       const spendingQuery = `
  //       SELECT envelopeName, 
  //         SUM(CASE WHEN transactionType = 'Expense' THEN transactionAmount ELSE 0 END) -
  //         SUM(CASE WHEN transactionType = 'Credit' THEN transactionAmount ELSE 0 END) AS envelopeSpending
  //       FROM Transactions
  //       WHERE user_id = ?
  //       GROUP BY envelopeName`;

  //       tx.executeSql(
  //         spendingQuery,
  //         [tempUserId],
  //         (_, { rows }) => {
  //           const envelopeData = [];
  //           let totalSpending = 0;

  //           // Loop over rows to get individual envelope spending
  //           for (let i = 0; i < rows.length; i++) {
  //             const { envelopeName, envelopeSpending } = rows.item(i);
  //             const spending = envelopeSpending || 0; // Handle null values
  //             envelopeData.push({ envelopeName, envelopeSpending: spending });
  //             totalSpending += spending;
  //           }

  //           console.log("Spending Query Success:", spendingQuery, envelopeData);
  //           setSpendingByEnvelope(envelopeData); // Set individual envelope spending
  //           setSpending(totalSpending); // Set total spending
  //         },
  //         (_, error) => {
  //           console.error("Spending Query Error:", spendingQuery, error);
  //           return true;
  //         }
  //       );
  //     });
  //   }, []) // Removed dependency on dates since it's a general query
  // );



  // Net total effect calculation based on income and spending also same so need to change again and again
  useFocusEffect(
    useCallback(() => {
      setNetTotal(income - spending);
    }, [income, spending])
  );

  const [pieData, setPieData] = useState([]);

  // This function generates pie chart data and ensures consistent envelope colors
  useEffect(() => {
    const generatePieData = async () => {
      const data = await Promise.all(
        spendingByEnvelope
          .filter(item => (item.envelopeSpending || 0) > 0)  // Filter out negative spending
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

  

  // for bar graph
  // const maxValue = Math.max(income, spending);
  // const maxYAxisValue = Math.ceil(maxValue / 100) * 100;

  const data = {
    labels: [fromDate],
    datasets: [
      {
        data: [income, spending],
        colors: [
          (opacity = 1) => colors.brightgreen,
          (opacity = 1) => colors.danger,
        ],
      },
    ],
  };

  const maxValue = Math.max(income, spending); // Get the maximum value between income and spending
  const roundedMaxValue = Math.ceil(maxValue / 1000) * 1000; // Round it up to the nearest 1000
  const yInterval = roundedMaxValue / 5; // Divide the max value by 5 to get the interval for Y-axis labels

  const barChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientTo: "cyan",
    backgroundGradientToOpacity: 0,
    backgroundGradientFrom: "cyan",
    backgroundGradientFromOpacity: 0,
    color: (opacity = 1) => `#000000`,
    barPercentage: 0.2,
    propsForBackgroundLines: {
      stroke: "#000000",
      strokeWidth: 1,
      strokeDasharray: "",
    },
    propsForVerticalLabels: {
      fontSize: 12,
    },
    // formatYLabel: (yValue) => `${Math.ceil(yValue / 100) * 100}`,
    formatYLabel: (yValue) => {
      // Format the Y-axis labels based on the interval
      return `${Math.ceil(yValue / yInterval) * yInterval}`;
    },
  };





  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.munsellgreen} />

      <TouchableOpacity
        onPress={() => navigation.navigate("SpendingByEnvelope")}
        style={styles.touchableOpacity}
      >
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
            width={hp("10%")}
            height={hp("10%")}
            chartConfig={pieChartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"5"}
            center={[10, 5]}
            hasLegend={false}
          />
        </View>

        <View style={styles.details_view}>
          <View style={styles.title_subtitle_view}>
            <Text style={styles.title_text}>Spending by Envelope</Text>
            <Text style={styles.subtitle_text}>
              {fromDate} - {toDate}
            </Text>
          </View>

          <View style={styles.envelopes_details_view}>
            <View style={styles.text_amount_total_view}>
              <Text style={styles.text_total_spending}>Total Spending</Text>
              <Text style={styles.amount_total_spending}>{spending}</Text>
            </View>

            <View style={styles.txt_amt_parent_view}>
              {spendingByEnvelope
                .filter(item => item.envelopeSpending > 0)
              .map((item, index) => {
                const envelopeName = item.envelopeName;
                const envelopeSpending = item.envelopeSpending || 0;
                console.log('value of individual envelope spending is: ', envelopeSpending);

                // const envelopeColor = pieData[index]?.color || randomColor();
                const envelopeColor = pieData[index]?.color || randomColor();

                return (
                  <View style={styles.text_amount_view} key={index}>
                    <View
                      style={[styles.legendSquare, { backgroundColor: envelopeColor }]}
                    />
                    <View style={styles.txt_amt_view}>
                      <Text style={styles.text}>{envelopeName}</Text>
                      <Text style={styles.amount}>{envelopeSpending}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

          </View>
        </View>
      </TouchableOpacity>


      {/* code to show pie graph end here */}

      <TouchableOpacity
        onPress={() => navigation.navigate('IncomeVsSpending')}
        style={styles.bar_touchableOpacity}
      >

        <View style={styles.bar_graph_view}>
          <BarChart
            data={data}
            width={hp("20%")} // Matches parent width
            height={hp("23%")} // Matches parent height
            chartConfig={barChartConfig}
            yAxisSuffix=" " // No extra space for suffix
            fromZero={true}
            withHorizontalLabels={true}
            withInnerLines={false}
            withCustomBarColorFromData={true}
            flatColor={true}
            showBarTops={false}
            yAxisLabel=""
            verticalLabelRotation={0} // Ensure labels are horizontal
          />
        </View>

        <View style={styles.details_view}>
          <View style={styles.title_subtitle_view}>
            <Text style={styles.title_text}>Income vs Spending</Text>
            <Text style={styles.subtitle_text}>{fromDate} - {toDate}</Text>
          </View>
          <View style={styles.envelopes_details_view}>
            <View style={styles.text_amount_view}>
              <View style={[styles.legendSquare, { backgroundColor: colors.brightgreen }]} />
              <View style={styles.txt_amt_view}>
                <Text style={styles.text}>Income</Text>
                <Text style={styles.amount}>{income}</Text>
              </View>
            </View>
            <View style={styles.text_amount_view}>
              <View style={[styles.legendSquare, { backgroundColor: 'red' }]} />
              <View style={styles.txt_amt_view}>
                <Text style={styles.text}>Spending</Text>
                <Text style={styles.amount}>{spending}</Text>
              </View>
            </View>
            <View style={styles.text_amount_view}>
              <View style={[styles.legendSquare, { backgroundColor: 'transparent' }]} />
              <View style={styles.txt_amt_view}>
                <Text style={styles.text_total_spending}>Net Total</Text>
                <Text style={styles.amount_total_spending}>{netTotal}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default Reports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  name_percent_amt: {
    color: colors.black,
  },
  touchableOpacity: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    marginHorizontal: hp('1.5%'),
    paddingHorizontal: hp('1.5%'),
    paddingVertical: hp('2%'),
    marginVertical: hp('1%'),
    elevation: 5,
    borderRadius: 2,
  },
  bar_touchableOpacity: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    marginHorizontal: hp('1.5%'),
    paddingRight: hp('1.5%'),
    paddingVertical: hp('2%'),
    marginVertical: hp('1%'),
    elevation: 5,
    borderRadius: 2,
  },
  graph_view: {
    width: hp('14%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar_graph_view: {
    flexDirection: 'row',
    width: hp('20%'),
    height: hp('23%'),
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: hp('1.5%'),
    overflow: 'hidden',
    // backgroundColor: 'pink',
  },
  details_view: {
    flex: 1,
  },
  title_subtitle_view: {
    marginVertical: hp('1%'),
  },
  title_text: {
    fontSize: hp('2.3%'),
    fontWeight: 'bold',
    color: colors.black,
  },
  subtitle_text: {
    fontSize: hp('1.7%'),
    color: colors.black,
  },
  envelopes_details_view: {},
  txt_amt_parent_view: {
    marginVertical: hp('0.5%'),
    marginBottom: hp('1.5%'),
  },
  text_amount_view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendSquare: {
    width: 10,
    height: 10,
    marginRight: 8,
  },
  txt_amt_view: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: hp('2%'),
    color: colors.black,
    marginRight: hp('1%'),
  },
  amount: {
    fontSize: hp('2%'),
    color: colors.black,
  },
  text_amount_total_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp('0.2%'),
  },
  text_total_spending: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: colors.black,
  },
  amount_total_spending: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: colors.black,
  },
});
