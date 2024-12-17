import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, FlatList, BackHandler, Animated, Image, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, Button, Snackbar, Modal } from 'react-native-paper';
import { VectorIcon } from '../../constants/vectoricons';
import colors from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { db, fetchTotalIncomeSetupBudget, fetchTotalEnvelopesAmount } from '../../database/database';
import { useSelector } from 'react-redux';
import { formatDateSql } from '../../utils/DateFormatter';
import moment from 'moment';

const { width: screenWidth } = dimensions;

const SetupBudget = () => {
    const route = useRoute();
    const edit_envelope = route.params?.edit_envelope;
    const envelope_prop = route.params?.envelope_prop;
    const navigation = useNavigation();

    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(temp_user_id);
    useEffect(() => {
        if (isAuthenticated) {
            setTempUserId(user_id);
        } else {
            setTempUserId(temp_user_id);
        }
    }, [isAuthenticated, user_id]);

    // Function to drop rows with user_id -1 in Envelopes and Income tables
    const dropEnvelopesAndIncome = () => {
        db.transaction(tx => {
            // Delete rows from Envelopes table
            tx.executeSql(
                `DELETE FROM envelopes WHERE user_id = -1`,
                [],
                (_, result) => console.log('Deleted envelopes with user_id -1'),
                (_, error) => console.log('Error deleting envelopes:', error)
            );

            // Delete rows from Income table
            tx.executeSql(
                `DELETE FROM Income WHERE user_id = -1`,
                [],
                (_, result) => console.log('Deleted income with user_id -1'),
                (_, error) => console.log('Error deleting income:', error)
            );
        });
    };
    // Use useFocusEffect to run dropEnvelopesAndIncome only when coming from Onboarding
    useFocusEffect(
        useCallback(() => {
            if (route.params?.fromOnboarding) {
                dropEnvelopesAndIncome();
            }
        }, [route.params])
    );

    // to conditionally navigate user based on isAuthenticated state from redux
    // Hardware back button handler
    // useFocusEffect(
    //     useCallback(() => {
    //         const onBackPress = () => {
    //             if (isAuthenticated) {
    //                 navigation.navigate('TopTab');
    //                 return true; // Prevent default back action
    //             }
    //             return false; // Allow default back action if not authenticated
    //         };

    //         BackHandler.addEventListener('hardwareBackPress', onBackPress);

    //         // Cleanup listener on unmount
    //         return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    //     }, [isAuthenticated, navigation])
    // );

    // Function to determine whether to navigate to TopTab or go back
    const navigateBack = () => {
        if (isAuthenticated && (navigation.isFocused() && (navigation.getState().routes[navigation.getState().index]?.name === 'SetupBudget' || navigation.getState().routes[navigation.getState().index]?.name === 'FillEnvelopes'))) {
            // Navigate to TopTab if authenticated and currently on SetupBudget or FillEnvelopes
            navigation.navigate('TopTab');
        } else {
            // Normal goBack behavior for other cases
            navigation.goBack();
        }
    };

    // Back icon handler
    const handleLeftIconPress = () => {
        navigateBack();
    };

    // Hardware back button handler
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigateBack();
                return true; // Prevent default back action
            };

            // Attach the event listener
            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            // Cleanup the event listener on unmount
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [isAuthenticated, navigation])
    );

    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const [envelopes, setEnvelopes] = useState([]);
    console.log('after rearrange envelopes state is: ', envelopes);
    const [totalIncome, setTotalIncome] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    // console.log('value of remainingAmount: ', remainingAmount);

    // to get current month dates and then formate them into our sql date formate
    const [formattedFromDate, setFormattedFromDate] = useState('');
    const [formattedToDate, setFormattedToDate] = useState('');

    // console.log('Formatted From Date in setupBudget :', formattedFromDate);
    // console.log('Formatted To Date in setupBudget :', formattedToDate);

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

    // code for getting current year 
    const startOfYear = moment().startOf('year').toISOString();
    const endOfYear = moment().endOf('year').toISOString();
    // Format the dates using the formatDateSql function
    const formattedFromDateYearly = formatDateSql(startOfYear);
    const formattedToDateYearly = formatDateSql(endOfYear);

    console.log(' date of formattedFromDateYearly', formattedFromDateYearly);
    console.log(' date of formattedToDateYearly', formattedToDateYearly);

    useFocusEffect(
        useCallback(() => {
            getAllEnvelopes(tempUserId, setEnvelopes, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
        }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly])
    );
    const getAllEnvelopes = (tempUserId, callback) => {
        db.transaction(tx => {
            const sqlQuery = `
    SELECT * 
    FROM envelopes 
    WHERE user_id = ? 
    AND (
        (budgetPeriod IN ('Monthly', 'Goal') AND fillDate BETWEEN ? AND ?)
        OR 
        (budgetPeriod = 'Every Year' AND fillDate BETWEEN ? AND ?)
    )
    ORDER BY orderIndex
`;
            console.log('Executing Query:', sqlQuery);
            console.log('Params:', tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
            tx.executeSql(
                sqlQuery,
                [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly],
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

    //to update/sync order of envelopes in table
    const updateEnvelopeOrderInDatabase = (data) => {
        db.transaction(tx => {
            data.forEach((envelope, index) => {
                const sqlQuery = 'UPDATE envelopes SET orderIndex = ? WHERE envelopeId = ?';
                tx.executeSql(
                    sqlQuery,
                    [index, envelope.envelopeId],
                    (_, result) => {
                        console.log(`Updated order of envelopeId ${envelope.envelopeId} to ${index}`);
                    },
                    (_, error) => {
                        console.log('Error updating order in database:', error);
                        return true;
                    }
                );
            });
        }, (error) => {
            console.log('Transaction Error:', error);
        });
    };

    const handleEditEnvelope = (envelope) => {
        // console.log('value of usr_id is: ', envelope.user_id);
        // Check if envelope_prop exists
        console.log('all values of envelope for editing: ', envelope);
        if (envelope_prop) {
            navigation.navigate('AddEditDeleteEnvelope', {
                envelopeId: envelope.envelopeId,
                envelopeName: envelope.envelopeName,
                amount: envelope.amount,
                budgetPeriod: envelope.budgetPeriod,
                dueDate: envelope.dueDate,
                edit_Envelope: true,
                user_id: envelope.user_id,
                fillDate: envelope.fillDate,
                envelope_prop: envelope_prop, // Pass envelope_prop if it exists
            });
        } else {
            // Navigate without envelope_prop if it doesn't exist
            navigation.navigate('AddEditDeleteEnvelope', {
                envelopeId: envelope.envelopeId,
                envelopeName: envelope.envelopeName,
                amount: envelope.amount,
                budgetPeriod: envelope.budgetPeriod,
                dueDate: envelope.dueDate,
                edit_Envelope: true,
                user_id: envelope.user_id,

            });
        }
    };

    // useFocusEffect(() => {
    //     fetchTotalIncomeSetupBudget(setTotalIncome, formattedFromDate, formattedToDate, tempUserId);
    // });

    useFocusEffect(
        useCallback(() => {
            fetchTotalIncomeSetupBudget(setTotalIncome, tempUserId, formattedFromDate, formattedToDate);
        }, [tempUserId, formattedFromDate, formattedToDate])  // Add dependencies to re-fetch on change
    );

    const calculateRemainingAmount = (totalIncome, envelopes) => {
        const totalExpenses = envelopes.reduce((sum, envelope) => sum + envelope.amount, 0);
        return totalIncome - totalExpenses;
    };

    useFocusEffect(
        useCallback(() => {
            const remaining = calculateRemainingAmount(totalIncome, envelopes);
            setRemainingAmount(remaining);
        }, [totalIncome, envelopes])
    );

    const [noEnvelopeAlertVisible, setNoEnvelopeAlertVisible] = useState(false);
    const handleNextPress = () => {
        if (envelopes.length === 0) {
            setNoEnvelopeAlertVisible(true);
        } else if (totalIncome < 0) {
            setNegativeIncomeModal(true);
        } else {
            navigation.navigate('FillEnvelopes');
        }
    };


    // screen
    // const handleLeftIconPress = () => {
    //     if (isAuthenticated) {
    //         navigation.navigate('TopTab');
    //     } else {
    //         navigation.goBack();
    //     }
    // };


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
        navigation.navigate('Help', { from_setupbudget: true });
    };

    const handleAddEnvelope = () => {
        if (envelope_prop) {
            navigation.navigate('AddEditDeleteEnvelope', { envelope_prop });
        } else {
            navigation.navigate('AddEditDeleteEnvelope');
        }
    };

    // for showing total sum of all envelopes incomes single sumup of all
    const [totalSumOfEnvelopes, setTotalSumOfAllEnvelopes] = useState(0);
    useFocusEffect(
        React.useCallback(() => {
            const totalSum = envelopes.reduce((sum, envelope) => sum + envelope.amount, 0);
            setTotalSumOfAllEnvelopes(totalSum);
        }, [envelopes])
    );


    // if totalIncome is negative show modal
    const [negativeIncomeModal, setNegativeIncomeModal] = useState(false);
    const handleEditPress = () => {
        setNegativeIncomeModal(false);
    };
    const handleKeepGoing = () => {
        setNegativeIncomeModal(false);
        navigation.navigate('FillEnvelopes');
    };

    // pressing remaining view if negative or positive shows relevent message modal
    const [remainingModalVisible, setRemainingModalVisible] = useState(false);
    const handleRemainingPress = () => {
        setRemainingModalVisible(true);
    };
    const handleRemainingClose = () => {
        setRemainingModalVisible(false);
    };

    return (
        <Pressable style={styles.container} onPress={handleOutsidePress}>
            <View>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title={envelope_prop ? "Edit Envelopes" : "Setup Budget"} titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>
            </View>
            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>

            <Button
                mode="contained"
                style={styles.buttonbody}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttontitle}
                textColor={colors.white}
                onPress={handleAddEnvelope}
            >
                ADD ENVELOPE
            </Button>

            {/* <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scroll_view}
            > */}
            <TouchableWithoutFeedback
                // onPress={() => navigation.navigate('ChangeBudgetPeriod')} 
                style={styles.budget_period_view}
            >
                <Text style={styles.monthly_txt}>Monthly</Text>
                {/* <VectorIcon name="menu-down" size={24} color={colors.black} type="mci" />
                    <Text style={styles.envelope_left_txt}>8 of 10 free Envelopes left</Text> */}
            </TouchableWithoutFeedback>

            <View style={styles.flatListWrapper}>
                {envelopes.length > 0 ? (
                <DraggableFlatList
                    data={envelopes}
                    onDragEnd={({ data }) => {
                        setEnvelopes(data); // Update the state with the new order
                        updateEnvelopeOrderInDatabase(data); // Update the database with the new order
                    }}
                    // key={envelopes.envelopeId}
                    keyExtractor={(item) => item.envelopeId}
                    renderItem={({ item, drag, isActive }) => (
                        <View style={[styles.item_view, isActive && styles.activeItem]}>
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => handleEditEnvelope(item)}
                            >
                                <View style={styles.left_view}>
                                    <VectorIcon name="envelope" size={18} color={colors.gray} type="fa" />
                                    <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                                </View>
                                <View style={styles.right_view}>
                                    <Text style={styles.item_text_amount}>{item.amount}</Text>
                                    <TouchableOpacity onLongPress={drag} delayLongPress={10}>
                                        <VectorIcon name="bars" size={18} color={colors.gray} type="fa6" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    // nestedScrollEnabled={true}
                    scrollEnabled={true}
                    contentContainerStyle={styles.flatListContainer}
                />
                ) : (
                        <View style={styles.emptyState}>
                            <Image
                                source={Images.expenseplannerimage}
                                style={styles.emptyImage}
                            />
                            <View style={styles.emptyTextContainer}>
                                <Text style={styles.emptyText}>Add Envelope to start budgeting</Text>
                            </View>
                        </View>
                )}
            </View>
            {/* </ScrollView> */}

            <View style={envelope_prop ? styles.firstView_edit : styles.firstView}>
                <View style={styles.imageContainer}>
                    <Image source={Images.expenseplannerimage} style={styles.image} />
                </View>
                <Pressable
                    onPress={() => {
                        if (envelope_prop) {
                            navigation.navigate('SetIncomeAmount', { envelope_prop });
                        } else {
                            navigation.navigate('SetIncomeAmount');
                        }
                    }}
                    style={styles.incomeTextContainer}
                >
                    <View style={styles.texts_view}>
                        <Text style={styles.estimatedIncomeText}>Estimated{"\n"}Income</Text>
                        <Text style={styles.monthlyIncomeText}>Monthly{"\n"}{totalIncome || '---'}</Text>
                    </View>
                    <View style={styles.icon_view}>
                        <VectorIcon name="menu-down" size={24} color={colors.gray} type="mci" />
                    </View>
                </Pressable>

                <TouchableOpacity onPress={handleRemainingPress}
                    style={
                        totalIncome === 0
                            ? styles.remainingContainer // Case where totalIncome is 0
                            : remainingAmount < 0
                                ? styles.redRemainingContainer // Case where remainingAmount is negative
                                : styles.remainingContainer // Case where remainingAmount is positive
                    }
                >
                    <View>
                        <Text style={styles.remainingText}>
                            {totalIncome === 0 ? 'Total' : 'Remaining'}
                        </Text>
                    </View>
                    <View style={styles.total_txt_icon_view}>
                        <Text style={styles.remainingText}>
                            {totalIncome === 0 ? totalSumOfEnvelopes : remainingAmount}
                        </Text>
                        <View style={styles.icon_remaining_view}>
                            <VectorIcon name="exclamationcircle" size={16} color={colors.lightGray} type="ad" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {!envelope_prop && (
                <View style={styles.secondView}>
                    <View style={styles.left_icon_btn_view}>
                        <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii" />
                        <Button
                            mode="text"
                            onPress={() => navigation.goBack()}
                            // onPress={() => console.log('later press')}
                            style={styles.backButton}
                            labelStyle={styles.backText}
                            rippleColor={colors.gray}
                        >
                            BACK
                        </Button>
                    </View>
                    <View style={styles.right_icon_btn_view}>
                        <Button
                            mode="text"
                            onPress={handleNextPress}
                            // onPress={() => console.log('later press')}
                            style={styles.nextButton}
                            labelStyle={styles.nextText}
                            rippleColor={colors.gray}
                        >
                            NEXT
                        </Button>
                        <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii" />
                    </View>
                </View>
            )}

            <Snackbar
                visible={noEnvelopeAlertVisible}
                onDismiss={() => setNoEnvelopeAlertVisible(false)}
                duration={1000}
                style={[
                    styles.snack_bar,
                    {
                        position: 'absolute',
                        bottom: 42,
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
                    <Text style={styles.snack_bar_text}>Please add an envelope.</Text>
                </View>
            </Snackbar>

            <Modal visible={negativeIncomeModal} onDismiss={handleEditPress} contentContainerStyle={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.img_title_view}>
                        <Image source={Images.expenseplannerimagegray} style={styles.image} />
                        <Text style={styles.modalTitle}>Hmmm...</Text>
                    </View>

                    <Text style={styles.modalMessage}>
                        Your estimated expenses are more than your estimated income.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={handleKeepGoing}>
                            <Text style={styles.cancelButton}>Keep Going</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEditPress}>
                            <Text style={styles.agreeButton}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* remaining view modal */}
            <Modal visible={remainingModalVisible} onDismiss={handleRemainingClose} contentContainerStyle={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.img_title_view}>
                        <Image
                            source={
                                totalIncome === 0
                                    ? Images.expenseplannerimage
                                    : remainingAmount >= 0 && remainingAmount < totalIncome
                                        ? Images.expenseplannerimage
                                        : remainingAmount < totalIncome
                                            ? Images.expenseplannerimagegray
                                            : Images.expenseplannerimage
                            }
                            style={styles.image}
                        />
                        <Text style={styles.modalTitle}>
                            {totalIncome === 0
                                ? 'Total Budgeted'
                                : remainingAmount >= 0 && remainingAmount <= totalIncome
                                    ? `You have ${remainingAmount} left`
                                    : remainingAmount < totalIncome
                                        ? 'Hmmm...'
                                        : `You have ${totalSumOfEnvelopes} left`}
                        </Text>
                    </View>
                    <Text style={styles.modalMessage}>
                        {totalIncome === 0
                            ? `You plan to spend a total of ${totalSumOfEnvelopes} every month in all your budgeting Envelopes.`
                            : remainingAmount >= 0 && remainingAmount <= totalIncome
                                ? `You have ${remainingAmount} left over from your income every month. Tap 'Add Envelope' to budget more.`
                                : remainingAmount < totalIncome
                                    ? "It looks like you plan to spend more than you earn. Tap 'Income' or an Envelope to edit."
                                    : `You have ${totalSumOfEnvelopes} left over from your income every month. Tap 'Add Envelope' to budget more.`}
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={handleRemainingClose}>
                            <Text style={styles.agreeButton}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Pressable>
    );
};

export default SetupBudget;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
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
    buttonbody: {
        width: wp('33%'),
        borderRadius: 2,
        backgroundColor: colors.androidbluebtn,
        marginTop: hp('1.7%'),
        marginBottom: hp('1.3%'),
        marginLeft: hp('1.2%'),
    },
    buttonContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttontitle: {
        fontSize: hp('1.3%'),
        fontWeight: 'bold',
        color: colors.white,
    },
    budget_period_view: {
        height: hp('5%'),
        backgroundColor: colors.lightGray,
        alignItems: 'center',
        flexDirection: 'row',
        paddingLeft: wp('3%')
    },
    monthly_txt: {
        fontSize: hp('2%'),
        fontWeight: '500',
        color: colors.black
    },
    envelope_left_txt: {
        fontSize: hp('1.7%'),
        fontWeight: '400',
        color: colors.gray,
    },
    annual_txt_view: {
        height: hp('5%'),
        borderBottomWidth: 0.3,
        borderTopWidth: 0.3,
        borderTopColor: colors.lightGray,
        borderBottomColor: colors.lightGray,
        alignItems: 'center',
        flexDirection: 'row',
        paddingLeft: wp('3%')
    },
    annual_txt: {
        fontSize: hp('2%'),
        fontWeight: '500',
        color: colors.gray,
    },

    firstView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.lightGray,
        height: hp('7%'),
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
    },
    firstView_edit: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.lightGray,
        height: hp('7%'),
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: wp('2%')
    },
    image: {
        width: wp('10%'),
        height: hp('5%'),
        resizeMode: 'contain',
    },
    incomeTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // backgroundColor: colors.white,
    },
    texts_view: {
        flexDirection: 'row',

    },
    icon_view: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp('2%'),
    },
    estimatedIncomeText: {
        fontSize: hp('2%'),
        textAlign: 'left',
        color: colors.black,
        fontWeight: '400',
    },
    monthlyIncomeText: {
        fontSize: hp('2%'),
        color: colors.black,
        fontWeight: '600',
        textAlign: 'left',
        marginLeft: wp('1%'),
    },
    remainingContainer: {
        justifyContent: 'center',
        backgroundColor: colors.brightgreen,
        paddingHorizontal: hp('1%'),
        paddingVertical: hp('1%'),
    },
    redRemainingContainer: {
        justifyContent: 'center',
        backgroundColor: colors.danger,
        paddingHorizontal: hp('1%'),
        paddingVertical: hp('1%'),
    },
    remainingText: {
        textAlign: 'left',
    },
    total_txt_icon_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    icon_remaining_view: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: hp('2%'),
    },
    secondView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: hp('7%'),
        paddingHorizontal: hp('3%'),
        marginHorizontal: hp('3%'),
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    left_icon_btn_view: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    right_icon_btn_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    backText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
    },
    nextText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
    },

    flatListContainer: {
        // padding: 0,
    },
    item_view: {
        // flexDirection: 'row',
    },
    activeItem: {
        backgroundColor: colors.lightgreen, // Change to your desired color
    },
    item: {
        paddingVertical: 10,
        paddingHorizontal: hp('1.3%'),
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',  // Ensure both left and right items are aligned vertically
    },
    left_view: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Ensure the left view stays on the left', // Ensure the left view stays on the left
        flexWrap: 'wrap',
        maxWidth: '70%',
        // backgroundColor: 'red',
    },
    right_view: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end', // Ensure the right view stays on the right
        maxWidth: '30%',
        // flexWrap: 'wrap',
        // backgroundColor: 'blue',
    },
    item_text_name: {
        fontSize: hp('2.2%'),
        color: colors.gray,
        fontWeight: '600',
        marginLeft: hp('1%'),
        flexWrap: 'wrap',
        overflow: 'hidden',
        width: '86%',
        // backgroundColor: 'green',
        textOverflow: 'ellipsis',

    },
    item_text_amount: {
        color: colors.black,
        marginRight: hp('1%'),
        textOverflow: 'ellipsis', // Handle overflowing text
        overflow: 'hidden',
    },
    scroll_view: {
        // flex: 1,
        backgroundColor: colors.black,
        marginBottom: hp('14%'),
    },
    flatListWrapper: {
        flex: 1, // Makes sure the FlatList takes up all available space in the parent ScrollView
        marginBottom: hp('14%'), // Add some space to the bottom if necessary
    },

    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp('8%'),
    },
    emptyImage: {
        width: hp('8%'),
        height: hp('8%'),
        marginBottom: hp('4%'),
    },
    emptyTextContainer: {
        maxWidth: hp('30%'),
        // backgroundColor: 'yellow',
    },
    emptyText: {
        fontSize: hp('2.4%'),
        color: colors.gray,
        textAlign: 'center',
        alignSelf: 'center',
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

    //modal styles
    modalContainer: {
        backgroundColor: colors.white,
        padding: hp('2%'),
        margin: hp('3.5%'),
    },
    modalContent: {
        alignItems: 'flex-start',
        paddingHorizontal: hp('1.5%'),
    },
    img_title_view: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    image: {
        width: hp('4%'),
        height: hp('4%'),
        resizeMode: 'contain',
    },
    modalTitle: {
        color: colors.black,
        fontSize: hp('2.5%'),
        fontWeight: '600',
        marginLeft: hp('1%'),
    },
    modalMessage: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.black,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginVertical: hp('1.8%'),
    },
    ok_btn: {
        color: colors.androidbluebtn,
    },
    cancelButton: {
        color: colors.androidbluebtn,
        marginRight: hp('7%'),
    },
    agreeButton: {
        color: colors.androidbluebtn,
        marginRight: hp('2.5%'),
    },
    termsText: {
        color: colors.androidbluebtn,
        textDecorationLine: 'underline',
    },
});
