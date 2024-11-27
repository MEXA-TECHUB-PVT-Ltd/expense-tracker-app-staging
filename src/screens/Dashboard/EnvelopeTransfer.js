import { StyleSheet, Text, View, Animated, Pressable, TouchableOpacity, ScrollView, Image, Keyboard, FlatList, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useRef, useMemo, useCallback } from 'react'
import { debounce } from 'lodash';
import { useFocusEffect } from '@react-navigation/native';
import Calculator from '../Onboarding/Calculator';
import DateTimePicker from '@react-native-community/datetimepicker';
import Images from '../../constants/images';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar, TextInput, Menu, Snackbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { db } from '../../database/database';
import { useSelector } from 'react-redux';

const { width: screenWidth } = dimensions;

const EnvelopeTransfer = () => {
    const navigation = useNavigation();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    // code of tooltip
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
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
        navigation.navigate('Help', { from_envelopetransfer: true });
    };

    // code for functionality
    const [focusedInput, setFocusedInput] = useState(null);
    const [focusedInputAmount, setFocusedInputAmount] = useState(false);
    const [payee, setPayee] = useState('Envelope Transfer');
    // console.log('value of description is: ', payee);

    const [transactionAmount, setTransactionAmount] = useState(0);
    // console.log('value of amount to transfer is: ', transactionAmount);
    const [calculatorVisible, setCalculatorVisible] = useState(false);
    const handleValueChange = (amount) => {
        setTransactionAmount(amount);
        setCalculatorVisible(false);
    };

    const [envelopeRemainingIncome, setEnvelopeRemainingIncome] = useState(0);
    const [envelopeMenuVisibleTo, setEnvelopeMenuVisibleTo] = useState(false);
    const [envelopeMenuVisibleFrom, setEnvelopeMenuVisibleFrom] = useState(false);
    const [selectedEnvelopeTo, setSelectedEnvelopeTo] = useState(false);
    // console.log('selected envelope to is: ', selectedEnvelopeTo);
    const [selectedEnvelopeFrom, setSelectedEnvelopeFrom] = useState(false);
    // console.log('selected envelope from is: ', selectedEnvelopeFrom);
    const handleEnvelopeMenuToggleTo = useMemo(
        () => debounce(() => setEnvelopeMenuVisibleTo(prev => !prev), 10),
        []
    );
    const handleEnvelopeMenuToggleFrom = useMemo(
        () => debounce(() => setEnvelopeMenuVisibleFrom(prev => !prev), 10),
        []
    );

    // for getting user id from redux
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(user_id);
    // console.log('value of tempUserId in state inside AddEditDeleteTransaction', tempUserId);
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                setTempUserId(user_id);
            } else {
                setTempUserId(temp_user_id);
            }
        }, [isAuthenticated, user_id, temp_user_id])
    );

    // code for getting all envelopes from envelopes table
    const [envelopes, setEnvelopes] = useState([]);
    useFocusEffect(
        useCallback(() => {
            getAllEnvelopes(setEnvelopes, tempUserId);
        }, [tempUserId])
    );
    const getAllEnvelopes = (callback) => {
        db.transaction(tx => {
            const sqlQuery = 'SELECT * FROM envelopes WHERE user_id = ? ORDER BY orderIndex';
            tx.executeSql(
                sqlQuery,
                [tempUserId],
                (_, results) => {
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

    // code for date 
    const [transactionDate, setTransactionDate] = useState(new Date());
    // console.log('todays date is: ', transactionDate);
    const [show, setShow] = useState(false);
    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || transactionDate;
        setShow(false);
        setTransactionDate(currentDate);
    };
    // this was working fine before
    const formatDate = (transactionDate) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return transactionDate.toLocaleDateString('en-US', options);
    };

    // code for note
    const [note, setNote] = useState(null);
    // console.log('value of note is: ', note);

    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // transactions code
    const handleIconPressWrapper = () => {
        handleIconPress(
            transactionAmount,
            selectedEnvelopeFrom,
            selectedEnvelopeTo,
            payee,
            note,
            tempUserId,
            transactionDate
        );
    };
    const handleIconPress = (transactionAmount, selectedEnvelopeFrom, selectedEnvelopeTo, payee, note, tempUserId, transactionDate) => {
        
        if (!transactionAmount || !selectedEnvelopeFrom || !selectedEnvelopeTo || !payee || !tempUserId || !transactionDate) {
            setSnackbarVisible(true);  // Set the SnackBar visible if any value is missing
            console.log("Missing required fields");
            return; // Exit the function early, don't proceed with the transaction
        }
        
        // console.log('values inside envelope transfer transaction: ', transactionAmount, selectedEnvelopeFrom, selectedEnvelopeTo, payee, note, tempUserId, transactionDate);
        db.transaction(
            tx => {
                // Deduct amount from selectedEnvelopeFrom
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome - ? WHERE envelopeName = ?`,
                    [transactionAmount, selectedEnvelopeFrom],
                    () => console.log('Amount deducted from', selectedEnvelopeFrom),
                    (_, error) => {
                        console.error('Error deducting amount:', error);
                        return true; // Rollback transaction
                    }
                );

                // Add amount to selectedEnvelopeTo
                tx.executeSql(
                    `UPDATE envelopes SET filledIncome = filledIncome + ? WHERE envelopeName = ?`,
                    [transactionAmount, selectedEnvelopeTo],
                    () => console.log('Amount added to', selectedEnvelopeTo),
                    (_, error) => {
                        console.error('Error adding amount:', error);
                        return true; // Rollback transaction
                    }
                );

                // Add expense transaction for selectedEnvelopeFrom
                tx.executeSql(
                    `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, transactionNote, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [payee, transactionAmount, 'Expense', selectedEnvelopeFrom, transactionDate, note, tempUserId],
                    () => console.log('Expense transaction added'),
                    (_, error) => {
                        console.error('Error inserting expense transaction:', error);
                        return true; // Rollback transaction
                    }
                );

                // Add credit transaction for selectedEnvelopeTo
                tx.executeSql(
                    `INSERT INTO Transactions (payee, transactionAmount, transactionType, envelopeName, transactionDate, transactionNote, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [payee, transactionAmount, 'Credit', selectedEnvelopeTo, transactionDate, note, tempUserId],
                    () => console.log('Credit transaction added'),
                    (_, error) => {
                        console.error('Error inserting credit transaction:', error);
                        return true; // Rollback transaction
                    }
                );
            },
            error => {
                console.error('Transaction failed, rolling back:', error);
            },
            () => {
                console.log('Transaction completed successfully');
                navigation.navigate('Transactions');
            }
        );
    };



    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <View style={styles.container}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Envelope Transfer" titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleIconPressWrapper} icon="check" color={colors.white} />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>

                <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity onPress={handleTooltipPress}>
                        <Text style={styles.tooltipText}>Help</Text>
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView style={{ flex: 1, marginTop: 5 }}>
                    {/* From envelope menu code */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>From</Text>
                        <View style={styles.envelope_type_view}>
                            <Menu
                                visible={envelopeMenuVisibleFrom}
                                onDismiss={() => setEnvelopeMenuVisibleFrom(false)}
                                anchor={
                                    <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleEnvelopeMenuToggleFrom}>
                                        <Text style={styles.selectionText}>{selectedEnvelopeFrom || '-Select Envelope-'}</Text>
                                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                                    </TouchableOpacity>
                                }
                                contentStyle={[styles.envelopeMenuContentStyle, { maxHeight: 300 }]}
                            >
                                <Menu.Item title="-Select Envelope-" titleStyle={styles.envelop_menu_title_txt} disabled />
                                <FlatList
                                    data={envelopes}
                                    keyExtractor={(item) => item.envelopeId.toString()}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item }) => (
                                        <Menu.Item
                                            onPress={() => {
                                                setSelectedEnvelopeFrom(item.envelopeName);
                                                setEnvelopeMenuVisibleFrom(false);
                                                setEnvelopeRemainingIncome(item.filledIncome);
                                            }}
                                            title={`${item.envelopeName} [${item.filledIncome || 0} left]`}
                                            titleStyle={{ color: colors.black }}
                                        />
                                    )}
                                />
                            </Menu>
                        </View>
                    </View>

                    {/* To envelope menu code */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>To</Text>
                        <View style={styles.envelope_type_view}>
                            <Menu
                                visible={envelopeMenuVisibleTo}
                                onDismiss={() => setEnvelopeMenuVisibleTo(false)}
                                anchor={
                                    <TouchableOpacity style={styles.envelope_txt_icon_view} onPress={handleEnvelopeMenuToggleTo}>
                                        <Text style={styles.selectionText}>{selectedEnvelopeTo || '-Select Envelope-'}</Text>
                                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                                    </TouchableOpacity>
                                }
                                contentStyle={[styles.envelopeMenuContentStyle, { maxHeight: 300 }]}
                            >
                                <Menu.Item title="-Select Envelope-" titleStyle={styles.envelop_menu_title_txt} disabled />
                                <FlatList
                                    data={envelopes}
                                    keyExtractor={(item) => item.envelopeId.toString()}
                                    showsVerticalScrollIndicator={true}
                                    renderItem={({ item }) => (
                                        <Menu.Item
                                            onPress={() => {
                                                setSelectedEnvelopeTo(item.envelopeName);
                                                setEnvelopeMenuVisibleTo(false);
                                                setEnvelopeRemainingIncome(item.filledIncome);
                                            }}
                                            title={`${item.envelopeName} [${item.filledIncome || 0} left]`}
                                            titleStyle={{ color: colors.black }}
                                        />
                                    )}
                                />
                            </Menu>
                        </View>
                    </View>

                    {/* transaction amount and type */}
                    <View style={styles.amt_type_view}>
                        <View style={styles.amt_view}>
                            <Text style={styles.payee_title}>Amount</Text>
                            <View style={styles.name_input_view}>
                                <View style={styles.input_view}>
                                    <TouchableWithoutFeedback
                                        onPressIn={() => {
                                            setFocusedInputAmount(true);
                                        }}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setCalculatorVisible(true);
                                        }}>
                                        <View style={[styles.touchable_input, focusedInputAmount ? styles.touchable_focusedInput : styles.touchable_input]}>
                                            <Text style={{ color: colors.black, fontSize: hp('2.5%') }}>{transactionAmount || '0.00'}</Text>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </View>
                        </View>
                    </View>



                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.payee_title}>Description</Text>
                        <View style={styles.name_input_view}>
                            <View style={styles.input_view}>
                                <TextInput
                                    value={payee}
                                    onChangeText={setPayee}
                                    mode="flat"
                                    placeholder='Envelope Transfer'
                                    style={[
                                        styles.input,
                                        focusedInput === 'payee' ? styles.focusedInput : {}
                                    ]}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    dense={true}
                                    onFocus={() => setFocusedInput('payee')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* date */}
                    <View style={styles.how_to_fill_view}>
                        <Text style={styles.title}>Date</Text>
                        <TouchableOpacity
                            style={styles.dueDateInput}
                            onPress={() => setShow(true)}
                        >
                            <Text style={styles.dateText}>{formatDate(transactionDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    {show && (
                        <DateTimePicker
                            value={transactionDate}
                            mode="date"
                            display="default"
                            onChange={onChange}
                        />
                    )}

                    {/* for note */}
                    <View style={styles.notes_main_view}>
                        <Text style={styles.title}>Note</Text>
                        <View style={styles.name_input_view}>
                            <View style={styles.input_view}>
                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    mode="flat"
                                    placeholder='(optional)'
                                    style={[
                                        styles.input,
                                        focusedInput === 'note' ? styles.focusedInput : {}
                                    ]}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    dense={true}
                                    multiline={true}
                                    onFocus={() => setFocusedInput('note')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </View>
                    </View>

                    <Calculator
                        visible={calculatorVisible}
                        textInputValue={transactionAmount}
                        onValueChange={handleValueChange}
                        onClose={() => setCalculatorVisible(false)}
                    />

                </ScrollView>

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

            </View>
        </Pressable>
    )
}

export default EnvelopeTransfer

const styles = StyleSheet.create({
    container: {
        flex: 1,
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

    // for tooltip
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


    // view
    how_to_fill_view: {
        paddingHorizontal: hp('1.5%'),
    },
    payee_title: {
        fontSize: hp('2.5%'),
        color: colors.gray,
    },
    name_input_view: {
        flexDirection: 'row',
    },
    input_view: {
        flex: 1,
        flexDirection: 'row',
    },
    input: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    focusedInput: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },

    // touchable input styles
    touchable_input: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
        marginTop: hp('1%'),
    },
    touchable_focusedInput: {
        borderBottomWidth: 2.5,
        borderBottomColor: colors.brightgreen,
    },

    title: {
        fontSize: hp('2.5%'),
        color: colors.gray,
        marginVertical: hp('1%'),
    },
    envelope_type_view: {
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        justifyContent: 'flex-end',
        paddingBottom: hp('0.5%'),
    },
    envelope_txt_icon_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionText: {
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    envelopeMenuContentStyle: {
        width: hp('42%'),
        height: 'auto',
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
        color: colors.black,
    },
    envelop_menu_title_txt: {
        fontSize: hp('2%'),
        color: colors.black,
    },

    // amount view styles
    amt_type_view: {
        marginHorizontal: hp('1.5%'),
        flexDirection: 'row',
    },
    amt_view: {
        flex: 1,
    },
    amt_input_view: {
        borderBottomWidth: 1,
    },

    // date view styles
    dueDateInput: {
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

    notes_main_view: {
        flex: 1,
        paddingHorizontal: hp('1.5%'),
        paddingBottom: hp('36%'),
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