import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity, FlatList } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import {TextInput, Appbar, Button, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';

const { width: screenWidth } = dimensions;

const frequencyOptions = ["Monthly", "Weekly", "Twice a Month", "Every 2 Weeks"];

const IncomeInput = ({ index, onRemove, selectedIndex, setSelectedIndex }) => {
    const [selectedFrequency, setSelectedFrequency] = useState(frequencyOptions[0]);
    const [income, setIncome] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);

    const handleFrequencySelect = (frequency) => {
        setSelectedFrequency(frequency);
        setMenuVisible(false);
    };

    return (
        <View style={styles.incomeInputContainer}>
            <Text style={styles.indexText}>{index + 1}.</Text>
            <TextInput
                value={income}
                onChangeText={setIncome}
                mode="flat"
                style={styles.textInput}
                theme={{ colors: { primary: selectedIndex === index ? colors.brightgreen : 'lightgray', underlineColor: 'transparent' } }}
                onFocus={() => setSelectedIndex(index)}
            />

            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity style={styles.frequencySelector} onPress={() => setMenuVisible(true)}>
                        <Text style={styles.frequencyText}>{selectedFrequency}</Text>
                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContentStyle}
            >
                {frequencyOptions.map((option, idx) => (
                    <Menu.Item key={idx} onPress={() => handleFrequencySelect(option)} title={option} />
                ))}
            </Menu>

            <TouchableOpacity onPress={onRemove}>
                <VectorIcon name="close" size={20} color={colors.gray} type="mi" />
            </TouchableOpacity>
        </View>

    );
};



const SetIncomeAmount = () => {
    const [incomeInputs, setIncomeInputs] = useState([{ key: Math.random().toString() }]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const handleAddIncomeInput = () => {
        setIncomeInputs([...incomeInputs, { key: Math.random().toString() }]);
    };
    const handleRemoveIncomeInput = (index) => {
        const updatedInputs = incomeInputs.filter((_, i) => i !== index);
        setIncomeInputs(updatedInputs);
    };



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
                toValue: screenWidth,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
            // Slide in
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

    return (
        <Pressable style={styles.container} onPress={handleOutsidePress}>
            <View>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Set Income Amount" titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>
            </View>

            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>
            <View style={styles.estimated_income_view}>
                <Text style={styles.estimated_income_txt}>Enter your estimated income...</Text>
            </View>

            <FlatList
                data={incomeInputs}
                renderItem={({ item, index }) => (
                    <IncomeInput
                        index={index}
                        onRemove={() => handleRemoveIncomeInput(index)}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                    />
                )}
                keyExtractor={(item) => item.key}
                style={styles.incomeList}
                ListFooterComponent={
                    <Button
                        mode="contained"
                        onPress={handleAddIncomeInput}
                        icon="plus"
                        style={styles.addIncomeButton}
                        contentStyle={styles.buttonContent}
                        textColor={colors.white}
                        labelStyle={styles.addIncome_label}
                    >
                        ADD INCOME
                    </Button>
                }
            />

            <View style={styles.bottomButtonContainer}>
                <Button mode="text" textColor={colors.gray} onPress={() => { }}>
                    NOTHANKS
                </Button>
                <Button mode="text" textColor={colors.androidbluebtn} onPress={() => { }}>
                    SAVE
                </Button>
            </View>
        </Pressable>
    );
};

export default SetIncomeAmount;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
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
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
    estimated_income_view: {
        height: hp('5%'),
    },
    estimated_income_txt: {
        fontSize: hp('2%'),
        color: colors.black,
        fontWeight: 'bold',
        marginTop: hp('1.5%'),
        marginLeft: hp('2%'),
    },

    //repeating view
    incomeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: hp('1.2%'),
        marginHorizontal: hp('2%'),
        // backgroundColor: colors.brightgreen,
    },
    //text 1 2 3 so on....
    indexText: {
        fontSize: hp('2%'),
        marginRight: hp('2%'),
        color: colors.black,
        alignSelf: 'flex-end',
    },
    textInput: {
        flex: 1,
        marginRight: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        height: hp('2%'),
        backgroundColor: 'transparent',
    },
    //menu selector
    frequencySelector: {
        width: hp('22%'),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginRight: 8,
        // backgroundColor: colors.gray,
    },
    menuContentStyle: {
        width: hp('19%'),
        height: 'auto',
        backgroundColor: colors.white,
        borderRadius: 1,
        paddingVertical: 0,
    },
    //text monthly weekly...
    frequencyText: {
        fontSize: hp('2%'),
        color: colors.black,
        marginRight: 4,
    },
    //add income button
    addIncomeButton: {
        width: wp('33%'),
        backgroundColor: colors.androidbluebtn,
        borderRadius: 2,
        marginLeft: wp('10%'),
        marginBottom: hp('1%'),
        marginTop: hp('2%'),
    },
    buttonContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIncome_label: {
        fontSize: hp('1.6%'),
        textTransform: 'none',
        letterSpacing: 0,
    },

    incomeList: {
        marginBottom: 56,
    },

    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: hp('2%'),
        marginVertical: hp('1%'),
    },
});
