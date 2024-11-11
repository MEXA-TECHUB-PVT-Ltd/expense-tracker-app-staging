import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const CustomProgressBar = ({ filledIncome, amount }) => {
    const absIncome = Math.abs(filledIncome);
    const normalizedFilled = Math.min(absIncome, amount);
    const primaryWidth = (normalizedFilled / amount) * 100;
    const overflowWidth = Math.max((absIncome - amount) / amount * 100, 0);

    const isPositive = filledIncome >= 0;
    const primaryColor = isPositive ? colors.brightgreen : 'red';
    const overflowColor = isPositive ? 'lightblue' : 'pink';

    // Calculate the dynamic position of the cutout line based on the amount threshold
    const cutoutPosition = Math.min((amount / absIncome) * 100, 100); // Clamp to 100%

    return (
        <View style={styles.container}>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${primaryWidth}%`,
                            backgroundColor: primaryColor,
                            [isPositive ? 'left' : 'right']: 0,
                        },
                    ]}
                />

                {/* Cutout line for the amount threshold */}
                <View
                    style={[
                        styles.cutoutLine,
                        {
                            [isPositive ? 'left' : 'right']: `${cutoutPosition}%`, // Dynamic positioning
                        },
                    ]}
                />

                {overflowWidth > 0 && (
                    <View
                        style={[
                            styles.overflow,
                            {
                                width: `${overflowWidth}%`,
                                backgroundColor: overflowColor,
                                [isPositive ? 'left' : 'right']: '100%',
                            },
                        ]}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 4.5,
        backgroundColor: colors.lightGray,
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'row',
    },
    fill: {
        height: '100%',
        position: 'absolute',
    },
    cutoutLine: {
        position: 'absolute',
        height: '100%',
        width: 2.5,
        backgroundColor: 'black',
    },
    overflow: {
        height: '100%',
        position: 'absolute',
        top: 0,
    },
});

export default CustomProgressBar;
