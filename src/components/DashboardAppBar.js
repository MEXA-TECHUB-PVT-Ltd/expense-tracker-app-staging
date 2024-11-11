import React, { useState, useRef } from 'react';
import { Image, StyleSheet, Text, View, Pressable, Animated, TouchableOpacity } from 'react-native';
import { FAB } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { VectorIcon } from '../constants/vectoricons';
import Images from '../constants/images';
import colors from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/userSlice';
import { removeUserData } from '../utils/authUtils';
import dimensions from '../constants/dimensions';

const { width: screenWidth } = dimensions;

const DashboardAppBar = ({ selectedTab }) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        await removeUserData();  // Clear data from AsyncStorage
        dispatch(logout());      // Reset Redux state
        // navigation.navigate('Onboarding');  // Redirect to onboarding or login screen
    };

    // const handleLogout = () => {
    //     dispatch(logout());
    // };

    // code for tooltip
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

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
        // console.log('tooltip pressed');
        handleLogout();
    };
    // code for tooltip end here

    const user = useSelector((state) => state.user.user);
    const email = user?.email;
    const username = email ? email.split('@')[0] : '';

    const handleEnvelopePress = () => {
        // Action when envelope icon is pressed
        console.log("Envelope icon pressed");
    };

    const handleSearchPress = () => {
        // Action when search icon is pressed
        console.log("Search icon pressed");
    };

    const renderDynamicIcons = () => {
        switch (selectedTab) {
            case 'Envelopes':
                return (
                    <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                        <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                    </TouchableOpacity>
                );
            case 'Transactions':
                return (
                    <>
                        <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                            <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSearchPress} style={styles.iconSpacing}>
                            <VectorIcon name="search" size={20} color="white" type="ii" />
                        </TouchableOpacity>
                    </>
                );
            case 'Accounts':
                return (
                    <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                        <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const handleThreeDotsPress = () => {
        switch (selectedTab) {
            case 'Envelopes':
                // Perform action specific to Envelopes tab
                handleRightIconPress();
                // console.log("Three dots pressed in Envelopes");
                break;
            case 'Transactions':
                // Perform action specific to Transactions tab
                console.log("Three dots pressed in Transactions");
                break;
            case 'Accounts':
                // Perform action specific to Accounts tab
                console.log("Three dots pressed in Accounts");
                break;
            case 'Reports':
                // Perform action specific to Reports tab
                console.log("Three dots pressed in Reports");
                break;
            default:
                break;
        }
    };

    return (
        <Pressable onPress={handleOutsidePress}>
            <View style={styles.container}>
                <View style={styles.leftContainer}>
                    <Image source={Images.expenseplannerimage} style={styles.profileImage} />
                    <Text style={styles.username}>{username}</Text>
                </View>
                <View style={styles.iconContainer}>
                    {renderDynamicIcons()}
                </View>
                <TouchableOpacity style={styles.three_dots_view} onPress={handleThreeDotsPress}>
                    <VectorIcon name="dots-vertical" size={24} color="white" type="mci" />
                </TouchableOpacity>
            </View>
            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        height: hp('8%'),
        backgroundColor: colors.brightgreen,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: hp('5%'),
        height: hp('5%'),
        marginRight: hp('2%'),
        marginLeft: hp('2%'),
        resizeMode: 'contain',
    },
    username: {
        color: 'white',
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
    iconContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    iconSpacing: {
        marginHorizontal: wp('2%'),
    },
    three_dots_view: {
        marginLeft: hp('0%'),
    },

    // tooltip styles
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
});

export default DashboardAppBar;
