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
        if (display === '0') return;
        setPreviousValue(display);
        setOperation(op);
        setDisplay('0');
    };

    const calculate = () => {
        const currentValue = parseFloat(display);
        const previous = parseFloat(previousValue);

        if (!operation || isNaN(currentValue) || isNaN(previous)) return;

        let result;
        switch (operation) {
            case '+':
                result = previous + currentValue;
                break;
            case '-':
                result = previous - currentValue;
                break;
            case '×':
                result = previous * currentValue;
                break;
            case '÷':
                result = previous / currentValue;
                break;
            default:
                return;
        }

        setDisplay(String(result));
        onValueChange(String(result)); // Pass the result back to the parent
        setOperation(null);
        setPreviousValue(null);
        setIsResult(true);
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

    return (
        visible && (
            <View style={styles.container} onTouchEnd={onClose}>
                <View style={styles.calculator} onTouchEnd={(e) => e.stopPropagation()}>
                    <TextInput
                        style={styles.display}
                        value={display}
                        editable={false} // The display is not editable
                    />

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.button} onPress={handleBackspace}>
                            <VectorIcon name="backspace" size={17} color={colors.white} type="mci" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleClear}>
                            <Text style={styles.buttonText}>C</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleOperation('÷')}>
                            <Text style={styles.buttonText}>÷</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleOperation('×')}>
                            <Text style={styles.buttonText}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.button} onPress={() => handleInput('7')}>
                            <Text style={styles.buttonText}>7</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleInput('8')}>
                            <Text style={styles.buttonText}>8</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleInput('9')}>
                            <Text style={styles.buttonText}>9</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleOperation('-')}>
                            <Text style={styles.buttonText}>-</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <View style={styles.row}>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('4')}>
                                    <Text style={styles.buttonText}>4</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('5')}>
                                    <Text style={styles.buttonText}>5</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('6')}>
                                    <Text style={styles.buttonText}>6</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.row}>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('1')}>
                                    <Text style={styles.buttonText}>1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('2')}>
                                    <Text style={styles.buttonText}>2</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleInput('3')}>
                                    <Text style={styles.buttonText}>3</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.button, styles.doubleVertical]} onPress={() => handleOperation('+')}>
                            <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.button, styles.doubleHorizontal]} onPress={() => handleInput('0')}>
                            <Text style={styles.buttonText}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => handleInput('.')}>
                            <Text style={styles.buttonText}>.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={calculate}>
                            <Text style={styles.buttonText}>OK</Text>
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
