// Calculator.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { VectorIcon } from '../../constants/vectoricons';

const Calculator = ({ visible, textInputValue, onValueChange, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operation, setOperation] = useState(null);
    const [isResult, setIsResult] = useState(false);

    useEffect(() => {
        // When the calculator is opened, set the display to the value of the TextInput
        if (visible) {
            setDisplay(textInputValue || '0');
        }
    }, [visible, textInputValue]);

    const handleInput = (inputValue) => {
        if (isResult) {
            setDisplay(inputValue);
            setIsResult(false);
        } else {
            setDisplay(display === '0' ? inputValue : display + inputValue);
        }
    };

    const handleOperation = (op) => {
        if (op === '-' && display === '0') {
            // Allow negative input
            setDisplay('-');
            setIsResult(false);
            return;
        }

        const currentValue = parseFloat(display);
        if (operation && previousValue !== null) {
            // Perform intermediate calculation
            const result = performCalculation(parseFloat(previousValue), currentValue, operation);
            setPreviousValue(result); // Update previousValue with the result
            setDisplay('0'); // Reset display for new input
        } else {
            setPreviousValue(currentValue); // Store current value as previousValue
            setDisplay('0');
        }

        setOperation(op); // Set the current operation
        setIsResult(false);
    };

    const performCalculation = (prev, current, op) => {
        switch (op) {
            case '+':
                return prev + current;
            case '-':
                return prev - current;
            case '×':
                return prev * current;
            case '÷':
                return current === 0 ? 0 : prev / current;
            default:
                return current;
        }
    };

    const calculate = () => {
        const currentValue = parseFloat(display);
        const previous = parseFloat(previousValue);

        if (isNaN(currentValue) || isNaN(previous) || !operation) {
            onValueChange(display); // Update with the current display value if no operation
            onClose();
            return;
        }

        const result = performCalculation(previous, currentValue, operation);

        setDisplay(String(result)); // Show the result
        onValueChange(String(result)); // Update the TextInput with the result
        setOperation(null); // Clear the operation
        setPreviousValue(null); // Clear the previous value
        setIsResult(true); // Mark the calculation as completed
        onClose();
    };

    const handleClear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setIsResult(false);
    };

    const handleBackspace = () => {
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    };

    // for custom background color and text color when pressed
    const [backspacePressed, setBackspacePressed] = useState(false);
    const [clearPressed, setClearPressed] = useState(false);
    const [dividePressed, setDividePressed] = useState(false);
    const [multiplyPressed, setMultiplyPressed] = useState(false);
    const [buttonPressed7, setButtonPressed7] = useState(false);
    const [buttonPressed8, setButtonPressed8] = useState(false);
    const [buttonPressed9, setButtonPressed9] = useState(false);
    const [buttonPressedMinus, setButtonPressedMinus] = useState(false);
    const [buttonPressed4, setButtonPressed4] = useState(false);
    const [buttonPressed5, setButtonPressed5] = useState(false);
    const [buttonPressed6, setButtonPressed6] = useState(false);
    const [buttonPressed1, setButtonPressed1] = useState(false);
    const [buttonPressed2, setButtonPressed2] = useState(false);
    const [buttonPressed3, setButtonPressed3] = useState(false);
    const [buttonPressedPlus, setButtonPressedPlus] = useState(false);
    const [buttonPressed0, setButtonPressed0] = useState(false);
    const [buttonPressedDot, setButtonPressedDot] = useState(false);
    const [buttonPressedOK, setButtonPressedOK] = useState(false);

    return (
        visible && (
            <View style={styles.container} onTouchEnd={onClose}>
                <View style={styles.calculator} onTouchEnd={(e) => e.stopPropagation()}>
                    <TextInput
                        style={styles.display}
                        value={String(display)} // convert to properly show text so that accidently it dont show text
                        // value={display}
                        editable={false} // The display is not editable
                    />

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.button, backspacePressed && { backgroundColor: colors.white }]}
                            onPressIn={() => setBackspacePressed(true)}
                            onPressOut={() => setBackspacePressed(false)}
                            activeOpacity={1}
                            onPress={handleBackspace}
                        >
                            <VectorIcon name="backspace" size={17} color={backspacePressed ? 'black' : colors.white} type="mci" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, clearPressed && { backgroundColor: colors.white }]}
                            onPressIn={() => setClearPressed(true)}
                            onPressOut={() => setClearPressed(false)}
                            activeOpacity={1}
                            onPress={handleClear}
                        >
                            <Text style={[styles.buttonText, clearPressed && { color: 'black' }]}>C</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, dividePressed && { backgroundColor: colors.white }]}
                            onPressIn={() => setDividePressed(true)}
                            onPressOut={() => setDividePressed(false)}
                            activeOpacity={1}
                            onPress={() => handleOperation('÷')}
                        >
                            <Text style={[styles.buttonText, dividePressed && { color: 'black' }]}>÷</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, multiplyPressed && { backgroundColor: colors.white }]}
                            onPressIn={() => setMultiplyPressed(true)}
                            onPressOut={() => setMultiplyPressed(false)}
                            activeOpacity={1}
                            onPress={() => handleOperation('×')}
                        >
                            <Text style={[styles.buttonText, multiplyPressed && { color: 'black' }]}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.button, buttonPressed7 && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressed7(true)}
                            onPressOut={() => setButtonPressed7(false)}
                            activeOpacity={1}
                            onPress={() => handleInput('7')}
                        >
                            <Text style={[styles.buttonText, buttonPressed7 && { color: 'black' }]}>7</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, buttonPressed8 && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressed8(true)}
                            onPressOut={() => setButtonPressed8(false)}
                            activeOpacity={1}
                            onPress={() => handleInput('8')}
                        >
                            <Text style={[styles.buttonText, buttonPressed8 && { color: 'black' }]}>8</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, buttonPressed9 && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressed9(true)}
                            onPressOut={() => setButtonPressed9(false)}
                            activeOpacity={1}
                            onPress={() => handleInput('9')}
                        >
                            <Text style={[styles.buttonText, buttonPressed9 && { color: 'black' }]}>9</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, buttonPressedMinus && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressedMinus(true)}
                            onPressOut={() => setButtonPressedMinus(false)}
                            activeOpacity={1}
                            onPress={() => handleOperation('-')}
                        >
                            <Text style={[styles.buttonText, buttonPressedMinus && { color: 'black' }]}>-</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed4 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed4(true)}
                                    onPressOut={() => setButtonPressed4(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('4')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed4 && { color: 'black' }]}>4</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed5 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed5(true)}
                                    onPressOut={() => setButtonPressed5(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('5')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed5 && { color: 'black' }]}>5</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed6 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed6(true)}
                                    onPressOut={() => setButtonPressed6(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('6')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed6 && { color: 'black' }]}>6</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed1 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed1(true)}
                                    onPressOut={() => setButtonPressed1(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('1')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed1 && { color: 'black' }]}>1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed2 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed2(true)}
                                    onPressOut={() => setButtonPressed2(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('2')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed2 && { color: 'black' }]}>2</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, buttonPressed3 && { backgroundColor: colors.white }]}
                                    onPressIn={() => setButtonPressed3(true)}
                                    onPressOut={() => setButtonPressed3(false)}
                                    activeOpacity={1}
                                    onPress={() => handleInput('3')}
                                >
                                    <Text style={[styles.buttonText, buttonPressed3 && { color: 'black' }]}>3</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.button, styles.doubleVertical, buttonPressedPlus && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressedPlus(true)}
                            onPressOut={() => setButtonPressedPlus(false)}
                            activeOpacity={1}
                            onPress={() => handleOperation('+')}
                        >
                            <Text style={[styles.buttonText, buttonPressedPlus && { color: 'black' }]}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.button, styles.doubleHorizontal, buttonPressed0 && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressed0(true)}
                            onPressOut={() => setButtonPressed0(false)}
                            activeOpacity={1}
                            onPress={() => handleInput('0')}
                        >
                            <Text style={[styles.buttonText, buttonPressed0 && { color: 'black' }]}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, buttonPressedDot && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressedDot(true)}
                            onPressOut={() => setButtonPressedDot(false)}
                            activeOpacity={1}
                            onPress={() => handleInput('.')}
                        >
                            <Text style={[styles.buttonText, buttonPressedDot && { color: 'black' }]}>.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, buttonPressedOK && { backgroundColor: colors.white }]}
                            onPressIn={() => setButtonPressedOK(true)}
                            onPressOut={() => setButtonPressedOK(false)}
                            activeOpacity={1}
                            onPress={calculate}
                        >
                            <Text style={[styles.buttonText, buttonPressedOK && { color: 'black' }]}>OK</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        )
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // semi-transparent background
        zIndex: 1000,
    },
    calculator: {
        backgroundColor: colors.gray,
        padding: wp('2%'),
        elevation: 10,
    },
    display: {
        width: wp('66.8%'),
        height: hp('6%'),
        backgroundColor: 'white',
        textAlign: 'left',
        padding: wp('2%'),
        fontSize: wp('5%'),
        color: 'black',
        margin: wp('1%'),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flexDirection: 'column',
    },
    button: {
        backgroundColor: colors.brightgreen,
        width: wp('15%'),
        height: hp('6%'),
        justifyContent: 'center',
        alignItems: 'center',
        margin: wp('1.1%'),
    },
    doubleHorizontal: {
        width: wp('32.2%'),
    },
    doubleVertical: {
        height: hp('13.1%'),
    },
    buttonText: {
        color: 'white',
        fontSize: wp('5%'),
    },
});

export default Calculator;
