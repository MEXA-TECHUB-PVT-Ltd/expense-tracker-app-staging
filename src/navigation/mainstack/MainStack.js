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

import { useSelector, useDispatch } from 'react-redux';
import { setUser, logout } from '../../redux/slices/userSlice';
import { getUserData } from '../../utils/authUtils';

const Stack = createStackNavigator();

const MainStack = () => {
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeUser = async () => {
            const user = await getUserData();
            if (user) {
                dispatch(setUser(user));
            } else {
                dispatch(logout());
            }
            // setIsLoading(false);
        };

        initializeUser();
    }, [dispatch]);

    // if (isLoading) return null;

    return (
        <Stack.Navigator>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="TopTab" component={TopTab} options={{ headerShown: false }} />
                    <Stack.Screen name="AddEditDeleteTransaction" component={AddEditDeleteTransaction} options={{ headerShown: false }} />
                    <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
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
