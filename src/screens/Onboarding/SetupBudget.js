import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, FlatList, Animated, Image, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, Button } from 'react-native-paper';
import { VectorIcon } from '../../constants/vectoricons';
import colors from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { useFocusEffect } from '@react-navigation/native';

import { db, fetchTotalIncome,  } from '../../database/database';

const { width: screenWidth } = dimensions;

const SetupBudget = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    //sqlite
    const [envelopes, setEnvelopes] = useState([]);
    useFocusEffect(
        useCallback(() => {
            getAllEnvelopes(setEnvelopes);
        }, [])
    );
   
    const getAllEnvelopes = (callback) => {
        db.transaction(tx => {
            const sqlQuery = 'SELECT * FROM envelopes';
            tx.executeSql(
                sqlQuery,
                [],
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

    const handleEditEnvelope = (envelope) => {
        navigation.navigate('AddEnvelope', {
            envelopeId: envelope.id,
            envelopeName: envelope.envelopeName,
            amount: envelope.amount,
            budgetPeriod: envelope.budgetPeriod,
            dueDate: envelope.dueDate,
            edit_Envelope: true,
        });
    };

    // for income total and remainin
    const calculateRemainingAmount = (totalIncome, envelopes) => {
        const totalExpenses = envelopes.reduce((sum, envelope) => sum + envelope.amount, 0);
        return totalIncome - totalExpenses;
    };
    const [totalIncome, setTotalIncome] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);
    // useEffect(() => {
    //     fetchTotalIncome(setTotalIncome); // Fetch total income
    // }, []);

    useFocusEffect(() => {
        fetchTotalIncome(setTotalIncome); // Fetch total income
    });

    useEffect(() => {
        const remaining = calculateRemainingAmount(totalIncome, envelopes);
        setRemainingAmount(remaining);
    }, [totalIncome, envelopes]);



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

    const handleAddEnvelope = () => {
        navigation.navigate('AddEnvelope');
    };

    return (
        <Pressable style={styles.container} onPress={handleOutsidePress}>
            <View>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Setup Budget" titleStyle={styles.appbar_title} />
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

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scroll_view}
            >
                <TouchableWithoutFeedback onPress={() => navigation.navigate('ChangeBudgetPeriod')} style={styles.budget_period_view}>
                    <Text style={styles.monthly_txt}>Monthly</Text>
                    {/* <VectorIcon name="menu-down" size={24} color={colors.black} type="mci" />
                    <Text style={styles.envelope_left_txt}>8 of 10 free Envelopes left</Text> */}
                </TouchableWithoutFeedback>

                {/* Monthly Envelopes Flatlist sqlite */}
                <FlatList
                    data={envelopes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.item_view}>
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
                                    <VectorIcon name="bars" size={18} color={colors.gray} type="fa6" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    scrollEnabled={false}
                    contentContainerStyle={styles.flatListContainer}
                />

                {/* Monthly Envelopes Flatlist */}
                {/* {categories['Monthly'].length > 0 && (
                    <>
                        <FlatList
                            data={categories['Monthly']}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.item_view}>
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => handleEditEnvelope(item, 'Monthly')}
                                    >
                                        <View style={styles.left_view}>
                                            <VectorIcon name="envelope" size={18} color={colors.gray} type="fa"/>
                                            <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                                        </View>
                                        <View style={styles.right_view}>
                                            <Text style={styles.item_text_amount}>{item.amount}</Text>
                                            <VectorIcon name="bars" size={18} color={colors.gray} type="fa6" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            scrollEnabled={false}
                            contentContainerStyle={styles.flatListContainer}
                        />
                    </>
                )} */}

                {/* <TouchableWithoutFeedback style={styles.budget_period_view}>
                    <Text style={styles.monthly_txt}>More Envelopes (1) </Text>
                    <Text style={styles.envelope_left_txt}>9 of 10 free Envelopes left</Text>
                </TouchableWithoutFeedback> */}

                {/* Annual Envelopes Flatlist */}
                {/* {categories['Every Year'].length > 0 && (
                    <>
                        <View style={styles.annual_txt_view}>
                            <Text style={styles.annual_txt}>Annual</Text>
                        </View>
                        <FlatList
                            data={categories['Every Year']}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.item_view}>
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => handleEditEnvelope(item, 'Every Year')}
                                    >
                                        <View style={styles.left_view}>
                                            <VectorIcon name="envelope" size={18} color={colors.gray} type="fa" />
                                            <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                                        </View>
                                        <View style={styles.right_view}>
                                            <Text style={styles.item_text_amount}>{item.amount}</Text>
                                            <VectorIcon name="bars" size={18} color={colors.gray} type="fa6" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            scrollEnabled={false}
                            contentContainerStyle={styles.flatListContainer}
                        />
                    </>
                )} */}

                {/* Goal Envelopes Flatlist */}
                {/* {categories['Goal'].length > 0 && (
                    <>
                        <View style={styles.annual_txt_view}>
                            <Text style={styles.annual_txt}>Goal</Text>
                        </View>
                        <FlatList
                            data={categories['Goal']}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.item_view}>
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => handleEditEnvelope(item, 'Goal')}
                                    >
                                        <View style={styles.left_view}>
                                            <VectorIcon name="envelope" size={18} color={colors.gray} type="fa" />
                                            <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                                        </View>
                                        <View style={styles.right_view}>
                                            <Text style={styles.item_text_amount}>{item.amount}</Text>
                                            <VectorIcon name="bars" size={18} color={colors.gray} type="fa6" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            scrollEnabled={false}
                            contentContainerStyle={styles.flatListContainer}
                        />
                    </>
                )} */}
                
            </ScrollView>

            <View style={styles.firstView}>
                <View style={styles.imageContainer}>
                    <Image source={Images.expenseplannerimage} style={styles.image} />
                </View>
                <Pressable onPress={() => navigation.navigate('SetIncomeAmount')} style={styles.incomeTextContainer}>
                    <View style={styles.texts_view}>
                        <Text style={styles.estimatedIncomeText}>Estimated{"\n"}Income</Text>
                        <Text style={styles.monthlyIncomeText}>Monthly{"\n"}{totalIncome}</Text>
                    </View>
                    <View style={styles.icon_view}>
                        <VectorIcon name="menu-down" size={24} color={colors.gray} type="mci" />
                    </View>
                </Pressable>
                <View 
                    style={[styles.remainingContainer, { backgroundColor: remainingAmount > totalIncome ? colors.danger : colors.brightgreen }]}
                // style={styles.remainingContainer}
                >
                    <View>
                        <Text style={styles.remainingText}>Remaining</Text>
                    </View>
                    <View style={styles.total_txt_icon_view}>
                        <Text style={styles.remainingText}>{remainingAmount}</Text>
                        <View style={styles.icon_remaining_view}>
                            <VectorIcon name="exclamationcircle" size={16} color={colors.lightGray} type="ad" />
                        </View>
                    </View>
                </View>
            </View>

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
                        onPress={() => navigation.navigate('FillEnvelopes')}
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
        // alignItems: 'center',
        backgroundColor: colors.lightGray,
        height: hp('7%'),
        position: 'absolute',
        bottom: 50,
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
        // backgroundColor: colors.brightgreen,
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
    item: {
        paddingVertical: 10,
        paddingHorizontal: hp('1.3%'),
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    left_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    right_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    item_text_name: {
        fontSize: hp('2.2%'),
        color: colors.gray,
        fontWeight: '600',
        marginLeft: hp('1%'),
    },
    item_text_amount: {
        color: colors.black,
        marginRight: hp('1%'),
    },
    scroll_view: {
        marginBottom: hp('14%'),
    },
});
