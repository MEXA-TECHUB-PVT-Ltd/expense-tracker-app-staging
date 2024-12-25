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

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formattedFromDate, setFormattedFromDate] = useState('');
  const [formattedToDate, setFormattedToDate] = useState('');

  // Update formatted dates whenever fromDate or toDate changes
  React.useEffect(() => {
    if (fromDate) {
      setFormattedFromDate(formatDateSql(fromDate));
    }
    if (toDate) {
      setFormattedToDate(formatDateSql(toDate));
    }
  }, [fromDate, toDate]);

  // Set initial dates and format them
  useFocusEffect(
    useCallback(() => {
      const startOfMonth = moment().startOf('month').format('MMM D, YYYY'); // e.g., "Nov 1, 2024"
      const endOfMonth = moment().endOf('month').format('MMM D, YYYY');     // e.g., "Nov 30, 2024"

      // default dates
      setFromDate(startOfMonth);
      setToDate(endOfMonth);

      // For testing purposes, hardcoded dates
      // Uncomment the next two lines if you need these for testing
      // setFromDate('2025-01-01');
      // setToDate('2025-01-31');
    }, [])
  );

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

  // console.log('value of tempUserId in SpendingByEnvelope', tempUserId);

  // No need to manage tempUserId state manually
  useFocusEffect(
    useCallback(() => {
      // Log or handle tempUserId usage whenever the screen gains focus
      // console.log('useFocusEffect triggered with tempUserId:', tempUserId);
    }, [tempUserId])
  );

  // full faisal code start here

  // code for filtering and fetching all data from envelopes and transactions
  const [envelopes, setEnvelopes] = useState([]);

  // faisal code filter envelopes with date
  const fetchRecordsWithinDateRange = (formattedFromDate, formattedToDate) => {

    // console.log('formattedFromDate inside fetchRecordsWithinDateRange', formattedFromDate);
    // console.log('formattedToDate inside fetchRecordsWithinDateRange', formattedToDate);

    // const formattedFromDate = formatDateSql(fromDate);
    // const formattedToDate = formatDateSql(toDate);

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
      if (formattedFromDate && formattedToDate) {
        fetchRecordsWithinDateRange(formattedFromDate, formattedToDate);
      }
    }, [formattedFromDate, formattedToDate])
  );

  // code to search all envelopes and log them
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
  const filterTransactions = (formattedFromDate, formattedToDate) => {

    // console.log('formattedFromDate inside filterTransactions', formattedFromDate);
    // console.log('formattedToDate inside filterTransactions', formattedToDate);

    // const formattedFromDate = formatDateSql(fromDate);
    // const formattedToDate = formatDateSql(toDate);

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
      if (formattedFromDate && formattedToDate) {
        filterTransactions(formattedFromDate, formattedToDate);
      }
    }, [formattedFromDate, formattedToDate])
  );

  // code to search and log all Transactions
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

  // code for filtering and fetching all data end here

  // code for calculating data from filtered envelopes and transactions
  useFocusEffect(
    useCallback(() => {
      if (!envelopes || !transactions) return;

      // Calculate total income
      const totalIncome = envelopes.reduce((sum, envelope) => {
        return envelope.user_id === tempUserId ? sum + (envelope.amount || 0) : sum;
      }, 0);
      // console.log("Total Income:", totalIncome);
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

      // console.log("Spending By Envelope:", spendingByEnvelope);
      // console.log("Total Spending:", totalSpending);

      // Ensure totalSpending is positive before setting the state
      const positiveTotalSpending = Math.abs(totalSpending);

      setSpendingByEnvelope(spendingByEnvelope);
      setSpending(positiveTotalSpending);
    }, [envelopes, transactions, tempUserId])
  );

  // code for getting values
  const [income, setIncome] = useState(0);
  const [spending, setSpending] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [spendingByEnvelope, setSpendingByEnvelope] = useState([]);

  // Net total effect calculation based on income and spending also same so need to change again and again
  useFocusEffect(
    useCallback(() => {
      setNetTotal(income - spending);
    }, [income, spending])
  );

  // code to generate pie graph data
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

  
  // code to generate bar graph data
  // const maxValue = Math.max(income, spending);
  // const maxYAxisValue = Math.ceil(maxValue / 100) * 100;

  const [month, setMonth] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (fromDate) {
        // Extract the month from fromDate
        const extractedMonth = fromDate.split(' ')[0]; // Assuming the format is "Dec 1, 2024"
        setMonth(extractedMonth);
      }
    }, [fromDate]) // Add fromDate as a dependency
  );

  const data = {
    labels: [" ",month, " "],
    datasets: [
      {
        data: [income, 0, spending],
        colors: [
          (opacity = 1) => colors.brightgreen,
          (opacity = 1) => 'transparent',
          (opacity = 1) => colors.danger,
        ],
      },
    ],
  };


  const barChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientTo: "cyan",
    backgroundGradientToOpacity: 0,
    backgroundGradientFrom: "cyan",
    backgroundGradientFromOpacity: 0,
    color: (opacity = 1) => `#000000`,
    barPercentage: 0.2,
    propsForBackgroundLines: {
      stroke: "#808080",
      strokeWidth: 0.5,
      strokeDasharray: "",
    },
    propsForVerticalLabels: {
      fontSize: 12,
    },
    formatYLabel: (yValue) => parseInt(yValue, 10).toString(), // Remove decimals
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
            width={hp("14%")}
            height={hp("14%")}
            chartConfig={pieChartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"5"}
            center={[15, 5]}
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
            width={hp("18%")} // Matches parent width
            height={hp("23%")} // Matches parent height
            chartConfig={barChartConfig}
            yAxisSuffix=" " // No extra space for suffix
            fromZero={true}
            withHorizontalLabels={true}
            withInnerLines={true}
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
    backgroundColor: colors.white,
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
    width: hp('19%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hp('1%'),
    // backgroundColor: 'yellow',
  },
  bar_graph_view: {
    flexDirection: 'row',
    width: hp('20%'),
    height: hp('23%'),
    justifyContent: 'center',
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
