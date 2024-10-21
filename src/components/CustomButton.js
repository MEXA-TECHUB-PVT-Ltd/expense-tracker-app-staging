//this is how to use this custombutton
//always set width and height in buttonStyle prop

// const [isLoading, setIsLoading] = useState(false);
// const [currentLoadingKey, setCurrentLoadingKey] = useState(null);

{/* <CustomButton
    title="Submit"
    titleStyle={styles.buttontitle}
    buttonStyle={styles.buttonbody}
    leftIcon={<Ionicons name="logo-facebook" size={30} color="blue" />}
    centerIcon={<Ionicons name="logo-facebook" size={30} color="blue" />}
    rightIcon={<Ionicons name="logo-facebook" size={30} color="blue" />}
    onPress={handleApiCall}
    isLoading={isLoading}
    currentLoadingKey={currentLoadingKey}
    loaderColor="black"
    buttonKey="Submit"    // unique to show loader only at specific button
    disabled={isLoading} // when loading, disable button
/> */}

//can apply as default in internal stylesheet
// buttontitle: {
//     fontSize: 18,
//     color: '#fff',
//     textAlign: 'center'
// },
// buttonbody: {
//     width: '100%',
//     height: 40,
//     borderRadius: 50,
//     backgroundColor: 'lightgray',
// },

import React from 'react';
import { StyleSheet, Text, Pressable, Image, View, ActivityIndicator } from 'react-native';

const CustomButton = ({
    buttonStyle,
    onPress,
    opacityOnPress,
    isLoading,
    loaderColor,
    buttonKey,
    currentLoadingKey,
    disabled,

    title,
    titleStyle,

    leftIcon,
    leftIconStyle,
    leftImage,
    leftImageStyle,

    centerIcon,
    centerIconStyle,
    centerImage,
    centerImageStyle,

    rightIcon,
    rightIconStyle,
    rightImage,
    rightImageStyle,
}) => {
    const isCurrentLoading = isLoading && currentLoadingKey === buttonKey;

    const hasCenterElements = !!(centerIcon || centerImage || title);

    const hasSideElements = !!(leftIcon || leftImage || rightIcon || rightImage);

    const defaultStyles = {
        width: '100%',
        height: 'auto',
        justifyContent: 'center',
    };

    const mergedButtonStyle = [
        defaultStyles,
        buttonStyle,
    ];

    return (
        <Pressable
            onPress={!isCurrentLoading ? onPress : null}
            style={({ pressed }) => [
                ...mergedButtonStyle,
                pressed && !disabled && { opacity: opacityOnPress || 0.5 },
            ]}
        >
            <View style={styles.container}>
                {(leftIcon || leftImage) && (
                    <View style={styles.leftIconContainer}>
                        {leftImage ? (
                            <Image source={leftImage} style={[leftImageStyle]} />
                        ) : (
                            leftIcon && React.cloneElement(leftIcon, { style: [leftIconStyle] })
                        )}
                    </View>
                )}

                <View style={[
                    styles.centerContainer,
                    hasCenterElements && { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flex: hasSideElements ? 1 : 0, }
                ]}>
                    {isCurrentLoading ? (
                        <ActivityIndicator size="small" color={loaderColor || '#E3B12F'} />
                    ) : (
                        <>
                            {centerImage && <Image source={centerImage} style={[styles.centerElement, centerImageStyle]} />}
                            {centerIcon && React.cloneElement(centerIcon, { style: [styles.centerElement, centerIconStyle] })}
                            {title && <Text style={[styles.centerElement, styles.centerTitle, titleStyle]}>{title}</Text>}
                        </>
                    )}
                </View>

                {(rightIcon || rightImage) && (
                    <View style={styles.rightIconContainer}>
                        {rightImage ? (
                            <Image source={rightImage} style={[rightImageStyle]} />
                        ) : (
                            rightIcon && React.cloneElement(rightIcon, { style: [rightIconStyle] })
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 'auto',
        position: 'relative',
    },
    leftIconContainer: {
        position: 'absolute',
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerElement: {
        marginHorizontal: 5,
    },
    centerTitle: {
        textAlign: 'center',
    },
    rightIconContainer: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default CustomButton;
