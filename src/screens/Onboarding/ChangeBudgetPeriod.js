import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CustomHeader from '../../components/CustomHeader';
import CustomButton from '../../components/CustomButton';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const ChangeBudgetPeriod = () => {
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
        navigation.navigate('Help');
    };

    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <View>
                <CustomHeader
                    containerStyle={{ backgroundColor: colors.brightgreen }}
                    leftIcon={<MCIcons name="keyboard-backspace" size={24} color={colors.white} />}
                    leftIconPress={handleLeftIconPress}
                    headerText="Change Budget Period"
                    headerTextStyle={{ color: colors.white }}
                    secondRightIcon={<MCIcons name="dots-vertical" size={24} color={colors.white} />}
                    secondRightIconPress={handleRightIconPress}
                />
            </View>

            {/* Sliding View / Tooltip */}
            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    );
};

export default ChangeBudgetPeriod;

const styles = StyleSheet.create({
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
