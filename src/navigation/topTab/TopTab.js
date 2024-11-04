import React, { useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Envelopes from '../../screens/Dashboard/Envelopes';
import Transactions from '../../screens/Dashboard/Transactions';
import Accounts from '../../screens/Dashboard/Accounts';
import Reports from '../../screens/Dashboard/Reports';
import colors from '../../constants/colors';
import Images from '../../constants/images';
import DashboardAppBar from '../../components/DashboardAppBar';
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/userSlice'

const Tab = createMaterialTopTabNavigator();

const TopTab = () => {
    const navigation = useNavigation();
    const [selectedTab, setSelectedTab] = useState('Envelopes');
    const dispatch = useDispatch();

    const handleLogout = () => {
        // navigation.navigate('SetupBudget');
        dispatch(logout());
    };

    // Handle back button press logic
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
        <>
            <DashboardAppBar selectedTab={selectedTab} />
            <Tab.Navigator
                screenOptions={{
                    tabBarStyle: styles.tabBar,
                    tabBarLabelStyle: styles.tabBarLabel,
                    tabBarItemStyle: styles.tabBarItem,
                    tabBarIndicatorStyle: styles.tabBarIndicator,
                    tabBarScrollEnabled: true,
                }}
                screenListeners={{
                    state: (e) => {
                        const route = e.data.state.routes[e.data.state.index];
                        setSelectedTab(route.name);
                    },
                }}
            >
                <Tab.Screen
                    name="Envelopes"
                    component={Envelopes}
                    key="envelopes"
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
                    key="transactions"
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
                    key="accounts"
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
                    key="reports"
                    options={{
                        tabBarLabel: ({ focused }) => (
                            <Text style={{ color: focused ? colors.white : colors.lightgreen }} numberOfLines={1}>
                                Reports
                            </Text>
                        ),
                    }}
                />
            </Tab.Navigator>
            {selectedTab !== 'Reports' && (
                <FAB
                    icon="plus"
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddEditDeleteTransaction')}
                />
            )}
        </>
    );
};

// Styles for AppBar and Tabs
const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.brightgreen,
        height: hp('7.5%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBarLabel: {
        fontWeight: 'bold',
        color: colors.white,
        fontSize: hp('2%'),
    },
    tabBarItem: {
        width: hp('14.2%'),
    },
    tabBarIndicator: {
        backgroundColor: colors.white,
        height: hp('0.4%'),
    },
    fab: {
        position: 'absolute',
        borderRadius: 50,
        backgroundColor: colors.androidbluebtn,
        margin: 20,
        right: 5,
        bottom: 0,
    },
});

export default TopTab;
