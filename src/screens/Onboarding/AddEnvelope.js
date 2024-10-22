import { StyleSheet, Text, View, Animated, Dimensions, Pressable, TouchableOpacity } from 'react-native'
import React, {useState, useRef} from 'react'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import CustomHeader from '../../components/CustomHeader'
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const AddEnvelope = () => {
    const navigation = useNavigation();
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
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <CustomHeader
                containerStyle={{ backgroundColor: colors.brightgreen, }}
                leftIcon={<MCIcons name="keyboard-backspace" size={24} color={colors.white} />}
                leftIconPress={handleLeftIconPress}
                headerText="Add Envelope"
                headerTextStyle={{ color: colors.white }}
                secondRightIcon={<MCIcons name="dots-vertical" size={24} color={colors.white} />}
                secondRightIconPress={handleRightIconPress}
            />

            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>
        </Pressable>
    )
}

export default AddEnvelope

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
})