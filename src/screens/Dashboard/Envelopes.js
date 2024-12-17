import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, SectionList, ImageBackground, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Divider } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { useNavigationState } from '@react-navigation/native';
import { VectorIcon } from '../../constants/vectoricons';
import { useNavigation } from '@react-navigation/native'
import { db, fetchTotalEnvelopesAmount, fetchTotalEnvelopesAmountYearly, fetchTotalEnvelopesAmountMonthly, fetchTotalEnvelopesAmountGoal } from '../../database/database'
import CustomProgressBar from '../../components/CustomProgressBar';
import { useSelector } from 'react-redux';
import { getUserData } from '../../utils/authUtils';
import moment from 'moment';
import { formatDateSql } from '../../utils/DateFormatter';
import Images from '../../constants/images';

const Envelopes = () => {
  const navigation = useNavigation();

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector(state => state.user.user_id);
  // console.log('value of user_id in state inside envelopes', user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  // console.log('value of tempUserId in state inside envelopes', tempUserId);
  useFocusEffect(
    useCallback(() => {
      // console.log(' ^^^^^^^ useFocusEffect of tempUserId called ^^^^^^^^ ');
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  // to get current month dates and then formate them into our sql date formate
  const [formattedFromDate, setFormattedFromDate] = useState('');
  const [formattedToDate, setFormattedToDate] = useState('');
  // console.log('Formatted From Date in Envelopes:', formattedFromDate);
  // console.log('Formatted To Date in Envelopes:', formattedToDate);

  useFocusEffect(
    useCallback(() => {
      // console.log(' DDDDDDDDDDD useFocusEffect of dates called DDDDDDDDDDDD ');
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

  // for yearly filtering of envelopes
  const startOfYear = moment().startOf('year').toISOString();
  const endOfYear = moment().endOf('year').toISOString();
  // Format the dates using the formatDateSql function
  const formattedFromDateYearly = formatDateSql(startOfYear);
  const formattedToDateYearly = formatDateSql(endOfYear);

  // console.log('++++++++++++++++       formattedFromDateYearly in envelopes screen: ', formattedFromDateYearly);
  // console.log('++++++++++++++++       formattedToDateYearly in envelopes screen: ', formattedToDateYearly);


  // for now we are not showing it but if we need to show i already have it, below i have view may be commented out in which showing this
  const [totalIncome, setTotalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate);
    }, [tempUserId, formattedFromDate, formattedToDate])
  );

  // for showing total sum of all envelopes incomes single sumup of all for monthly
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmountMonthly(setMonthlyIncome, tempUserId, formattedFromDate, formattedToDate);
    }, [tempUserId, formattedFromDate, formattedToDate])
  );

  // for showing total sum of all envelopes incomes single sumup of all for every year
  // modify its dates to yearly if necessary
  const [yearlyIncome, setYearlyIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmountYearly(setYearlyIncome, tempUserId, formattedFromDateYearly, formattedToDateYearly);
    }, [tempUserId, formattedFromDateYearly, formattedToDateYearly])
  );

  // for showing total sum of all envelopes incomes single sumup of all for goals
  const [goalIncome, setGoalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmountGoal(setGoalIncome, tempUserId, formattedFromDate, formattedToDate);
    }, [tempUserId, formattedFromDate, formattedToDate])
  );

  // for unallocatedAmount from Unallocated table
  const [unallocatedIncome, setUnallocatedIncome] = useState(0);
  // query for getting total unallocattedIncome
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
          setUnallocatedIncome(totalUnallocatedIncome);
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


  // for flatlist
  const [filledIncomes, setFilledIncomes] = useState([]);

  const [envelopes, setEnvelopes] = useState([]);
  // console.log('state of envelopes in envelopes screen-=-=-=-=--=-=-=: ', envelopes); 

  // Group the envelopes by budgetPeriod for section list to show data by Month year and goal
  const groupedEnvelopes = [
    { title: 'Monthly', data: envelopes.filter(item => item.budgetPeriod === 'Monthly') },
    { title: 'Every Year', data: envelopes.filter(item => item.budgetPeriod === 'Every Year') },
    { title: 'Goal', data: envelopes.filter(item => item.budgetPeriod === 'Goal') },
    // { title: 'Unallocated', data: [{ envelopeId: -100, envelopeName: '(Available)', filledIncome: 336, amount: 336 }] },
    {
      title: 'Unallocated',
      data: [{ envelopeId: -100000, envelopeName: '(Available)', filledIncome: unallocatedIncome, amount: unallocatedIncome }]
    }
  ];

  // const fetchEnvelopes = useCallback(() => {
  //   // console.log('Fetching envelopes with:', tempUserId, formattedFromDate, formattedToDate);
  //   getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate);
  //   fetchAndLogFilledIncomes(tempUserId);
  // }, [tempUserId, formattedFromDate, formattedToDate]);

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchEnvelopes();
  //   }, [fetchEnvelopes])
  // );

  useFocusEffect(
    useCallback(() => {
      getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
      fetchAndLogFilledIncomes(tempUserId);
    }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly])
  );

  // function to get all envelopes their rows
  // const getAllEnvelopes = (callback, tempUserId, formattedFromDate, formattedToDate) => {
  //   // console.log('running getAllEnvelopes...');
  //   db.transaction(tx => {
  //     const sqlQuery = `
  //     SELECT * FROM envelopes 
  //     WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //     ORDER BY orderIndex
  //   `;
  //     tx.executeSql(
  //       sqlQuery,
  //       [tempUserId, formattedFromDate, formattedToDate],
  //       (_, results) => {
  //         // console.log('SQL Results:', results.rows);
  //         if (results.rows && results.rows.length > 0) {
  //           let envelopesArray = [];
  //           for (let i = 0; i < results.rows.length; i++) {
  //             envelopesArray.push(results.rows.item(i));
  //           }
  //           callback(envelopesArray);
  //         } else {
  //           callback([]);
  //         }
  //       },
  //       (_, error) => {
  //         console.log('Error getting envelopes:', error);
  //         return true;
  //       }
  //     );
  //   }, (error) => {
  //     console.log('Transaction Error:', error);
  //   }, () => {
  //     // console.log('Transaction Success');
  //   });
  // };


  // modify this not to filter Every Year envelopes on basis of fillDate...
  // for now it works for copy but duplicated..just copy yearly at new year...keep showing yearly envelopes..

  const getAllEnvelopes = (setEnvelopes, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly) => {
    // console.log('running getAllEnvelopes...');
    db.transaction(tx => {
      const sqlQuery = `
      SELECT * FROM envelopes 
      WHERE user_id = ? 
      AND (
        (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?)
        OR (budgetPeriod = 'Every Year' AND fillDate BETWEEN ? AND ?)
      )
      ORDER BY orderIndex;
    `;

      tx.executeSql(
        sqlQuery,
        [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly],
        (_, results) => {
          // console.log('SQL Results:', results.rows);
          if (results.rows && results.rows.length > 0) {
            let envelopesArray = [];
            for (let i = 0; i < results.rows.length; i++) {
              envelopesArray.push(results.rows.item(i));
            }
            setEnvelopes(envelopesArray);
          } else {
            setEnvelopes([]);
          }
        },
        (_, error) => {
          console.log('Error getting envelopes:', error);
          setEnvelopes([]); // Handle errors by setting an empty state
          return true;
        }
      );
    }, (error) => {
      console.log('Transaction Error:', error);
      setEnvelopes([]); // Handle transaction errors
    }, () => {
      // console.log('Transaction Success');
    });
  };


  // works perfectly fine and filter monthly and yearly but once it is new year it still shows all yearly envelopes
  //   const getAllEnvelopes = (setEnvelopes, tempUserId, formattedFromDate, formattedToDate) => {
  //     // console.log('running getAllEnvelopes...');
  //     db.transaction(tx => {
  //       const sqlQuery = `
  //   SELECT * FROM envelopes 
  //   WHERE user_id = ? 
  //   AND (
  //     (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?) 
  //     OR (budgetPeriod = 'Every Year')
  //   )
  //   ORDER BY orderIndex;
  // `;

  //       tx.executeSql(
  //         sqlQuery,
  //         [tempUserId, formattedFromDate, formattedToDate],
  //         (_, results) => {
  //           // console.log('SQL Results:', results.rows);
  //           if (results.rows && results.rows.length > 0) {
  //             let envelopesArray = [];
  //             for (let i = 0; i < results.rows.length; i++) {
  //               envelopesArray.push(results.rows.item(i));
  //             }
  //             setEnvelopes(envelopesArray);
  //           } else {
  //             setEnvelopes([]);
  //           }
  //         },
  //         (_, error) => {
  //           console.log('Error getting envelopes:', error);
  //           setEnvelopes([]);  // Handle errors by setting an empty state
  //           return true;
  //         }
  //       );
  //     }, (error) => {
  //       console.log('Transaction Error:', error);
  //       setEnvelopes([]);  // Handle transaction errors
  //     }, () => {
  //       // console.log('Transaction Success');
  //     });
  //   };

  // Pull-to-refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    setRefreshing(false);
  };

  // this logs all envelopes in table no date range
  const fetchAndLogFilledIncomes = (tempUserId) => {
    // console.log('running fetchAndLogFilledIncomes...')
    // console.log('fetchAndLogFilledIncomes called with tempUserId:', tempUserId);
    db.transaction(tx => {
      tx.executeSql(
        `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id FROM envelopes WHERE user_id = ?;`,
        [tempUserId],
        (tx, results) => {
          const rows = results.rows;
          let records = [];

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            // console.log(`Row ${i} item:`, item);
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
          // console.log('All records in Envelopes table:', records);
        },
        (tx, error) => {
          console.error('Error fetching filled incomes:', error);
        }
      );
    });
  };


  // Function to copy and insert envelopes for the next month version 1
  // const copyAndInsertNextMonthEnvelopesAndIncome = (tempUserId) => {
  //   const startOfPreviousMonth = moment().startOf('month');
  //   const endOfPreviousMonth = moment().endOf('month');
  //   // const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //   // const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //   const nextMonthStart = moment().add(1, 'month').startOf('month');

  //   // Format the dates using the formatDateSql function before using them in queries
  //   const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //   const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //   const formattedNextMonthStart = formatDateSql(nextMonthStart);

  //   // const formattedStartOfPreviousMonth = '2025-01-01'; // jan 1st hardcoded for testing
  //   // const formattedEndOfPreviousMonth = '2025-01-31';   // jan 31 hardcoded for testing
  //   // const formattedNextMonthStart = '2025-02-01';       // february 1st hardcoded for testing

  //   console.log('--- COPY & INSERT TASK STARTED ---');
  //   console.log('Formatted Start of Previous Month in copy $ insert:', formattedStartOfPreviousMonth);
  //   console.log('Formatted End of Previous Month in copy $ insert:', formattedEndOfPreviousMonth);
  //   console.log('Formatted Next Month Start in copy $ insert:', formattedNextMonthStart);

  //   db.transaction(tx => {
  //     /*** ENVELOPES LOGIC ***/
  //     const envelopesSelectQuery = `
  //     SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //     FROM envelopes 
  //     WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //     ORDER BY orderIndex;
  //   `;

  //     console.log('Executing envelopes SELECT query...');
  //     tx.executeSql(
  //       envelopesSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         console.log('Envelopes SELECT query successful. Rows fetched:', results.rows.length);
  //         if (results.rows.length > 0) {
  //           let newEnvelopes = [];

  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             console.log('Fetched Envelope:', item);
  //             newEnvelopes.push([
  //               item.envelopeName,
  //               item.amount,
  //               item.budgetPeriod,
  //               formattedNextMonthStart,
  //               0, // Set filledIncome to 0
  //               item.user_id,
  //               item.orderIndex
  //             ]);
  //           }

  //           const envelopesInsertQuery = `
  //           INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //           VALUES (?, ?, ?, ?, ?, ?, ?);
  //         `;

  //           console.log('Inserting new envelopes...');
  //           newEnvelopes.forEach(env => {
  //             console.log('Inserting Envelope:', env);
  //             tx.executeSql(
  //               envelopesInsertQuery,
  //               env,
  //               () => {
  //                 console.log('Envelope inserted successfully:', env);
  //               },
  //               (_, error) => {
  //                 console.error('Error inserting envelope:', env, error);
  //               }
  //             );
  //           });
  //         } else {
  //           console.log('No envelopes found for the previous month');
  //         }
  //       },
  //       (_, error) => {
  //         console.error('Error fetching previous month envelopes:', error);
  //       }
  //     );

  //     /*** INCOME LOGIC ***/
  //     const incomeSelectQuery = `
  //     SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //     FROM Income 
  //     WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //   `;

  //     console.log('Executing income SELECT query...');
  //     tx.executeSql(
  //       incomeSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newIncomeRecords = [];

  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             console.log('Fetched Income Record:', item);
  //             newIncomeRecords.push([
  //               item.accountName,
  //               item.monthlyAmount,
  //               item.monthlyAmount, // sets budgetAmount initially equal to monthlyAmount
  //               item.budgetPeriod,
  //               formattedNextMonthStart,
  //               item.user_id
  //             ]);
  //           }

  //           const incomeInsertQuery = `
  //           INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //           VALUES (?, ?, ?, ?, ?, ?);
  //         `;

  //           console.log('Inserting new income records...');
  //           newIncomeRecords.forEach(income => {
  //             console.log('Inserting Income Record:', income);
  //             tx.executeSql(
  //               incomeInsertQuery,
  //               income,
  //               () => {
  //                 console.log('Income record inserted successfully:', income);
  //               },
  //               (_, error) => {
  //                 console.error('Error inserting income record:', income, error);
  //               }
  //             );
  //           });
  //         } else {
  //           console.log('No income records found for the previous month');
  //         }
  //       },
  //       (_, error) => {
  //         console.error('Error fetching previous month income records:', error);
  //       }
  //     );
  //   });
  // };

  // const triggerStartOfNextMonthTask = (tempUserId) => {
  //   const now = moment(); // gpt added this extra line

  //   const startOfNextMonth = moment().add(1, 'month').startOf('month');
  //   const startOfCurrentMonth = moment().startOf('month'); // gpt added this extra line

  //   console.log('Current Date:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Next Month:', startOfNextMonth.format('YYYY-MM-DD HH:mm:ss'));

  //   // Check if we're already in the "next month" logic based on stored state
  //   if (now.isAfter(startOfCurrentMonth) && now.isBefore(startOfNextMonth)) {
  //     console.log('It is already the start of the next month. Running tasks immediately...');
  //     copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     return;
  //   }

  //   const timeLeft = startOfNextMonth.diff(now); // gpt added these
  //   console.log('Time left until next month (ms):', timeLeft); // gpt added these

  //   // const timeLeft = startOfNextMonth.diff(moment());
  //   // const timeLeft = 10*1000; // for static testing timer of 10 seconds

  //   if (timeLeft > 0) {
  //     console.log('Setting timeout to trigger at the start of the next month...');
  //     setTimeout(() => {
  //       console.log('New month started! Running the copy and insert tasks...');
  //       copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     }, timeLeft);
  //   } else {
  //     console.log("It's already past the start of the next month. Running tasks immediately...");
  //     copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //   }
  // };

  // Function to copy and insert envelopes for the next month version 2 copying but duplicate records..no checks
  // const copyAndInsertNextMonthEnvelopesAndIncome = (tempUserId) => {
  //   // Calculate date ranges
  //   const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //   const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //   const startOfCurrentMonth = moment().startOf('month'); // Updated for clarity

  //   // Format dates for SQL
  //   const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //   const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //   const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

  //   console.log('--- COPY & INSERT TASK STARTED ---');
  //   console.log('Formatted Start of Previous Month:', formattedStartOfPreviousMonth);
  //   console.log('Formatted End of Previous Month:', formattedEndOfPreviousMonth);
  //   console.log('Formatted Start of Current Month:', formattedStartOfCurrentMonth);

  //   db.transaction(tx => {
  //     /*** ENVELOPES LOGIC ***/
  //     const envelopesSelectQuery = `
  //       SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //       FROM envelopes 
  //       WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //       ORDER BY orderIndex;
  //     `;

  //     console.log('Executing envelopes SELECT query...');
  //     tx.executeSql(
  //       envelopesSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newEnvelopes = [];
  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             newEnvelopes.push([
  //               item.envelopeName,
  //               item.amount,
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth, // Set fill date to the current month start
  //               0, // Reset filledIncome
  //               item.user_id,
  //               item.orderIndex
  //             ]);
  //           }

  //           const envelopesInsertQuery = `
  //             INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //             VALUES (?, ?, ?, ?, ?, ?, ?);
  //           `;
  //           newEnvelopes.forEach(env => {
  //             tx.executeSql(
  //               envelopesInsertQuery,
  //               env,
  //               () => console.log('Envelope inserted successfully:', env),
  //               (_, error) => console.error('Error inserting envelope:', env, error)
  //             );
  //           });
  //         } else {
  //           console.log('No envelopes found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month envelopes:', error)
  //     );

  //     /*** INCOME LOGIC ***/
  //     const incomeSelectQuery = `
  //       SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //       FROM Income 
  //       WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //     `;

  //     console.log('Executing income SELECT query...');
  //     tx.executeSql(
  //       incomeSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newIncomeRecords = [];
  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             newIncomeRecords.push([
  //               item.accountName,
  //               item.monthlyAmount,
  //               item.monthlyAmount, // budgetAmount = monthlyAmount
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth, // Set incomeDate to current month start
  //               item.user_id
  //             ]);
  //           }

  //           const incomeInsertQuery = `
  //             INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //             VALUES (?, ?, ?, ?, ?, ?);
  //           `;
  //           newIncomeRecords.forEach(income => {
  //             tx.executeSql(
  //               incomeInsertQuery,
  //               income,
  //               () => console.log('Income record inserted successfully:', income),
  //               (_, error) => console.error('Error inserting income record:', income, error)
  //             );
  //           });
  //         } else {
  //           console.log('No income records found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month income records:', error)
  //     );
  //   });
  // };

  // const triggerStartOfMonthTask = (tempUserId) => {
  //   const now = moment();
  //   const startOfCurrentMonth = moment().startOf('month');

  //   console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

  //   // If today is the first day of the current month
  //   if (now.isSame(startOfCurrentMonth, 'day')) {
  //     console.log('It is the start of the current month. Running tasks immediately...');
  //     copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //   } else {
  //     // Calculate time until the next month's start
  //     const timeLeft = startOfCurrentMonth.add(1, 'month').diff(now);
  //     console.log('Setting timeout to trigger at the start of the next month...');

  //     setTimeout(() => {
  //       console.log('New month started! Running the copy and insert tasks...');
  //       copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     }, timeLeft);
  //   }
  // };

  // useEffect(() => {
  //   triggerStartOfMonthTask(tempUserId);
  // }, [tempUserId]);

  // Function to copy and insert envelopes for the next month version 3 checks applied dont duplicate and if there is delay like user
  // opens app after few days later then start of new month

  //   let functionRunCount = 0;
  //  const copyAndInsertNextMonthEnvelopesAndIncome = async (tempUserId) => {

  //    functionRunCount += 1;  // Increment the counter each time the function is called
  //    console.log(`Function copyAndInsertNextMonthEnvelopesAndIncome run count: ${functionRunCount}`);

  //    console.log('Function is running for the first time.');
  //     // Calculate date ranges
  //     const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //     const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //     const startOfCurrentMonth = moment().startOf('month'); // Updated for clarity

  //     // Format dates for SQL
  //     const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //     const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //     const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

  //     console.log('--- COPY & INSERT TASK STARTED ---');
  //     console.log('Formatted Start of Previous Month:', formattedStartOfPreviousMonth);
  //     console.log('Formatted End of Previous Month:', formattedEndOfPreviousMonth);
  //     console.log('Formatted Start of Current Month:', formattedStartOfCurrentMonth);

  //     db.transaction(tx => {
  //       /*** ENVELOPES LOGIC ***/
  //       const envelopesSelectQuery = `
  //       SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //       FROM envelopes 
  //       WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //       ORDER BY orderIndex;
  //     `;

  //       console.log('Executing envelopes SELECT query...');
  //       tx.executeSql(
  //         envelopesSelectQuery,
  //         [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //         (_, results) => {
  //           if (results.rows.length > 0) {
  //             let newEnvelopes = [];
  //             for (let i = 0; i < results.rows.length; i++) {
  //               const item = results.rows.item(i);
  //               newEnvelopes.push([
  //                 item.envelopeName,
  //                 item.amount,
  //                 item.budgetPeriod,
  //                 formattedStartOfCurrentMonth, // Set fill date to the current month start
  //                 0, // Reset filledIncome
  //                 item.user_id,
  //                 item.orderIndex
  //               ]);
  //             }

  //             const envelopesInsertQuery = `
  //             INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //             VALUES (?, ?, ?, ?, ?, ?, ?);
  //           `;
  //             newEnvelopes.forEach(env => {
  //               tx.executeSql(
  //                 envelopesInsertQuery,
  //                 env,
  //                 () => console.log('Envelope inserted successfully:', env),
  //                 (_, error) => console.error('Error inserting envelope:', env, error)
  //               );
  //             });
  //           } else {
  //             console.log('No envelopes found for the previous month.');
  //           }
  //         },
  //         (_, error) => console.error('Error fetching previous month envelopes:', error)
  //       );

  //       /*** INCOME LOGIC ***/
  //       const incomeSelectQuery = `
  //       SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //       FROM Income 
  //       WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //     `;

  //       console.log('Executing income SELECT query...');
  //       tx.executeSql(
  //         incomeSelectQuery,
  //         [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //         (_, results) => {
  //           if (results.rows.length > 0) {
  //             let newIncomeRecords = [];
  //             for (let i = 0; i < results.rows.length; i++) {
  //               const item = results.rows.item(i);
  //               newIncomeRecords.push([
  //                 item.accountName,
  //                 item.monthlyAmount,
  //                 item.monthlyAmount, // budgetAmount = monthlyAmount
  //                 item.budgetPeriod,
  //                 formattedStartOfCurrentMonth, // Set incomeDate to current month start
  //                 item.user_id
  //               ]);
  //             }

  //             const incomeInsertQuery = `
  //             INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //             VALUES (?, ?, ?, ?, ?, ?);
  //           `;
  //             newIncomeRecords.forEach(income => {
  //               tx.executeSql(
  //                 incomeInsertQuery,
  //                 income,
  //                 () => console.log('Income record inserted successfully:', income),
  //                 (_, error) => console.error('Error inserting income record:', income, error)
  //               );
  //             });
  //           } else {
  //             console.log('No income records found for the previous month.');
  //           }
  //         },
  //         (_, error) => console.error('Error fetching previous month income records:', error)
  //       );
  //     });
  //   };

  // const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
  //   const now = moment();
  //   const startOfCurrentMonth = moment().startOf('month');

  //   console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

  //   // Get the last copy month from AsyncStorage
  //   const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');
  //   console.log('Last Copy Month from AsyncStorage:', lastCopyMonth);

  //   // Trigger tasks if lastCopyMonth is null, undefined, or different from the current month
  //   if (!lastCopyMonth || lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
  //     console.log('lastCopyMonth is null or outdated. Triggering tasks...');

  //     // If today is the first day of the current month
  //     if (now.isSame(startOfCurrentMonth, 'day')) {
  //       console.log('It is the start of the current month. Running tasks immediately...');
  //       await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     } else {
  //       // Calculate time until the next month's start if not on the first day
  //       const timeLeft = startOfCurrentMonth.add(1, 'month').diff(now);
  //       console.log('Setting timeout to trigger at the start of the next month...');
  //       setTimeout(async () => {
  //         console.log('New month started! Running the copy and insert tasks...');
  //         await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //       }, timeLeft);
  //     }
  //     // Save the current month as the last copied month after successfully running tasks
  //     await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
  //   } else {
  //     console.log('Data already copied for this month. Skipping the task.');
  //   }
  // };

  // const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
  //   const now = moment();
  //   const startOfCurrentMonth = moment().startOf('month');

  //   console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

  //   // Get the last copy month from AsyncStorage
  //   const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');
  //   console.log('Last Copy Month from AsyncStorage:', lastCopyMonth);

  //   // Check if the task needs to be run
  //   if (!lastCopyMonth || lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
  //     console.log('lastCopyMonth is null or outdated. Triggering tasks...');

  //     try {
  //       // Run the copy and insert tasks
  //       await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //       console.log('Tasks completed successfully.');

  //       // Update the flag after successful completion
  //       await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
  //       console.log('Updated lastCopyMonth in AsyncStorage:', startOfCurrentMonth.format('YYYY-MM'));
  //     } catch (error) {
  //       // Handle errors in task execution
  //       console.error('Error occurred during copy and insert tasks:', error);
  //     }
  //   } else {
  //     console.log('Data already copied for this month. Skipping the task.');
  //   }
  // };

  // useEffect(() => {
  //   checkAndTriggerStartOfMonthTask(tempUserId);
  // }, [tempUserId]);

  // version 4

  // let functionRunCount = 0;

  // const copyAndInsertNextMonthEnvelopesAndIncome = async (tempUserId) => {
  //   try {
  //     functionRunCount += 1;
  //     console.log(`Function copyAndInsertNextMonthEnvelopesAndIncome run count: ${functionRunCount}`);

  //     const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //     const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //     const startOfCurrentMonth = moment().startOf('month');

  //     const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //     const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //     const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

  //     console.log('--- COPY & INSERT TASK STARTED ---');
  //     console.log('Formatted Start of Previous Month:', formattedStartOfPreviousMonth);
  //     console.log('Formatted End of Previous Month:', formattedEndOfPreviousMonth);
  //     console.log('Formatted Start of Current Month:', formattedStartOfCurrentMonth);

  //     db.transaction(tx => {
  //       // Fetch previous month's envelopes
  //       const envelopesSelectQuery = `
  //       SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //       FROM envelopes 
  //       WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //       ORDER BY orderIndex;
  //     `;

  //       tx.executeSql(
  //         envelopesSelectQuery,
  //         [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //         (_, results) => {
  //           if (results.rows.length > 0) {
  //             let newEnvelopes = results.rows.map(item => ([
  //               item.envelopeName,
  //               item.amount,
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth,
  //               0,
  //               item.user_id,
  //               item.orderIndex
  //             ]));

  //             const envelopesInsertQuery = `
  //             INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //             VALUES (?, ?, ?, ?, ?, ?, ?);
  //           `;

  //             newEnvelopes.forEach(env => {
  //               tx.executeSql(
  //                 envelopesInsertQuery,
  //                 env,
  //                 () => console.log('Envelope inserted successfully:', env),
  //                 (_, error) => console.error('Error inserting envelope:', env, error)
  //               );
  //             });
  //           }
  //         },
  //         (_, error) => console.error('Error fetching previous month envelopes:', error)
  //       );

  //       // Fetch previous month's income
  //       const incomeSelectQuery = `
  //       SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //       FROM Income 
  //       WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //     `;

  //       tx.executeSql(
  //         incomeSelectQuery,
  //         [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //         (_, results) => {
  //           if (results.rows.length > 0) {
  //             let newIncomeRecords = results.rows.map(item => ([
  //               item.accountName,
  //               item.monthlyAmount,
  //               item.monthlyAmount,
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth,
  //               item.user_id
  //             ]));

  //             const incomeInsertQuery = `
  //             INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //             VALUES (?, ?, ?, ?, ?, ?);
  //           `;

  //             newIncomeRecords.forEach(income => {
  //               tx.executeSql(
  //                 incomeInsertQuery,
  //                 income,
  //                 () => console.log('Income record inserted successfully:', income),
  //                 (_, error) => console.error('Error inserting income record:', income, error)
  //               );
  //             });
  //           }
  //         },
  //         (_, error) => console.error('Error fetching previous month income records:', error)
  //       );
  //     });
  //   } catch (error) {
  //     console.error('Error copying envelopes and income:', error);
  //   }
  // };


  // const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
  //   const now = moment();
  //   const startOfCurrentMonth = moment().startOf('month');
  //   const formattedStartOfCurrentMonth = startOfCurrentMonth.format('YYYY-MM');

  //   console.log('Current Date:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month:', formattedStartOfCurrentMonth);

  //   try {
  //     // Fetch the last copied month from AsyncStorage
  //     const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');
  //     console.log('========= Last copied month:', lastCopyMonth);

  //     // Explicitly check for null or mismatch with the current month
  //     if (lastCopyMonth === null || lastCopyMonth !== formattedStartOfCurrentMonth) {
  //       console.log('Data is outdated or missing. Triggering copy task...');

  //       // Trigger the copy task
  //       const success = await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);

  //       if (success) {
  //         // Only update the flag if the copy task was successful
  //         await AsyncStorage.setItem('lastCopyMonth', formattedStartOfCurrentMonth);
  //         console.log('Data copied successfully. Updated lastCopyMonth flag.');
  //       } else {
  //         console.log('Data copy failed. lastCopyMonth flag not updated.');
  //       }
  //     } else {
  //       console.log('Data already copied for this month. No action needed.');
  //     }
  //   } catch (error) {
  //     console.error('Error in checkAndTriggerStartOfMonthTask:', error);
  //   }
  // };


  // useEffect(() => {
  //   if (tempUserId) {
  //     checkAndTriggerStartOfMonthTask(tempUserId);
  //   }
  // }, [tempUserId]);


  // again copied from github last commit from thurday late night it is working but duplicate
  // const copyAndInsertNextMonthEnvelopesAndIncome = async (tempUserId) => {
  //   // Calculate date ranges
  //   const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //   const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //   const startOfCurrentMonth = moment().startOf('month'); // Updated for clarity

  //   // Format dates for SQL
  //   const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //   const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //   const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

  //   console.log('--- COPY & INSERT TASK STARTED ---');
  //   console.log('Formatted Start of Previous Month:', formattedStartOfPreviousMonth);
  //   console.log('Formatted End of Previous Month:', formattedEndOfPreviousMonth);
  //   console.log('Formatted Start of Current Month:', formattedStartOfCurrentMonth);

  //   db.transaction(tx => {
  //     /*** ENVELOPES LOGIC ***/
  //     const envelopesSelectQuery = `
  //     SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //     FROM envelopes 
  //     WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
  //     ORDER BY orderIndex;
  //   `;

  //     console.log('Executing envelopes SELECT query...');
  //     tx.executeSql(
  //       envelopesSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newEnvelopes = [];
  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             newEnvelopes.push([
  //               item.envelopeName,
  //               item.amount,
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth, // Set fill date to the current month start
  //               0, // Reset filledIncome
  //               item.user_id,
  //               item.orderIndex
  //             ]);
  //           }

  //           const envelopesInsertQuery = `
  //           INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //           VALUES (?, ?, ?, ?, ?, ?, ?);
  //         `;
  //           newEnvelopes.forEach(env => {
  //             tx.executeSql(
  //               envelopesInsertQuery,
  //               env,
  //               () => console.log('Envelope inserted successfully:', env),
  //               (_, error) => console.error('Error inserting envelope:', env, error)
  //             );
  //           });
  //         } else {
  //           console.log('No envelopes found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month envelopes:', error)
  //     );

  //     /*** INCOME LOGIC ***/
  //     const incomeSelectQuery = `
  //     SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //     FROM Income 
  //     WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //   `;

  //     console.log('Executing income SELECT query...');
  //     tx.executeSql(
  //       incomeSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newIncomeRecords = [];
  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);
  //             newIncomeRecords.push([
  //               item.accountName,
  //               item.monthlyAmount,
  //               item.monthlyAmount, // budgetAmount = monthlyAmount
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth, // Set incomeDate to current month start
  //               item.user_id
  //             ]);
  //           }

  //           const incomeInsertQuery = `
  //           INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //           VALUES (?, ?, ?, ?, ?, ?);
  //         `;
  //           newIncomeRecords.forEach(income => {
  //             tx.executeSql(
  //               incomeInsertQuery,
  //               income,
  //               () => console.log('Income record inserted successfully:', income),
  //               (_, error) => console.error('Error inserting income record:', income, error)
  //             );
  //           });
  //         } else {
  //           console.log('No income records found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month income records:', error)
  //     );
  //   });
  // };

  // const copyAndInsertNextMonthEnvelopesAndIncome = async (tempUserId) => {
  //   const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
  //   const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
  //   const startOfCurrentMonth = moment().startOf('month');

  //   // for Every Year envelopes
  //   const startOfCurrentYear = moment().startOf('year');
  //   const isNewYear = moment().isSame(startOfCurrentYear, 'year') && moment().isSame(startOfCurrentYear, 'day');
  //   console.log('=================   isNewYear =======', isNewYear)

  //   const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
  //   const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
  //   const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

  //   console.log('--- COPY & INSERT TASK STARTED ---');

  //   db.transaction(tx => {
  //     /*** ENVELOPES LOGIC ***/
  //     const envelopesSelectQuery = `
  //     SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
  //     FROM envelopes 
  //     WHERE user_id = ? AND fillDate BETWEEN ? AND ?
  //     ORDER BY orderIndex;
  //   `;

  //     console.log('Executing envelopes SELECT query...');
  //     tx.executeSql(
  //       envelopesSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newEnvelopes = [];

  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);

  //             // Filter based on budgetPeriod
  //             if (
  //               (item.budgetPeriod === 'Monthly' || item.budgetPeriod === 'Goal') ||
  //               (item.budgetPeriod === 'Every Year' && isNewYear)
  //             ) {
  //               newEnvelopes.push([
  //                 item.envelopeName,
  //                 item.amount,
  //                 item.budgetPeriod,
  //                 formattedStartOfCurrentMonth, // Set fill date to the current month start
  //                 0, // Reset filledIncome
  //                 item.user_id,
  //                 item.orderIndex
  //               ]);
  //             }
  //           }

  //           const envelopesInsertQuery = `
  //           INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
  //           VALUES (?, ?, ?, ?, ?, ?, ?);
  //         `;

  //           newEnvelopes.forEach(env => {
  //             tx.executeSql(
  //               envelopesInsertQuery,
  //               env,
  //               () => console.log('Envelope inserted successfully:', env),
  //               (_, error) => console.error('Error inserting envelope:', env, error)
  //             );
  //           });
  //         } else {
  //           console.log('No envelopes found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month envelopes:', error)
  //     );

  //     /*** INCOME LOGIC ***/
  //     const incomeSelectQuery = `
  //     SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
  //     FROM Income 
  //     WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
  //   `;

  //     console.log('Executing income SELECT query...');
  //     tx.executeSql(
  //       incomeSelectQuery,
  //       [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
  //       (_, results) => {
  //         if (results.rows.length > 0) {
  //           let newIncomeRecords = [];

  //           for (let i = 0; i < results.rows.length; i++) {
  //             const item = results.rows.item(i);

  //             newIncomeRecords.push([
  //               item.accountName,
  //               item.monthlyAmount,
  //               item.monthlyAmount,
  //               item.budgetPeriod,
  //               formattedStartOfCurrentMonth,
  //               item.user_id
  //             ]);
  //           }

  //           const incomeInsertQuery = `
  //           INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
  //           VALUES (?, ?, ?, ?, ?, ?);
  //         `;

  //           newIncomeRecords.forEach(income =>
  //             tx.executeSql(
  //               incomeInsertQuery,
  //               income,
  //               () => console.log('Income record inserted successfully:', income),
  //               (_, error) => console.error('Error inserting income record:', income, error)
  //             )
  //           );
  //         } else {
  //           console.log('No income records found for the previous month.');
  //         }
  //       },
  //       (_, error) => console.error('Error fetching previous month income records:', error)
  //     );
  //   });
  // };

  // this was working fine like copy correctly but till here we had duplication error
  // const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
  //   const now = moment();
  //   const startOfCurrentMonth = moment().startOf('month');

  //   console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
  //   console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

  //   // Get the last copy month from AsyncStorage
  //   const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');

  //   if (!lastCopyMonth) {
  //     // If lastCopyMonth is null, run the task immediately
  //     console.log('No record of lastCopyMonth. Running tasks immediately...');
  //     await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     // Save the current month as the last copied month
  //     await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
  //   } else if (lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
  //     // If lastCopyMonth is not the current month, ensure the task is completed for the new month
  //     console.log('Detected a new month. Checking if tasks need to be run...');
  //     await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
  //     // Save the current month as the last copied month
  //     await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
  //   } else {
  //     console.log('Data already copied for this month. Skipping the task.');
  //   }
  // };

  // useEffect(() => {
  //   console.log("Calling checkAndTriggerStartOfMonthTask in useEffect  ________________");
  //   checkAndTriggerStartOfMonthTask(tempUserId);
  // }, [tempUserId]); // if user switch account within same month then i would need to trigger function of copy paste envelopes and income for that user



  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.munsellgreen} />
      {/* <View style={styles.budget_period_view}>
        <Text style={styles.monthly_txt}>Total Income</Text>
        <Text style={styles.monthly_txt}>{totalIncome}.00</Text>
      </View> */}

      {/* <FlatList
        data={envelopes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {

          // const filledIncome = filledIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;

          return (
            <View style={styles.item_view}>
              <TouchableOpacity 
              onPress={() => navigation.navigate('SingleEnvelopeDetails', { envelope: item })}
              style={styles.item}
              >
                <View style={styles.name_filledIncome_view}>
                  <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                  <Text style={styles.item_text_filledIncome}>{item.filledIncome || 0}.00</Text>
                </View>
                <View style={styles.bar_icon_view}>
                  <View style={styles.progress_bar_view}>
                    <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                  </View>
                  <View style={styles.progress_bar_view_icon}>
                    <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        // scrollEnabled={false}
      /> */}

      {/* <SectionList
        sections={groupedEnvelopes}
        keyExtractor={(item) => item.envelopeId.toString()}
        renderItem={({ item }) => (
          <View style={styles.item_view}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SingleEnvelopeDetails', { envelope: item })}
              style={styles.item}
            >
              <View style={styles.name_filledIncome_view}>
                <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                <Text style={styles.item_text_filledIncome}>{item.filledIncome || 0}.00</Text>
              </View>
              <View style={styles.bar_icon_view}>
                <View style={styles.progress_bar_view}>
                  <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                </View>
                <View style={styles.progress_bar_view_icon}>
                  <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => {
          let displayedIncome = 0;

          if (title === 'Monthly') {
            displayedIncome = monthlyIncome;
          } else if (title === 'Every Year') {
            displayedIncome = yearlyIncome;
          } else if (title === 'Goal') {
            displayedIncome = goalIncome;
          }

          return (
            <View style={styles.budget_period_view}>
              <Text style={styles.monthly_txt}>{title}</Text>
              <Text style={styles.monthly_txt}>{displayedIncome}.00</Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={styles.footerSpacing} />}
      /> */}

      <SectionList
        sections={groupedEnvelopes}
        keyExtractor={(item) => item.envelopeId.toString()}
        renderItem={({ item, section }) => {
          // Check if the current item belongs to the "Goal" section and meets the condition
          const showBackgroundImage =
            section.title === 'Goal' && item.filledIncome >= item.amount;

          return (
            <View style={styles.item_view}>
              {showBackgroundImage ? (
                <ImageBackground
                  source={Images.goalbackgroundimage} // Replace with the path to your image
                  style={styles.imageBackground}
                  imageStyle={styles.imageStyle} // Optional, to style the image itself
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SingleEnvelopeDetails', { envelope: item })}
                    style={styles.item}
                  >
                    <View style={styles.name_filledIncome_view}>
                      <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                      <Text style={styles.item_text_filledIncome}>{item.filledIncome || 0}.00</Text>
                    </View>

                    {section.title !== 'Unallocated' && (
                      <View style={styles.bar_icon_view}>
                        <View style={styles.progress_bar_view}>
                          <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                        </View>
                        <View style={styles.progress_bar_view_icon}>
                          <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </ImageBackground>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate('SingleEnvelopeDetails', { envelope: item })}
                  style={styles.item}
                >
                  <View style={styles.name_filledIncome_view}>
                    <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                    <Text style={styles.item_text_filledIncome}>{item.filledIncome || 0}.00</Text>
                  </View>

                  {section.title !== 'Unallocated' && (
                    <View style={styles.bar_icon_view}>
                      <View style={styles.progress_bar_view}>
                        <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                      </View>
                      <View style={styles.progress_bar_view_icon}>
                        <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <Divider />
            </View>
          );
        }}
        renderSectionHeader={({ section: { title } }) => {
          let displayedIncome = 0;

          if (title === 'Monthly') {
            displayedIncome = monthlyIncome;
          } else if (title === 'Every Year') {
            displayedIncome = yearlyIncome;
          } else if (title === 'Goal') {
            displayedIncome = goalIncome;
          } else if (title === 'Unallocated') {
            displayedIncome = unallocatedIncome;
          }

          return (
            <View style={styles.budget_period_view}>
              <Text style={styles.monthly_txt}>{title}</Text>
              <Text style={styles.monthly_txt}>{displayedIncome}.00</Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={styles.footerSpacing} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />


    </View>
  )
}

export default Envelopes

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  budget_period_view: {
    height: hp('4.5%'),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: hp('1.5%'),
    paddingHorizontal: hp('1%'),
    marginTop: hp('1.5%'),
    flexDirection: 'row',
    // borderBottomWidth: 1,
    // borderBottomColor: colors.gray,
    paddingBottom: hp('0.3%'),
    backgroundColor: colors.lightgreen,
  },
  monthly_txt: {
    fontSize: hp('2.1%'),
    fontWeight: '600',
    color: colors.black,
  },

  //flatlist styles
  imageBackground: {

  },
  imageStyle: {
    resizeMode: 'repeat',
  },
  item_view: {
    marginHorizontal: hp('1.5%'),
  },
  item: {
    paddingVertical: hp('1%'),
    // borderBottomWidth: 1,
    // borderColor: colors.gray,
    // borderTopWidth: 1,
    // borderTopColor: colors.gray,
  },
  name_filledIncome_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: hp('1%'),
  },
  item_text_name: {
    fontSize: hp('2.4%'),
    color: colors.black,
    fontWeight: '400',
  },
  item_text_filledIncome: {
    fontSize: hp('2.4%'),
    color: colors.black,
    fontWeight: '400',
  },
  item_text_amount: {
    color: colors.black,
  },

  bar_icon_view: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: hp('1%'),

  },
  progress_bar_view: {
    paddingVertical: hp('0.2'),
    // flex: 1,
    paddingRight: hp('1%'),
    width: hp('35%'),
    // backgroundColor: 'yellow',
  },
  progress_bar_view_icon: {
    flex: 1,
    // width: hp('8%'),
    justifyContent: 'flex-end',
    // backgroundColor: 'blue',
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerSpacing: {
    height: 80,
  },

})
