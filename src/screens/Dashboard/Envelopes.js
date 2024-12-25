import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, SectionList, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Divider } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
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
  const [yearlyIncome, setYearlyIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmountYearly(setYearlyIncome, tempUserId, formattedFromDate, formattedToDate);
    }, [tempUserId, formattedFromDate, formattedToDate])
  );

  // for showing total sum of all envelopes incomes single sumup of all for goals
  const [goalIncome, setGoalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmountGoal(setGoalIncome, tempUserId, formattedFromDate, formattedToDate);
    }, [tempUserId, formattedFromDate, formattedToDate])
  );

  // for flatlist
  const [filledIncomes, setFilledIncomes] = useState([]);

  const [envelopes, setEnvelopes] = useState([]);
  console.log('state of envelopes in envelopes screen-=-=-=-=--=-=-=: ', envelopes); 

  // Group the envelopes by budgetPeriod for section list to show data by Month year and goal
  const groupedEnvelopes = [
    { title: 'Monthly', data: envelopes.filter(item => item.budgetPeriod === 'Monthly') },
    { title: 'Every Year', data: envelopes.filter(item => item.budgetPeriod === 'Every Year') },
    { title: 'Goal', data: envelopes.filter(item => item.budgetPeriod === 'Goal') },
  ];

  const fetchEnvelopes = useCallback(() => {
    // console.log('Fetching envelopes with:', tempUserId, formattedFromDate, formattedToDate);
    getAllEnvelopes(setEnvelopes, tempUserId, formattedFromDate, formattedToDate);
    fetchAndLogFilledIncomes(tempUserId);
  }, [tempUserId, formattedFromDate, formattedToDate]);

  // Use useFocusEffect to call the function when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEnvelopes();
    }, [fetchEnvelopes]) // Ensure fetchEnvelopes is a dependency
  );

  // function to get all envelopes their rows
  const getAllEnvelopes = (callback, tempUserId, formattedFromDate, formattedToDate) => {
    // console.log('running getAllEnvelopes...');
    db.transaction(tx => {
      const sqlQuery = `
      SELECT * FROM envelopes 
      WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
      ORDER BY orderIndex
    `;
      tx.executeSql(
        sqlQuery,
        [tempUserId, formattedFromDate, formattedToDate],
        (_, results) => {
          // console.log('SQL Results:', results.rows);
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
  const copyAndInsertNextMonthEnvelopesAndIncome = (tempUserId) => {
    // Calculate date ranges
    const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
    const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
    const startOfCurrentMonth = moment().startOf('month'); // Updated for clarity

    // Format dates for SQL
    const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
    const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
    const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

    console.log('--- COPY & INSERT TASK STARTED ---');
    console.log('Formatted Start of Previous Month:', formattedStartOfPreviousMonth);
    console.log('Formatted End of Previous Month:', formattedEndOfPreviousMonth);
    console.log('Formatted Start of Current Month:', formattedStartOfCurrentMonth);

    db.transaction(tx => {
      /*** ENVELOPES LOGIC ***/
      const envelopesSelectQuery = `
      SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
      FROM envelopes 
      WHERE user_id = ? AND fillDate BETWEEN ? AND ? 
      ORDER BY orderIndex;
    `;

      console.log('Executing envelopes SELECT query...');
      tx.executeSql(
        envelopesSelectQuery,
        [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
        (_, results) => {
          if (results.rows.length > 0) {
            let newEnvelopes = [];
            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);
              newEnvelopes.push([
                item.envelopeName,
                item.amount,
                item.budgetPeriod,
                formattedStartOfCurrentMonth, // Set fill date to the current month start
                0, // Reset filledIncome
                item.user_id,
                item.orderIndex
              ]);
            }

            const envelopesInsertQuery = `
            INSERT INTO envelopes (envelopeName, amount, budgetPeriod, fillDate, filledIncome, user_id, orderIndex)
            VALUES (?, ?, ?, ?, ?, ?, ?);
          `;
            newEnvelopes.forEach(env => {
              tx.executeSql(
                envelopesInsertQuery,
                env,
                () => console.log('Envelope inserted successfully:', env),
                (_, error) => console.error('Error inserting envelope:', env, error)
              );
            });
          } else {
            console.log('No envelopes found for the previous month.');
          }
        },
        (_, error) => console.error('Error fetching previous month envelopes:', error)
      );

      /*** INCOME LOGIC ***/
      const incomeSelectQuery = `
      SELECT accountName, monthlyAmount, budgetAmount, budgetPeriod, user_id 
      FROM Income 
      WHERE user_id = ? AND incomeDate BETWEEN ? AND ?;
    `;

      console.log('Executing income SELECT query...');
      tx.executeSql(
        incomeSelectQuery,
        [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth],
        (_, results) => {
          if (results.rows.length > 0) {
            let newIncomeRecords = [];
            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);
              newIncomeRecords.push([
                item.accountName,
                item.monthlyAmount,
                item.monthlyAmount, // budgetAmount = monthlyAmount
                item.budgetPeriod,
                formattedStartOfCurrentMonth, // Set incomeDate to current month start
                item.user_id
              ]);
            }

            const incomeInsertQuery = `
            INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
            VALUES (?, ?, ?, ?, ?, ?);
          `;
            newIncomeRecords.forEach(income => {
              tx.executeSql(
                incomeInsertQuery,
                income,
                () => console.log('Income record inserted successfully:', income),
                (_, error) => console.error('Error inserting income record:', income, error)
              );
            });
          } else {
            console.log('No income records found for the previous month.');
          }
        },
        (_, error) => console.error('Error fetching previous month income records:', error)
      );
    });
  };

  const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
    const now = moment();
    const startOfCurrentMonth = moment().startOf('month');

    console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
    console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

    // Get the last copy month from AsyncStorage
    const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');

    // Check if the last copy month is different from the current month
    if (!lastCopyMonth || lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
      // If today is the first day of the current month
      if (now.isSame(startOfCurrentMonth, 'day')) {
        console.log('It is the start of the current month. Running tasks immediately...');
        await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
        // Save the current month as the last copied month
        await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
      } else {
        // If the task hasn't been run yet, trigger it based on the next month
        const timeLeft = startOfCurrentMonth.add(1, 'month').diff(now);
        console.log('Setting timeout to trigger at the start of the next month...');
        setTimeout(async () => {
          console.log('New month started! Running the copy and insert tasks...');
          await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
          // Save the current month as the last copied month
          await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
        }, timeLeft);
      }
    } else {
      console.log('Data already copied for this month. Skipping the task.');
    }
  };

  useEffect(() => {
    // Trigger check at the start of the month
    checkAndTriggerStartOfMonthTask(tempUserId);
  }, [tempUserId]);



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
                    <View style={styles.bar_icon_view}>
                      <View style={styles.progress_bar_view}>
                        <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                      </View>
                      <View style={styles.progress_bar_view_icon}>
                        <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                      </View>
                    </View>
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
                  <View style={styles.bar_icon_view}>
                    <View style={styles.progress_bar_view}>
                      <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                    </View>
                    <View style={styles.progress_bar_view_icon}>
                      <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                    </View>
                  </View>
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
          }

          return (
            <View style={styles.budget_period_view}>
              <Text style={styles.monthly_txt}>{title}</Text>
              <Text style={styles.monthly_txt}>{displayedIncome}.00</Text>
            </View>
          );
        }}
        ListFooterComponent={<View style={styles.footerSpacing} />}
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
