import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Appbar } from 'react-native-paper';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';

const { width: screenWidth } = dimensions;

const EditEnvelope = () => {
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

    return (
        <Pressable style={{ flex: 1, backgroundColor: colors.white }} onPress={handleOutsidePress}>
            <View>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Edit Envelope" titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleRightIconPress}icon="dots-vertical" color={colors.white} />
                </Appbar.Header>
            </View>

            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    );
};

export default EditEnvelope;

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
});
