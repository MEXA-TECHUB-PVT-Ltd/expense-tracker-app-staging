import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity, FlatList, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { TextInput, Appbar, Button, Menu } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
const { width: screenWidth } = dimensions;
import Calculator from './Calculator';
import { useSelector } from 'react-redux';
import { db } from '../../database/database';
import { formatDateSql } from '../../utils/DateFormatter';
import moment from 'moment';

const IncomeInput = ({ item, index, selectedIncomeIndex, setSelectedIncomeIndex, onDelete, onShowCalculator }) => {
    const [amount, setAmount] = useState(item.amount ? item.amount.toString() : '');
    const [budgetPeriod, setBudgetPeriod] = useState(item.budgetPeriod || 'Monthly');
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        // setAmount(item.budgetAmount ? item.budgetAmount.toString() : ''); older where we were setting budgetAmount
        setAmount(item.monthlyAmount ? item.monthlyAmount.toString() : ''); // new because now monthlyAmount remain same...
        setBudgetPeriod(item.budgetPeriod || 'Monthly');
    }, [item]);

    const handleAmountPress = () => {
        setSelectedIncomeIndex(index);
        onShowCalculator(index, amount);
    };

    return (
        <View style={styles.incomeInputContainer}>
            <Text style={styles.indexText}>{index + 1}.</Text>
            <TouchableWithoutFeedback
                onPressIn={() => setSelectedIncomeIndex(index)}
                onPress={handleAmountPress}>
                <View style={[styles.textInput, selectedIncomeIndex === index ? styles.textInputFocused : null]}>
                    <Text style={styles.amount_text}>{amount}</Text>
                </View>
            </TouchableWithoutFeedback>
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity style={styles.frequencySelector} onPress={() => setMenuVisible(true)}>
                        <Text style={styles.frequencyText}>{budgetPeriod}</Text>
                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContentStyle}
            >
                <Menu.Item onPress={() => { setBudgetPeriod('Monthly'); setMenuVisible(false); }} title="Monthly" titleStyle={{ color: colors.black }} />
                {/* <Menu.Item onPress={() => { setBudgetPeriod('Twice a Month'); setMenuVisible(false); }} title="Twice a Month" titleStyle={{ color: colors.black }} /> */}
                {/* <Menu.Item onPress={() => { setBudgetPeriod('Every 2 weeks'); setMenuVisible(false); }} title="Every 2 weeks" titleStyle={{ color: colors.black }} /> */}
            </Menu>
            <TouchableOpacity
                onPress={() => onDelete(index)}
            >
                <VectorIcon name="close" size={20} color={colors.gray} type="mi" />
            </TouchableOpacity>
        </View>
    );
};


const SetIncomeAmount = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const envelope_prop = route.params?.envelope_prop;

    // code for setting date for each income we add...in income table column incomeDate
    const [dueDate, setDueDate] = useState(new Date());
    const [formattedIncomeDate, setFormattedIncomeDate] = useState('');
    // console.log('value of formattedIncomeDate in setIncomeAmount :', formattedIncomeDate);

    useEffect(() => {
        // default date for setIncomeAmount
        setFormattedIncomeDate(formatDateSql(dueDate));

        // hardcoded date for setIncomeAmount for testing purposes
        // setFormattedIncomeDate('2025-01-01');
        
    }, [dueDate]);

    useFocusEffect(
        React.useCallback(() => {
            const currentDate = new Date();
            const isoDate = currentDate.toISOString();
            setDueDate(isoDate); // Triggers re-computation of formattedIncomeDate
        }, [])
    );

    // code for getting user id
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(user_id || temp_user_id);

    useEffect(() => {
        // Only update tempUserId if user_id changes or if user_id is null
        if (user_id) {
            setTempUserId(user_id);
        } else if (!tempUserId) {
            setTempUserId(temp_user_id);
        }
    }, [user_id, temp_user_id]);

    // console.log('value of tempUserId in SetIncomeAmount is : ', tempUserId);

    // to get current month dates and then formate them into our sql date formate
    const [formattedFromDate, setFormattedFromDate] = useState(() =>
        formatDateSql(moment().startOf('month').format('YYYY-MM-DD'))
    );
    const [formattedToDate, setFormattedToDate] = useState(() =>
        formatDateSql(moment().endOf('month').format('YYYY-MM-DD'))
    );

    // console.log('Formatted From Date in SetIncomeAmount:', formattedFromDate);
    // console.log('Formatted To Date in SetIncomeAmount:', formattedToDate);

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

    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const handleLeftIconPress = () => {
        navigation.goBack();
    };
    const handleRightIconPress = () => {
        toggleTooltip();
    };
    const toggleTooltip = () => {
        if (isTooltipVisible) {
            Animated.timing(slideAnim, {
                toValue: screenWidth,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
            Animated.timing(slideAnim, {
                toValue: screenWidth * 0.5,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };
    const handleOutsidePress = () => {
        if (isTooltipVisible) {
            toggleTooltip();
        }
    };
    const handleTooltipPress = () => {
        toggleTooltip();
        navigation.navigate('Help', {from_setincomeamount: true});
    };

    const [incomes, setIncomes] = useState([{ id: null, accountName: 'My Account', monthlyAmount: '', budgetAmount: '', budgetPeriod: 'Monthly', incomeDate: formattedIncomeDate, user_id: tempUserId }]);
    // console.log('all data in income table is: ', incomes);
    const [selectedIncomeIndex, setSelectedIncomeIndex] = useState(null);
    const [calculatorAmount, setCalculatorAmount] = useState('');
    // code for calculator
    const [calculatorVisible, setCalculatorVisible] = useState(false);
    const handleValueChange = (monthlyAmount, budgetAmount) => {
        if (selectedIncomeIndex !== null) {
            handleAmountChange(selectedIncomeIndex, monthlyAmount, budgetAmount, incomes[selectedIncomeIndex].budgetPeriod);
        }
        setCalculatorVisible(false);
    };
    const handleShowCalculator = (index, currentAmount) => {
        setSelectedIncomeIndex(index);
        setCalculatorAmount(currentAmount);
        setCalculatorVisible(true);
    };

    useEffect(() => {
        fetchAllIncome(formattedFromDate, formattedToDate);
    }, [formattedFromDate, formattedToDate]);

    const fetchAllIncome = (formattedFromDate, formattedToDate) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM Income WHERE user_id = ? AND incomeDate BETWEEN ? AND ?',
                [tempUserId, formattedFromDate, formattedToDate],
                (tx, results) => {
                    let data = [];
                    for (let i = 0; i < results.rows.length; i++) {
                        data.push(results.rows.item(i));
                    }
                    setIncomes([
                        ...data,
                        { id: null, accountName: 'My Account', monthlyAmount: '', budgetAmount: '', incomeDate: formattedIncomeDate, budgetPeriod: 'Monthly', user_id: tempUserId },
                    ]);
                },
                (tx, error) => {
                    console.error('Error fetching filtered income data: ', error);
                }
            );
        });
    };


    const saveIncome = () => {
        db.transaction((tx) => {
            incomes.forEach((income) => {
                if (income.accountName && income.budgetAmount && income.budgetPeriod) {
                    if (income.id) {
                        tx.executeSql(
                            'UPDATE Income SET accountName = ?, budgetPeriod = ?, monthlyAmount = ?, budgetAmount = ?, incomeDate = ?, user_id = ? WHERE id = ?',
                            [income.accountName, income.budgetPeriod, income.monthlyAmount, income.budgetAmount, income.incomeDate, tempUserId, income.id,],
                            (tx, results) => {
                                // console.log('Updated income values are: ', { id: income.id, accountName: income.accountName, monthlyAmount: income.monthlyAmount, budgetAmount: income.budgetAmount, incomeDate: income.incomeDate, budgetPeriod: income.budgetPeriod, user_id: tempUserId });
                            },
                            error => console.error('Error updating income:', error)
                        );
                    } else {
                        tx.executeSql(
                            'INSERT INTO Income (accountName, monthlyAmount, budgetAmount, incomeDate, budgetPeriod, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                            [income.accountName, income.monthlyAmount, income.budgetAmount, income.incomeDate, income.budgetPeriod, tempUserId],
                            (tx, results) => {
                                if (results.insertId) {
                                    income.id = results.insertId;
                                    // console.log('Inserted income values are: ', { id: results.insertId, accountName: income.accountName, monthlyAmount: income.monthlyAmount, budgetAmount: income.budgetAmount, incomeDate: income.incomeDate, budgetPeriod: income.budgetPeriod, user_id: tempUserId });
                                }
                            },
                            error => console.error('Error inserting income:', error)
                        );
                    }
                }
            });
        },
            error => console.error('Transaction error:', error),
            () => {
                fetchAllIncome(formattedFromDate, formattedToDate);
                if (envelope_prop) {
                    navigation.navigate('SetupBudget', { envelope_prop });
                } else {
                    navigation.navigate('SetupBudget');
                }
            });
    };


    // gpt skipped this also cross check it
    const logAllIncome = (formattedFromDate, formattedToDate) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM Income WHERE incomeDate BETWEEN ? AND ?',
                 [formattedFromDate, formattedToDate],
                (tx, results) => {
                // console.log('Income Table with all filtered values: ', results.rows.raw());
            });
        });
    };

    useEffect(() => {
        logAllIncome(formattedFromDate, formattedToDate);
    }, [formattedFromDate, formattedToDate]);

    const handleAmountChange = (index, monthlyAmount, budgetAmount, budgetPeriod) => {
        const newIncomes = [...incomes]; // Create a shallow copy of the incomes array
        newIncomes[index] = {
            ...newIncomes[index],
            accountName: 'My Account',
            monthlyAmount,
            budgetAmount : monthlyAmount,
            budgetPeriod,
            incomeDate: formattedIncomeDate // Add formattedIncomeDate to the updated entry
        };
        setIncomes(newIncomes); // Update the state with the new array
    };

    const handleDelete = (index) => {
        const itemToDelete = incomes[index];
        if (itemToDelete.id) {
            db.transaction((tx) => {
                tx.executeSql('DELETE FROM Income WHERE id = ?', [itemToDelete.id], () => {
                    fetchAllIncome(formattedFromDate, formattedToDate);
                    console.log('item deleted with id: ', itemToDelete.id)
                });
            });
        } else {
            const newIncomes = incomes.filter((_, i) => i !== index);
            setIncomes(newIncomes);
        }
    };

    return (
        <Pressable style={styles.container} onPress={handleOutsidePress}>
            <View>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Set Income Amount" titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>
            </View>

            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>
            <View style={styles.estimated_income_view}>
                <Text style={styles.estimated_income_txt}>Enter your estimated income...</Text>
            </View>

            <FlatList
                data={incomes}
                renderItem={({ item, index }) => (
                    <IncomeInput
                        // key={item.key}
                        item={item}
                        index={index}
                        selectedIncomeIndex={selectedIncomeIndex}
                        setSelectedIncomeIndex={setSelectedIncomeIndex}
                        onAmountChange={handleAmountChange}
                        onDelete={handleDelete}
                        onShowCalculator={handleShowCalculator}
                    />
                )}
                // keyExtractor={(item) => item.key}
                keyExtractor={(item, index) => index.toString()}
                style={styles.incomeList}
                ListFooterComponent={
                    <Pressable
                        onPress={() => setIncomes([...incomes, { id: null, accountName: 'My Account', monthlyAmount: '', budgetAmount: '', incomeDate: formattedIncomeDate, budgetPeriod: 'Monthly' }])}
                        style={styles.addIncomeButton}
                    >
                        <View style={styles.buttonContent}>
                            <VectorIcon name="plus" size={16} color={colors.white} type="mci" />
                            <Text style={styles.addIncomeLabel}>ADD INCOME</Text>
                        </View>
                    </Pressable>
                }
            />

            <Calculator
                visible={calculatorVisible}
                textInputValue={calculatorAmount}
                onValueChange={handleValueChange}
                onClose={() => setCalculatorVisible(false)}
            />

            <View style={styles.bottomButtonContainer}>
                <Button mode="text" textColor={colors.gray} 
                    onPress={() => {
                        if (envelope_prop) {
                            navigation.navigate('SetupBudget', { envelope_prop });
                        } else {
                            navigation.navigate('SetupBudget');
                        }
                    }}
                >
                    NO THANKS
                </Button>
                <Button
                    mode="text"
                    textColor={colors.androidbluebtn}
                    onPress={saveIncome}
                >
                    SAVE
                </Button>
            </View>
        </Pressable>
    );
};

export default SetIncomeAmount;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    tooltipContainer: {
        position: 'absolute',
        top: 4,
        right: 180,
        width: '50%',
        backgroundColor: colors.white,
        padding: 13,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
        zIndex: 10,
    },
    tooltipText: {
        color: colors.black,
        fontSize: hp('2.3%'),
        fontWeight: '400',
    },
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
    estimated_income_view: {
        height: hp('5%'),
    },
    estimated_income_txt: {
        fontSize: hp('2%'),
        color: colors.black,
        fontWeight: 'bold',
        marginTop: hp('1.5%'),
        marginLeft: hp('2%'),
    },

    //repeating view
    incomeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: hp('1.2%'),
        marginHorizontal: hp('2%'),
        // backgroundColor: colors.brightgreen,
    },
    //text 1 2 3 so on....
    indexText: {
        fontSize: hp('2%'),
        marginRight: hp('2%'),
        color: colors.black,
        alignSelf: 'flex-end',
    },
    textInput: {
        flex: 1,
        marginRight: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        height: hp('5%'),
        // backgroundColor: 'green',
        paddingHorizontal: 0,
        justifyContent: 'flex-end',
    },
    amount_text: {
        fontSize: hp('2.3%'),
        color: colors.black,
    },
    textInputFocused: {
        flex: 1,
        marginRight: 8,
        borderBottomWidth: 2.5,
        borderBottomColor: colors.brightgreen,
        height: hp('5%'),
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    //menu selector
    frequencySelector: {
        width: hp('22%'),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginRight: 8,
        // backgroundColor: colors.gray,
    },
    menuContentStyle: {
        width: hp('19%'),
        height: 'auto',
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
    },
    //text Monthly weekly...
    frequencyText: {
        fontSize: hp('2%'),
        color: colors.black,
        marginRight: 4,
    },

    // new code for addincome button
    addIncomeButton: {
        width: wp('33%'),
        height: hp('5%'),
        backgroundColor: colors.androidbluebtn,
        borderRadius: 2,
        marginLeft: wp('10%'),
        marginBottom: hp('1%'),
        marginTop: hp('2%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    addIncomeLabel: {
        color: colors.white,
        fontSize: hp('1.8%'),
        fontWeight: 'bold',
    },

    incomeList: {
        marginBottom: 56,
    },

    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: hp('2%'),
        marginVertical: hp('1%'),
    },
});
