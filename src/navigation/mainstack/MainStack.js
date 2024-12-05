import React, {useState, useEffect} from 'react';
import { createStackNavigator } from '@react-navigation/stack';

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
import { getUserData } from '../../utils/authUtils';

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
                            console.log("Fetched user_id:", userId);

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
