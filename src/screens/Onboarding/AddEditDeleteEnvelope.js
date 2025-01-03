import { StyleSheet, Text, View, Animated, Pressable, Image, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, TextInput, Menu, Button, Snackbar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../constants/colors';
import Images from '../../constants/images';
import { useNavigation, useRoute } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { debounce } from 'lodash';
import Calculator from './Calculator';
import { db, addEnvelope, editEnvelope, deleteEnvelope } from '../../database/database';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';

const { width: screenWidth } = dimensions;

const AddEditDeleteEnvelope = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const envelope_prop = route.params?.envelope_prop;
    const edit_Envelope = route.params?.edit_Envelope;
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const [envelopeNameFocused, setEnvelopeNameFocused] = useState(false);
    const [budgetAmountFocused, setBudgetAmountFocused] = useState(false);
    const [envelopeName, setEnvelopeName] = useState('');
    const [amount, setAmount] = useState('');
    // console.log('value of amount is: ', amount);
    const [menuVisible, setMenuVisible] = useState(false);
    const [budgetPeriod, setBudgetPeriod] = useState('Monthly');

    // const [date, setDate] = useState(new Date());
    const [optionalDate, setOptionalDate] = useState(null);
    // console.log('optional date is ========----====: ', optionalDate);

    const [dueDate, setDueDate] = useState(new Date());
    const [formattedFromDate, setFormattedFromDate] = useState('');

    // console.log('value of dueDate: ' + dueDate);
    // console.log('value of formattedFromDate: ' + formattedFromDate);

    React.useEffect(() => {
        if (dueDate) {
            setFormattedFromDate(formatDateSql(dueDate));
        }
    }, [dueDate]);

    useFocusEffect(
        useCallback(() => {
            const currentDate = new Date();
            setDueDate(currentDate.toISOString());

            // For testing purposes, hardcoded due date
            // setDueDate('2025-01-01'); // Hardcoded due date
        }, [])
    );

    // for calculating number of months const calculateMonthsDifference = (dueDate) => {
    const calculateMonthsDifference = (optionalDate) => {
        // console.log('value of optionalDate ========: ' + optionalDate);
        if (!optionalDate) {
            return 0; // No dueDate means no months difference
        }

        const currentDate = new Date(); // Current date
        const dueDateObj = new Date(optionalDate); // Parse optionalDate if provided

        if (isNaN(dueDateObj)) {
            // console.log('Invalid optionalDate:', optionalDate);
            return 0; // Invalid date fallback
        }

        const dueMonth = dueDateObj.getMonth(); // Get month from optionalDate
        const dueYear = dueDateObj.getFullYear(); // Get year from optionalDate

        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Calculate the difference in months
        const monthsDifference =
            (dueYear - currentYear) * 12 + (dueMonth - currentMonth);

        return monthsDifference;
    };

    const monthsDifference = calculateMonthsDifference(optionalDate);

    // Determine the amount to display based on the logic
    const displayAmount = (() => {
        if (!optionalDate) {
            return budgetPeriod === 'Every Year' ? amount / 12 : 0; // Default case for no optionalDate
        }
        if (monthsDifference <= 1) {
            return amount; // Full amount for current month or next month
        }
        if (monthsDifference > 1) {
            return amount / monthsDifference; // Divide by monthsDifference for future dates
        }
        return 0; // Fallback for any unexpected case
    })();

    // Ensure displayAmount is always a valid number
    // const safeDisplayAmount = isNaN(displayAmount) ? 0 : displayAmount; // normal all decimals
    // const safeDisplayAmount = isNaN(displayAmount) ? 0 : Math.ceil(displayAmount); // round to uppder close integer
    const safeDisplayAmount = isNaN(displayAmount) ? 0 : Math.round(displayAmount * 100) / 100;  // rounds to two decodeURIComponent



    // code for optionalDate ends here


    // console.log('value of optionalDate in addeditdeleteenvelope', optionalDate);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    // console.log('vlaue of user_id in SetupBudget', user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    // console.log('value of temp_user_id in SetupBudget', temp_user_id);
    const [tempUserId, setTempUserId] = useState(temp_user_id);
    // const temporayUserId = tempUserId.toString();
    // console.log('value of tempUserId in SetupBudget', tempUserId);
    useEffect(() => {
        if (isAuthenticated) {
            setTempUserId(user_id);
        } else {
            setTempUserId(-1);
        }
    }, [isAuthenticated, user_id]); // Re-run the effect if either isAuthenticated or userId changes

    // code for calculator
    const [calculatorVisible, setCalculatorVisible] = useState(false);
    const handleValueChange = (amount) => {
        setAmount(amount);
        setCalculatorVisible(false);
    };

    const envelopeId = route.params?.envelopeId;
    useEffect(() => {
        if (envelopeId) {
            setEnvelopeName(route.params.envelopeName);
            setAmount(route.params.amount.toString());
            setBudgetPeriod(route.params.budgetPeriod);
            setDueDate(route.params.fillDate);
        }
    }, [envelopeId, route.params]);

    const handleDelete = () => {
        deleteEnvelope(envelopeId);
        if (envelope_prop) {
            navigation.navigate('SetupBudget', {
                envelope_prop: envelope_prop,
            });
        } else {
            navigation.navigate('SetupBudget');
        }
    };

    const handleSave = () => {
        if (envelopeId) {
            editEnvelope(envelopeId, envelopeName, parseFloat(amount), budgetPeriod, tempUserId, formattedFromDate);
        } else {
            if (!envelopeName || !amount || !budgetPeriod || !tempUserId) {
                setSnackbarVisible(true);
                return;
            } else {
                addEnvelope(envelopeName, parseFloat(amount), budgetPeriod, tempUserId, formattedFromDate);
            }
        }
        if (envelope_prop) {
            navigation.navigate('SetupBudget', { envelope_prop });
        } else {
            navigation.navigate('SetupBudget');
        }
    };

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
        navigation.navigate('Help', {from_addeditdelete_envelope: true});
    };

    const handleDateChange = (event, selectedDate) => {
        if (selectedDate) {
            setOptionalDate(selectedDate);
            // setDueDate(selectedDate);
        }
        setShowDatePicker(false);
    };

    const formatDueDate = (date) => {
        // If the input is a string, convert it to a Date object
        if (typeof date === 'string') {
            date = new Date(date);
        }

        if (date === null) {
            // console.warn('Date is null');
            return true; // Allow null to pass through since it's valid initially
        }
        // Ensure that the input is a Date object
        if (!(date instanceof Date) || isNaN(date)) {
            console.error('Invalid date object');
            return;
        }

        // Get month, day, and year from the Date object
        const month = String(date.getMonth() + 1).padStart(2, '0');  // Add 1 to get correct month (0-based index)
        const day = String(date.getDate()).padStart(2, '0');  // Ensure 2-digit day
        const year = date.getFullYear();  // Get the full year

        // Return the formatted date string as MM/DD/YYYY
        return `${month}/${day}/${year}`;
    };


    const handleMenuToggle = useMemo(
        () => debounce(() => setMenuVisible(prev => !prev), 10),
        []
    );

    return (
        <Pressable style={{ flex: 1, backgroundColor: colors.white }} 
            onPress={() => {
                setBudgetAmountFocused(false);
                handleOutsidePress();
            }}
        >
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content 
                title={edit_Envelope ? "Edit Envelope" : "Add Envelope"} 
                titleStyle={styles.appbar_title} />
                <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
            </Appbar.Header>
            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.name_amount_view}>
                <View style={styles.name_view}>
                    <Text style={styles.label}>Envelope Name</Text>
                    <TextInput
                        mode="flat"
                        dense={true}
                        value={envelopeName}
                        onChangeText={(text) => setEnvelopeName(text)}
                        textColor={colors.black}
                        style={[styles.input, envelopeNameFocused ? styles.focused : styles.unfocused]}
                        onFocus={() => setEnvelopeNameFocused(true)}
                        onBlur={() => setEnvelopeNameFocused(false)}
                        theme={{ colors: { text: 'black', primary: colors.brightgreen } }}
                    />
                </View>
                <View style={styles.amount_view}>
                    <Text style={styles.label}>Budget Amount</Text>
                    {/* <TextInput
                        // onPress={() => setCalculatorVisible(true)} //
                        // editable={false} 
                        onPressIn={() => {
                            Keyboard.dismiss(); // Dismiss the keyboard when the TextInput is pressed
                            setCalculatorVisible(true); // Show the calculator
                        }} 
                      
                        value={amount}
                        onChangeText={(text) => setAmount(text)}
                        textColor={colors.black}
                        placeholder="0.00"
                        placeholderTextColor={colors.gray}
                        style={[styles.input, budgetAmountFocused ? styles.focused : styles.unfocused]}
                        onFocus={() => setBudgetAmountFocused(true)}
                        onBlur={() => setBudgetAmountFocused(false)}
                        theme={{ colors: { text: 'black', primary: colors.brightgreen } }}
                        mode="flat"
                        dense={true}
                    /> */}
                    <TouchableWithoutFeedback
                        onPressIn={() => {
                            setBudgetAmountFocused(true);
                        }}
                        onPress={() => {
                            Keyboard.dismiss();
                            setCalculatorVisible(true);
                        }}>
                        <View style={[styles.touchable_input, budgetAmountFocused ? styles.touchable_focused : styles.unfocused]}>
                            <Text style={{ color: colors.black }}>{amount || '0.00'}</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </View>

            <View style={styles.budget_txt_amt_view}>
                <View style={styles.txt_view}>
                    <Text style={styles.label}>Budget Period</Text>
                </View>
                {/* <View style={styles.amt_view}>
                    {budgetPeriod === 'Every Year' ? (
                        <Text style={styles.amountText}>
                            {monthsDifference > 0 ? (amount / safeMonthsDifference).toFixed(2) : 0.00}
                        </Text>
                    ) : budgetPeriod === 'Goal' ? (
                            <Text style={styles.amountText}>
                                {monthsDifference > 0 ? (amount / safeMonthsDifference).toFixed(2) : 0.00}
                            </Text>
                    ) : null}
                </View> */}
                <View style={styles.amt_view}>
                    {budgetPeriod === 'Every Year' || budgetPeriod === 'Goal' ? (
                        <Text style={styles.amountText}>{safeDisplayAmount}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.budgetPeriodContainer}>
                <View style={styles.txt_view}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TouchableOpacity style={styles.txt_icon_view} onPress={handleMenuToggle}>
                                <Text style={styles.menuButtonText}>{budgetPeriod}</Text>
                                <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                            </TouchableOpacity>
                        }
                        contentStyle={styles.menuContentStyle}
                    >
                        <Menu.Item onPress={() => { setBudgetPeriod('Monthly'); setMenuVisible(false); }} title="Monthly" titleStyle={{ color: colors.black }} />
                        <Menu.Item onPress={() => { setBudgetPeriod('Every Year'); setMenuVisible(false); }} title="Every Year" titleStyle={{ color: colors.black }} /> 
                        <Menu.Item onPress={() => { setBudgetPeriod('Goal'); setMenuVisible(false); }} title="Goal" titleStyle={{ color: colors.black }} />
                    </Menu>
                </View>
                <View style={styles.amt_view}>
                    {budgetPeriod !== 'Monthly' && (
                        <Text style={styles.label}> Monthly</Text>
                    )}
                </View>
            </View>

            {budgetPeriod !== 'Monthly' && (
                <View style={styles.additionalInfo}>
                    <Text style={styles.label}>Due Date (optional)</Text>

                    <TouchableOpacity
                        style={styles.dueDateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>{formatDueDate(optionalDate)}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showDatePicker && (
                <DateTimePicker
                    // value={optionalDate}
                    value={optionalDate ? new Date(optionalDate) : new Date()} // Use current date as fallback if optionalDate is null or invalid
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <View style={styles.secondView}>
                {edit_Envelope ? (
                    <>
                        <Button
                            mode="text"
                            onPress={handleDelete}
                            contentStyle={styles.backButton}
                            labelStyle={styles.backText}
                            rippleColor={colors.lightGray}
                            style={styles.btn}
                        >
                            DELETE
                        </Button>
                        <Button
                            mode="text"
                            onPress={handleSave}
                            contentStyle={styles.nextButton}
                            labelStyle={styles.nextText}
                            rippleColor={colors.lightGray}
                            style={styles.btn}
                        >
                            SAVE
                        </Button>
                    </>
                ) : (
                    <View style={styles.centerContainer}>
                    <Button
                        mode="text"
                        onPress={handleSave}
                        contentStyle={styles.centerButton}
                        labelStyle={styles.nextText}
                        rippleColor={colors.lightGray}
                        style={styles.centerbtn}
                    >
                        SAVE
                    </Button>
                    </View>
                )}
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={1000}
                style={[
                    styles.snack_bar,
                    {
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        right: 20,
                        zIndex: 1000,
                    }
                ]}
            >
                <View style={styles.img_txt_view}>
                    <Image
                        source={Images.expenseplannerimage}
                        style={styles.snack_bar_img}
                    />
                    <Text style={styles.snack_bar_text}>All fields required!</Text>
                </View>
            </Snackbar>

            <Calculator
                visible={calculatorVisible}
                textInputValue={amount}
                onValueChange={handleValueChange}
                onClose={() => setCalculatorVisible(false)}
            />

        </Pressable>
    )
}

export default AddEditDeleteEnvelope

const styles = StyleSheet.create({
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
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
    name_amount_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: ('1%'),
        paddingHorizontal: ('3%'),
    },
    name_view: {
        flex: 1.7,
        marginRight: 8,
    },
    amount_view: {
        flex: 1,
        marginLeft: 5,
    },
    label: {
        fontSize: hp('2%'),
        color: colors.gray,
    },
    input: {
        height: hp('1%'),
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 0,
        marginVertical: 10,
    },
    touchable_input: {
        height: hp('4%'),
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 0,
        marginVertical: 10,
    },
    touchable_focused: {
        borderBottomWidth: 2.5,
        borderBottomColor: colors.brightgreen,
    },
    focused: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },
    unfocused: {
        borderBottomColor: 'gray',
    },
    budget_txt_amt_view: {
        flexDirection: 'row',
        marginLeft: hp('1.5%'),
    },
    txt_view: {
        flex: 1.7,
    },
    amt_view: {
        flex: 1,
    },
    amountText: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.gray,
    },
    budgetPeriodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    txt_icon_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: hp('1.5%'),
        paddingRight: hp('3%'),
    },
    menuButtonText: {
        fontSize: hp('2.3%'),
        color: colors.black,
        fontWeight: '400',
    },
    menuContentStyle: {
        width: hp('22.5%'),
        // height: hp('21%'),
        height: 'auto',
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
        color: colors.black,
    },
    additionalInfo: {
        marginLeft: hp('1.5%'),
    },
    dueDateInput: {
        width: wp('45%'),
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        paddingVertical: 0,
        paddingHorizontal: 0,
        fontSize: 16,
        color: 'black',
        marginTop: 8,
    },
    dateText: {
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    secondView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: hp('10%'),
        paddingHorizontal: hp('7%'),
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        justifyContent: 'flex-start',
    },
    backText: {
        fontSize: hp('2%'),
        color: colors.gray,
        marginLeft: wp('5%'),
    },
    btn: {
        borderRadius: 50,
    },
    nextButton: {
        justifyContent: 'flex-end',
    },
    nextText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
        marginRight: wp('5%'),
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
    },
    centerButton: {
        justifyContent: 'center',
    },
    centerbtn: {
        borderRadius: 50,
    },

    // snackbar styles
    snack_bar: {
        backgroundColor: colors.gray,
        borderRadius: 50,
        zIndex: 1000,
    },
    img_txt_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    snack_bar_img: {
        width: wp('10%'),
        height: hp('3%'),
        marginRight: 10,
        resizeMode: 'contain',
    },
    snack_bar_text: {
        color: colors.white,
        fontSize: hp('2%'),
    },
})
