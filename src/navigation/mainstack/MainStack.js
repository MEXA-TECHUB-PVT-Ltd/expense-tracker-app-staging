import React, {useState, useEffect, useCallback} from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import Onboarding from '../../screens/Onboarding/Onboarding';
import About from '../../screens/Onboarding/About';
import Help from '../../screens/Onboarding/Help';
import SetupBudget from '../../screens/Onboarding/SetupBudget';
import AddEditDeleteEnvelope from '../../screens/Onboarding/AddEditDeleteEnvelope';
import EditEnvelope from '../../screens/Onboarding/EditEnvelope';
import ChangeBudgetPeriod from '../../screens/Onboarding/ChangeBudgetPeriod';
import SetIncomeAmount from '../../screens/Onboarding/SetIncomeAmount';
import Calculator from '../../screens/Onboarding/Calculator';
import FillEnvelopes from '../../screens/Onboarding/FillEnvelopes';
import RegisterAccount from '../../screens/Onboarding/RegisterAccount';
import TermsOfUse from '../../screens/Onboarding/TermsOfUse';
import AddEditDeleteTransaction from '../../screens/Dashboard/AddEditDeleteTransaction';
import TopTab from '../topTab/TopTab';
import TransactionsSearch from '../../screens/Dashboard/TransactionSearch';
import SingleEnvelopeDetails from '../../screens/Dashboard/SingleEnvelopeDetails';
import Settings from '../../screens/Dashboard/Settings';
import SpendingByEnvelope from '../../screens/Dashboard/SpendingByEnvelope';
import IncomeVsSpending from '../../screens/Dashboard/IncomeVsSpending';
import EnvelopeTransfer from '../../screens/Dashboard/EnvelopeTransfer';
import PrivacyPolicy from '../../screens/Dashboard/PrivacyPolicy';
import TermsAndConditions from '../../screens/Dashboard/TermsAndConditions';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../database/database';

import { useSelector, useDispatch } from 'react-redux';
import { setUser, logout } from '../../redux/slices/userSlice';
import { getUserData } from '../../utils/authUtils'; // actually holding async storage code
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { formatDateSql } from '../../utils/DateFormatter';

const Stack = createStackNavigator();

const MainStack = () => {
    const navigation = useNavigation();
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const dispatch = useDispatch();

    const fetchUserIdByEmail = (email, dispatch, setUser) => {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    "SELECT id FROM Users WHERE email = ?;",
                    [email],
                    (tx, results) => {
                        if (results.rows.length > 0) {
                            const userId = results.rows.item(0).id;
                            // console.log("Fetched user_id:", userId);

                            // Dispatch the user_id along with other user details
                            const user = {
                                user_id: userId,
                                email: email,
                                // Add other user data as needed
                            };
                            dispatch(setUser(user));
                        } else {
                            console.error("No user found with the provided email.");
                        }
                    },
                    (error) => {
                        console.error("Error fetching user_id by email:", error);
                    }
                );
            },
            (error) => {
                console.error("Transaction error:", error);
            }
        );
    };

    useEffect(() => {
        const initializeUser = async () => {
            const user = await getUserData();
            console.log("Fetched user data from AsyncStorage:", user);

            if (user?.email) {
                fetchUserIdByEmail(user.email, dispatch, setUser);
            } else {
                dispatch(logout());
            }
        };

        initializeUser();
    }, [dispatch]);



    // useEffect(() => {
    //     const initializeUser = async () => {
    //         const user = await getUserData();
    //         console.log('values inside user variable if auto login from function getUserData from redux:', user);
    //         if (user) {
    //             dispatch(setUser(user));
    //         } else {
    //             dispatch(logout());
    //         }
    //     };

    //     initializeUser();
    // }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            // Reset the stack and navigate directly to the authenticated stack with TopTab
            navigation.reset({
                index: 0,
                routes: [{ name: 'TopTab' }],
            });
        }
    }, [isAuthenticated, navigation]);

    // code for copying and inserting records for new month

    // first we will get actual user_id
    // const isAuthenticated = useSelector((state) => state.user.isAuthenticated); // commented it as it is already declared and was being used earlier
    const user_id = useSelector(state => state.user.user_id);
    const [tempUserId, setTempUserId] = useState(user_id);
    // console.log('value of tempUserId in state inside mainstack', tempUserId);

    useFocusEffect(
        useCallback(() => {
            // console.log(' ---------- useFocusEffect called in mainstack ---------- ');

            if (isAuthenticated) {
                setTempUserId(user_id);
            }
        }, [isAuthenticated, user_id])
    );

    // actual code for copying and inserting just for registered users as user_id is in dependency

    useEffect(() => {
        if (isAuthenticated && tempUserId) {
            checkAndTriggerStartOfMonthTask(tempUserId);
        }
    }, [isAuthenticated, tempUserId]);

    // works perfectly fine but has no check if new year has already copied envelopes and inserted
    // const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
    //     const now = moment();
    //     const startOfCurrentMonth = moment().startOf('month');

    //     console.log('Current Date in triggering function:', now.format('YYYY-MM-DD HH:mm:ss'));
    //     console.log('Start of Current Month in triggering function:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

    //     // Get the last copy month from AsyncStorage
    //     const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');

    //     if (!lastCopyMonth) {
    //         // If lastCopyMonth is null, run the task immediately
    //         console.log('No record of lastCopyMonth. Running tasks immediately...');
    //         await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
    //         // Save the current month as the last copied month
    //         await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
    //     } else if (lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
    //         // If lastCopyMonth is not the current month, ensure the task is completed for the new month
    //         console.log('Detected a new month. Checking if tasks need to be run...');
    //         await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
    //         // Save the current month as the last copied month
    //         await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
    //     } else {
    //         console.log('Data already copied for this month. Skipping the task.');
    //     }
    // };

    // this has check for boht month and year to check it is also working and for both month and year
    const checkAndTriggerStartOfMonthTask = async (tempUserId) => {
        const now = moment();
        const startOfCurrentMonth = moment().startOf('month');
        const currentYear = now.format('YYYY');

        console.log('Current Date:', now.format('YYYY-MM-DD HH:mm:ss'));
        console.log('Start of Current Month:', startOfCurrentMonth.format('YYYY-MM-DD HH:mm:ss'));

        const lastCopyMonth = await AsyncStorage.getItem('lastCopyMonth');
        const lastCopyYear = await AsyncStorage.getItem('lastCopyYear');

        if (!lastCopyMonth && !lastCopyYear) {
            console.log('No records for previous month or year. Running tasks immediately...');
            await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
            await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
            await AsyncStorage.setItem('lastCopyYear', currentYear);
        } else if (lastCopyMonth !== startOfCurrentMonth.format('YYYY-MM')) {
            console.log('Detected a new month. Copying Monthly and Goal envelopes...');
            await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
            await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM'));
        } else if (lastCopyYear !== currentYear) {
            console.log('New year detected. Copying Every Year envelopes...');
            await copyAndInsertNextMonthEnvelopesAndIncome(tempUserId);
            await AsyncStorage.setItem('lastCopyYear', currentYear);
            await AsyncStorage.setItem('lastCopyMonth', startOfCurrentMonth.format('YYYY-MM')); // Update month to avoid re-triggering
        } else {
            console.log('Envelopes already copied for this year or month. Skipping task.');
        }
    };


    const copyAndInsertNextMonthEnvelopesAndIncome = async (tempUserId) => {
        const startOfPreviousMonth = moment().subtract(1, 'month').startOf('month');
        const endOfPreviousMonth = moment().subtract(1, 'month').endOf('month');
        const startOfCurrentMonth = moment().startOf('month');

        // dates for Every year because befor it was although copying Yearly envelopes but it had no idea to which range i nedd to copy now copy full previous year envelopes
        // Get the start and end of the **previous year** to pass in select query so that whole year envelopes of previous year with buegetPeriod Every Year are selected
        const startOfPreviousYear = moment().subtract(1, 'year').startOf('year').toISOString();
        const endOfPreviousYear = moment().subtract(1, 'year').endOf('year').toISOString();

        // new logic
        const lastCopyYear = await AsyncStorage.getItem('lastCopyYear');
        const currentYear = moment().format('YYYY');
        const isNewYear = lastCopyYear !== currentYear;

        // for Every Year envelopes old logic
        // const startOfCurrentYear = moment().startOf('year');
        // const isNewYear = moment().isSame(startOfCurrentYear, 'year') && moment().isSame(startOfCurrentYear, 'day');
        // console.log('================= NewYear is =======', isNewYear)

        // Format the dates using the formatDateSql function
        const formattedFromDateYearly = formatDateSql(startOfPreviousYear);
        const formattedToDateYearly = formatDateSql(endOfPreviousYear);

        console.log('==============++++++++++ formattedFromDateYearly==============', formattedFromDateYearly);
        console.log('==============++++++++++ formattedToDateYearly==============', formattedToDateYearly);

        const formattedStartOfPreviousMonth = formatDateSql(startOfPreviousMonth);
        const formattedEndOfPreviousMonth = formatDateSql(endOfPreviousMonth);
        const formattedStartOfCurrentMonth = formatDateSql(startOfCurrentMonth);

        console.log('--- COPY & INSERT TASK STARTED ---');

        db.transaction(tx => {
            /*** ENVELOPES LOGIC ***/
    //         const envelopesSelectQuery = `
    //   SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
    //   FROM envelopes 
    //   WHERE user_id = ? AND fillDate BETWEEN ? AND ?
    //   ORDER BY orderIndex;
    // `;

            const envelopesSelectQuery = `
    SELECT envelopeId, envelopeName, amount, budgetPeriod, orderIndex, user_id 
    FROM envelopes 
    WHERE user_id = ? 
      AND (
        (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?)
        OR 
        (budgetPeriod = 'Every Year' AND fillDate BETWEEN ? AND ?)
      )
    ORDER BY orderIndex;
`;

            console.log('Executing envelopes SELECT query...');
            tx.executeSql(
                envelopesSelectQuery,
                [tempUserId, formattedStartOfPreviousMonth, formattedEndOfPreviousMonth, formattedFromDateYearly, formattedToDateYearly],
                (_, results) => {
                    if (results.rows.length > 0) {
                        let newEnvelopes = [];

                        for (let i = 0; i < results.rows.length; i++) {
                            const item = results.rows.item(i);

                            // Filter based on budgetPeriod
                            if (
                                (item.budgetPeriod === 'Monthly' || item.budgetPeriod === 'Goal') ||
                                (item.budgetPeriod === 'Every Year' && isNewYear)
                            ) {
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
                        }

                        console.log(' ****************   all copied envelopes in MainStack are   ***************',newEnvelopes);

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
                                item.monthlyAmount,
                                item.budgetPeriod,
                                formattedStartOfCurrentMonth,
                                item.user_id
                            ]);
                        }

                        const incomeInsertQuery = `
            INSERT INTO Income (accountName, monthlyAmount, budgetAmount, budgetPeriod, incomeDate, user_id)
            VALUES (?, ?, ?, ?, ?, ?);
          `;

                        newIncomeRecords.forEach(income =>
                            tx.executeSql(
                                incomeInsertQuery,
                                income,
                                () => console.log('Income record inserted successfully:', income),
                                (_, error) => console.error('Error inserting income record:', income, error)
                            )
                        );
                    } else {
                        console.log('No income records found for the previous month.');
                    }
                },
                (_, error) => console.error('Error fetching previous month income records:', error)
            );
        });
    };

    return (
        <Stack.Navigator>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="TopTab" component={TopTab} options={{ headerShown: false }} />
                    <Stack.Screen name="AddEditDeleteTransaction" component={AddEditDeleteTransaction} options={{ headerShown: false }} />
                    <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
                    <Stack.Screen name="SingleEnvelopeDetails" component={SingleEnvelopeDetails} options={{ headerShown: false }} />
                    <Stack.Screen name="Help" component={Help} options={{ headerShown: false }} />
                    <Stack.Screen name="SetupBudget" component={SetupBudget} options={{ headerShown: false }} />
                    <Stack.Screen name="AddEditDeleteEnvelope" component={AddEditDeleteEnvelope} options={{ headerShown: false }} />
                    <Stack.Screen name="SetIncomeAmount" component={SetIncomeAmount} options={{ headerShown: false }} />
                    <Stack.Screen name="FillEnvelopes" component={FillEnvelopes} options={{ headerShown: false }} />
                    <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
                    <Stack.Screen name="TransactionsSearch" component={TransactionsSearch} options={{ headerShown: false }} />
                    <Stack.Screen name="SpendingByEnvelope" component={SpendingByEnvelope} options={{ headerShown: false }} />
                    <Stack.Screen name="IncomeVsSpending" component={IncomeVsSpending} options={{ headerShown: false }} />
                    <Stack.Screen name="EnvelopeTransfer" component={EnvelopeTransfer} options={{ headerShown: false }} />
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ headerShown: false }} />
                    <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} options={{ headerShown: false }} />


                </>
            ) : (
                <>
                    <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
                    <Stack.Screen name="SetupBudget" component={SetupBudget} options={{ headerShown: false }} />
                    <Stack.Screen name="AddEditDeleteEnvelope" component={AddEditDeleteEnvelope} options={{ headerShown: false }} />
                    <Stack.Screen name="EditEnvelope" component={EditEnvelope} options={{ headerShown: false }} />
                    <Stack.Screen name="ChangeBudgetPeriod" component={ChangeBudgetPeriod} options={{ headerShown: false }} />
                    <Stack.Screen name="SetIncomeAmount" component={SetIncomeAmount} options={{ headerShown: false }} />
                    <Stack.Screen name="Calculator" component={Calculator} options={{ headerShown: false }} />
                    <Stack.Screen name="FillEnvelopes" component={FillEnvelopes} options={{ headerShown: false }} />
                    <Stack.Screen name="RegisterAccount" component={RegisterAccount} options={{ headerShown: false }} />
                    <Stack.Screen name="TermsOfUse" component={TermsOfUse} options={{ headerShown: false }} />
                    <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
                    <Stack.Screen name="Help" component={Help} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default MainStack;
