import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import TopTab from '../topTab/TopTab';

import Onboarding from '../../screens/Onboarding/Onboarding';
import About from '../../screens/Onboarding/About';
import SetupBudget from '../../screens/Onboarding/SetupBudget';
import AddEnvelope from '../../screens/Onboarding/AddEnvelope';
import EditEnvelope from '../../screens/Onboarding/EditEnvelope';
import ChangeBudgetPeriod from '../../screens/Onboarding/ChangeBudgetPeriod';
import SetIncomeAmount from '../../screens/Onboarding/SetIncomeAmount';
import Calculator from '../../screens/Onboarding/Calculator';
import CrudOperations from '../../screens/Dashboard/CrudOperations';

const Stack = createStackNavigator();

const MainStack = () => (
    <Stack.Navigator>
        {/* <Stack.Screen name="CrudOperations" component={CrudOperations} options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="TopTab" component={TopTab} options={{ headerShown: false }} /> */}
        <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
        <Stack.Screen name="SetupBudget" component={SetupBudget} options={{ headerShown: false }} />
        <Stack.Screen name="AddEnvelope" component={AddEnvelope} options={{ headerShown: false }} />
        <Stack.Screen name="EditEnvelope" component={EditEnvelope} options={{ headerShown: false }} />
        <Stack.Screen name="ChangeBudgetPeriod" component={ChangeBudgetPeriod} options={{ headerShown: false }} />
        <Stack.Screen name="SetIncomeAmount" component={SetIncomeAmount} options={{ headerShown: false }} />
        <Stack.Screen name="Calculator" component={Calculator} options={{ headerShown: false }} />
    </Stack.Navigator>
);

export default MainStack;