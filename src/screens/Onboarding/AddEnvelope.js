import { StyleSheet, Text, View, Animated, Pressable, TouchableOpacity } from 'react-native'
import React, { useState, useRef, useMemo } from 'react'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, TextInput, Menu, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { debounce } from 'lodash';
import Calculator from './Calculator';

const { width: screenWidth } = dimensions;

const AddEnvelope = () => {
    const navigation = useNavigation();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const [envelopeNameFocused, setEnvelopeNameFocused] = useState(false);
    const [budgetAmountFocused, setBudgetAmountFocused] = useState(false);
    const [envelopeName, setEnvelopeName] = useState('');
    const [amount, setAmount] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [budgetPeriod, setBudgetPeriod] = useState('Monthly');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editEnvelope, setEditEnvelope] = useState(false);

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
        navigation.navigate('About');
    };

    const handleDateChange = (event, selectedDate) => {
        if (selectedDate) {
            setDueDate(selectedDate);
        }
        setShowDatePicker(false);
    };

    const formatDueDate = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    };

    const handleMenuToggle = useMemo(
        () => debounce(() => setMenuVisible(prev => !prev), 10),
        []
    );

    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content 
                title={editEnvelope ? "Edit Envelope" : "Add Envelope"} 
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
                    <TextInput
                        mode="flat"
                        dense={true}
                        value={amount}
                        onChangeText={(text) => setAmount(text)}
                        textColor={colors.black}
                        placeholder="0.00"
                        placeholderTextColor={colors.gray}
                        style={[styles.input, budgetAmountFocused ? styles.focused : styles.unfocused]}
                        onFocus={() => setBudgetAmountFocused(true)}
                        onBlur={() => setBudgetAmountFocused(false)}
                        theme={{ colors: { text: 'black', primary: colors.brightgreen } }}
                    />
                </View>
            </View>

            <View style={styles.budget_txt_amt_view}>
                <View style={styles.txt_view}>
                    <Text style={styles.label}>Budget Period</Text>
                </View>
                <View style={styles.amt_view}>
                    {budgetPeriod === 'Every Year' ? (
                        <Text style={styles.amountText}>{(amount / 12).toFixed(2)}</Text>
                    ) : budgetPeriod === 'Goal' ? (
                        <Text style={styles.amountText}>0.00</Text>
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
                        <Menu.Item onPress={() => { setBudgetPeriod('Monthly'); setMenuVisible(false); }} title="Monthly" />
                        <Menu.Item onPress={() => { setBudgetPeriod('Every Year'); setMenuVisible(false); }} title="Every Year" />
                        <Menu.Item onPress={() => { setBudgetPeriod('Goal'); setMenuVisible(false); }} title="Goal" />
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
                        <Text style={styles.dateText}>{formatDueDate(dueDate)}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            <View style={styles.secondView}>
                {editEnvelope ? (
                    <>
                        <Button
                            mode="text"
                            onPress={() => console.log('abc')}
                            contentStyle={styles.backButton}
                            labelStyle={styles.backText}
                            rippleColor={colors.lightGray}
                            style={styles.btn}
                        >
                            DELETE
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => console.log('abc')}
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
                        onPress={() => console.log('abc')}
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

        </Pressable>
    )
}

export default AddEnvelope

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
    focused: {
        borderBottomWidth: 1,
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
        height: hp('21%'),
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
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
        borderRadius: 0,
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
        borderRadius: 0,
    },

})
