import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { VectorIcon } from '../../constants/vectoricons';

const Calculator = () => {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState(null);
    const [operation, setOperation] = useState(null);
    const [isResult, setIsResult] = useState(false);

    const handleInput = (value) => {
        if (isResult) {
            setDisplay(value);
            setIsResult(false);
        } else {
            setDisplay(display === '0' ? value : display + value);
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
        setOperation(null);
        setPreviousValue(null);
        setIsResult(true);
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
        <View style={styles.container}>
            <View style={styles.calculator}>
                <TextInput style={styles.display} value={display} editable={false} />

                <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={handleBackspace}>
                        <VectorIcon name="backspace" size={17} color={colors.white} type="mci"/>
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
                        <Text style={styles.buttonText}>ok</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
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
