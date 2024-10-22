// this is how to use

{/* <CustomHeader
    containerStyle={{ backgroundColor: 'transparent' }}
    leftIcon={<MCIcons name="keyboard-backspace" size={24} color="black" />}
    leftIconPress={() => console.log('Menu pressed')}
    headerText="Header Title"
    headerTextStyle={{ color: 'black' }}
    rightIcon={<Ionicons name="search" size={24} color="black" />}
    rightIconPress={() => console.log('Search pressed')}
    secondRightIcon={<Ionicons name="notifications-outline" size={24} color="black" />}
    secondRightIconPress={() => console.log('Notifications pressed')}
/>  */}

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const CustomHeader = ({
    containerStyle,
    headerText,
    headerTextStyle,

    leftIcon,
    leftImage,
    leftImageStyle,
    leftIconPress,

    rightIcon,
    rightImage,
    rightImageStyle,
    rightIconPress,

    secondRightIcon,
    secondRightImage,
    secondRightImageStyle,
    secondRightIconPress,

}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            <TouchableOpacity onPress={leftIconPress} style={styles.leftIconContainer}>
                {leftIcon ? (
                    leftIcon
                ) : leftImage ? (
                    <Image source={leftImage} style={[styles.icon, leftImageStyle]} />
                ) : null}
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
                <Text style={[styles.headerText, headerTextStyle]}>{headerText}</Text>
            </View>

            <View style={styles.rightContainer}>
                <TouchableOpacity onPress={rightIconPress} style={styles.iconContainer}>
                    {rightIcon ? (
                        rightIcon
                    ) : rightImage ? (
                        <Image source={rightImage} style={[styles.icon, rightImageStyle]} />
                    ) : null}
                </TouchableOpacity>

                <TouchableOpacity onPress={secondRightIconPress} style={styles.iconContainer}>
                    {secondRightIcon ? (
                        secondRightIcon
                    ) : secondRightImage ? (
                        <Image source={secondRightImage} style={[styles.icon, secondRightImageStyle]} />
                    ) : null}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55,
        paddingHorizontal: 10,
        backgroundColor: '#f8f8f8',
        position: 'relative',
    },
    leftIconContainer: {
        position: 'absolute',
        left: 10,
        padding: 10,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        textAlign: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        right: 10,
    },
    iconContainer: {
        padding: 10,
    },
    icon: {
        width: 24,
        height: 24,
    },
});

export default CustomHeader;
