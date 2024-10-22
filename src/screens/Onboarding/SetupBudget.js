import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Image, Dimensions, TouchableOpacity, TouchableHighlight } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar, Button } from 'react-native-paper';
import { VectorIcon } from '../../constants/vectoricons';
import CustomButton from '../../components/CustomButton';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';

const { width: screenWidth } = dimensions;

const SetupBudget = () => {
    const navigation = useNavigation();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current; // Start out of the screen (to the right)

    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    const handleRightIconPress = () => {
        toggleTooltip();
    };

    const toggleTooltip = () => {
        if (isTooltipVisible) {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: screenWidth, // Hide by moving off-screen
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
            // Slide in
            Animated.timing(slideAnim, {
                toValue: screenWidth * 0.5, // Show at 50% width from the right
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleOutsidePress = () => {
        if (isTooltipVisible) {
            toggleTooltip(); // Hide if open
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
        
            <CustomButton
                title="ADD ENVELOPE"
                titleStyle={styles.buttontitle}
                buttonStyle={styles.buttonbody}
                onPress={handleAddEnvelope}
            />
            <TouchableWithoutFeedback onPress={() => navigation.navigate('ChangeBudgetPeriod')} style={styles.budget_period_view}>
                <Text style={styles.monthly_txt}>Monthly (2) </Text>
                <VectorIcon name="menu-down" size={24} color={colors.black} type="mci" />
                <Text style={styles.envelope_left_txt}>8 of 10 free Envelopes left</Text>
            </TouchableWithoutFeedback>





            <TouchableWithoutFeedback style={styles.budget_period_view}>
                <Text style={styles.monthly_txt}>More Envelopes (1) </Text>
                <Text style={styles.envelope_left_txt}>9 of 10 free Envelopes left</Text>
            </TouchableWithoutFeedback>
            <View style={styles.annual_txt_view}>
                <Text style={styles.annual_txt}>Annual</Text>
            </View>

            <View style={styles.firstView}>
                <View style={styles.imageContainer}>
                    <Image source={Images.expenseplannerimage} style={styles.image} />
                </View>

                <Pressable onPress={() => navigation.navigate('SetIncomeAmount')} style={styles.incomeTextContainer}>
                    <View style={styles.texts_view}>
                        <Text style={styles.estimatedIncomeText}>Estimated{"\n"}Income</Text>
                        <Text style={styles.monthlyIncomeText}>Monthly{"\n"}30,000</Text>
                    </View>
                    <View style={styles.icon_view}>
                        <VectorIcon name="menu-down" size={24} color={colors.gray} type="mci"/>
                    </View>
                </Pressable>
                <View style={styles.remainingContainer}>
                    <View>
                        <Text style={styles.remainingText}>Remaining</Text>
                    </View>
                    <View style={styles.total_txt_icon_view}>
                        <Text style={styles.remainingText}>55,000</Text>
                        <View style={styles.icon_remaining_view}>
                            <VectorIcon name="exclamationcircle" size={16} color={colors.lightGray} type="ad" />
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.secondView}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii"/>
                    <Text style={styles.backText}>BACK</Text>
                </Pressable>

                <Pressable onPress={()=> navigation.navigate('Calculator')} style={styles.nextButton}>
                    <Text style={styles.nextText}>NEXT</Text>
                    <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii"/>
                </Pressable>
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
    buttontitle: {
        fontSize: hp('2%'),
        fontWeight: '500',
        color: colors.white,
        textAlign: 'center'
    },
    buttonbody: {
        width: wp('32%'),
        height: hp('5%'),
        borderRadius: 2,
        backgroundColor: colors.androidbluebtn,
        marginTop: hp('1.7%'),
        marginBottom: hp('1.3%'),
        marginLeft: hp('1.2%'),
    },
    budget_period_view: {
        height: hp('5%'),
        backgroundColor: colors.lightGray,
        marginTop: hp('0.3%'),
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
        // backgroundColor: colors.lightGray,
        marginTop: hp('0.3%'),
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
        backgroundColor: colors.brightgreen,
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
        paddingHorizontal: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
        marginLeft: wp('5%')
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
        marginRight: wp('5%')
    },
});
