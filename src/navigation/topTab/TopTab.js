import React, { useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler, View, Text } from 'react-native';
import Envelopes from '../../screens/Dashboard/Envelopes';
import Transactions from '../../screens/Dashboard/Transactions';
import Accounts from '../../screens/Dashboard/Accounts';
import Reports from '../../screens/Dashboard/Reports';
import colors from '../../constants/colors';

const Tab = createMaterialTopTabNavigator();

const TopTab = () => {
    const navigation = useNavigation();
    const [isFocused, setIsFocused] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const backAction = () => {
                const state = navigation.getState();
                const tabState = state.routes[state.index].state;
                if (tabState && tabState.index !== undefined) {
                    const currentTabRoute = tabState.routes[tabState.index];
                    if (currentTabRoute.name === 'Envelopes') {
                        BackHandler.exitApp();
                        return true;
                    }
                }
                return false;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }, [navigation])
    );

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: colors.brightgreen,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarLabelStyle: {
                    fontWeight: 'bold',
                    color: colors.white,
                    fontSize: 14,
                },
                tabBarItemStyle: { width: 101 },
                tabBarIndicatorStyle: {
                    backgroundColor: colors.white,
                    height: 3,
                },
                tabBarScrollEnabled: true,
            }}
        >
            <Tab.Screen
                name="Envelopes"
                component={Envelopes}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? colors.white : colors.lightgreen }} numberOfLines={1}>
                            Envelopes
                        </Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Transactions"
                component={Transactions}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? colors.white : colors.lightgreen }} numberOfLines={1}>
                            Transactions
                        </Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Accounts"
                component={Accounts}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? colors.white : colors.lightgreen }} numberOfLines={1}>
                            Accounts
                        </Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Reports"
                component={Reports}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? '#fff' : '#b1eed7' }} numberOfLines={1}>
                            Reports
                        </Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TopTab;
