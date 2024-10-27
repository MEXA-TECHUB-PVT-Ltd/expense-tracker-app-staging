import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, TouchableOpacity, FlatList } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import {TextInput, Appbar, Button, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
const { width: screenWidth } = dimensions;

import { db, addAmount, fetchTotalIncome, fetchAllIncomes, deleteIncome } from '../../database/database';

const IncomeInput = ({ item, index, onAmountChange, onDelete, onRemove, selectedIndex, setSelectedIndex, onChange }) => {
    // const [amount, setAmount] = useState('');
    // const [amount, setAmount] = useState(item.amount.toString());
    // const [budgetPeriod, setBudgetPeriod] = useState('Monthly');

    const [amount, setAmount] = useState(item.amount ? item.amount.toString() : '');
    const [budgetPeriod, setBudgetPeriod] = useState(item.budgetPeriod || 'monthly');
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        setAmount(item.amount ? item.amount.toString() : '');
        setBudgetPeriod(item.budgetPeriod || 'monthly');
    }, [item]);

    const handleAmountChange = (text) => {
        setAmount(text);
        onAmountChange(index, text, budgetPeriod);
    };

    const handleBudgetPeriodChange = (text) => {
        setBudgetPeriod(text);
        onAmountChange(index, amount, text);
    };

    // const handleAmountChange = (amount) => {
    //     setAmount(amount);
    //     onChange(amount, budgetPeriod); // Call onChange to update parent state
    // };

    // const handleBudgetPeriodChange = (budgetPeriod) => {
    //     setBudgetPeriod(budgetPeriod);
    //     onChange(amount, budgetPeriod); // Call onChange to update parent state
    // };

    return (
        <View style={styles.incomeInputContainer}>
            <Text style={styles.indexText}>{index + 1}.</Text>
            {/* <Text style={styles.indexText}>{item.id ? item.id : index + 1}</Text> */}
            
            <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                mode="flat"
                style={styles.textInput}
                theme={{ colors: { primary: selectedIndex === index ? colors.brightgreen : 'lightgray', underlineColor: 'transparent' } }}
                // onFocus={() => setSelectedIndex(index)}
                keyboardType='numeric'
                textColor={colors.black}
            />

            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity style={styles.frequencySelector} onPress={() => setMenuVisible(true)}>
                        <Text style={styles.frequencyText}>{budgetPeriod}</Text>
                        <VectorIcon name="arrow-drop-down" size={24} color={colors.gray} type="mi" />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContentStyle}
            >
                {/* <Menu.Item onPress={() => { handleBudgetPeriodChange('Monthly'); setMenuVisible(false); }} title="Monthly" titleStyle={{ color: colors.black }} /> */}
                <Menu.Item onPress={() => { setBudgetPeriod('Monthly'); setMenuVisible(false); }} title="Monthly" titleStyle={{ color: colors.black }} />
                {/* <Menu.Item onPress={() => { setBudgetPeriod('Twice a Month'); setMenuVisible(false); }} title="Twice a Month" titleStyle={{ color: colors.black }} /> */}
                {/* <Menu.Item onPress={() => { setBudgetPeriod('Every 2 weeks'); setMenuVisible(false); }} title="Every 2 weeks" titleStyle={{ color: colors.black }} /> */}
            </Menu>

            <TouchableOpacity 
            onPress={() => onDelete(index)}
            // onPress={onRemove}
            >
                <VectorIcon name="close" size={20} color={colors.gray} type="mi" />
            </TouchableOpacity>
        </View>

    );
};



const SetIncomeAmount = () => {
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
            Animated.timing(slideAnim, {
                toValue: screenWidth,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
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

    // const [selectedIndex, setSelectedIndex] = useState(null);


    // //sqlite
    // const [amountInputs, setAmountInputs] = useState([]);
    // const [totalAmount, setTotalAmount] = useState(0);

    // // Initialize an array to hold amount and budgetPeriod values
    // const [amountData, setAmountData] = useState([]);
    // const handleAddIncomeInput = () => {
    //     setAmountInputs([...amountInputs, { key: Math.random().toString() }]);
    //     setAmountData([...amountData, { amount: '', budgetPeriod: 'Monthly' }]); // Initialize new input data
    // };

    // useEffect(() => {
    //     fetchAllIncomes(setAmountInputs);
    //     console.log('all incomes in income table: ', fetchAllIncomes);
    //     fetchTotalIncome(setTotalAmount);
    //     console.log('total income in set income amount screen ', totalAmount);
    // }, []);

    // // const handleAddIncomeInput = () => {
    // //     setIncomeInputs([...incomeInputs, { key: Math.random().toString() }]);
    // // };

    // const handleRemoveIncomeInput = (index) => {
    //     deleteIncome(amountInputs[index].id);
    //     const updatedInputs = amountInputs.filter((_, i) => i !== index);
    //     setAmountInputs(updatedInputs);
    //     setAmountData(updatedData); // Update incomeData as well
    // };

    // // Update amountData on change
    // const handleInputChange = (amount, budgetPeriod, index) => {
    //     const updatedData = [...amountData];
    //     updatedData[index] = { amount: amount, budgetPeriod }; // Update specific index
    //     setAmountData(updatedData);
    // };

    // // const handleSave = (income, budgetPeriod) => {
    // //     console.log('inside handleSave', income, budgetPeriod);
    // //     // Save to SQLite and update total income
    // //     addAmount(income, budgetPeriod); // Assuming this function saves income to your database
    // //     fetchAllIncome(setIncomeInputs); // Refresh income inputs
    // //     fetchTotalIncomes(setTotalIncome); // Refresh total income
    // // };


    // const handleSave = () => {
    //     console.log("Saving incomes:", amountData); // Add this line to log current income data
    //     console.log('amount in amountData', amountData.amount);
    //     console.log('budgetPeriod in amountData', amountData.budgetPeriod);

    //     amountData.forEach(({ amount, budgetPeriod }) => {
    //         if (amount) {
    //             console.log(`Adding income with: ${JSON.stringify({ amount, budgetPeriod })}`); // Log values before saving
    //             addAmount(amount, budgetPeriod); // Save income to SQLite
    //         } else {
    //             console.error('Income value is undefined or null'); // This log is for debugging
    //         }
    //     });
    //     fetchAllIncome(setAmountInputs); // Refresh income inputs
    //     fetchTotalIncomes(setTotalAmount); // Refresh total income
    // };


    const [incomes, setIncomes] = useState([]);

    useEffect(() => {
        fetchAllIncome();
    }, []);

    // const fetchAllIncome = () => {
    //     db.transaction((tx) => {
    //         tx.executeSql('SELECT * FROM Income', [], (tx, results) => {
    //             let data = [];
    //             for (let i = 0; i < results.rows.length; i++) {
    //                 data.push(results.rows.item(i));
    //             }
    //             setIncomes(data);
    //             console.log('data in fetchallincome: ', data);
    //         });
    //     });
    // };
    const fetchAllIncome = () => {
        db.transaction((tx) => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS Income (id INTEGER PRIMARY KEY AUTOINCREMENT, amount TEXT, budgetPeriod TEXT)', []);
            tx.executeSql('SELECT * FROM Income', [], (tx, results) => {
                let data = [];
                for (let i = 0; i < results.rows.length; i++) {
                    data.push(results.rows.item(i));
                }
                setIncomes([...data, { id: null, amount: '', budgetPeriod: 'monthly' }]);
            });
        });
    };

    const addIncome = () => {
        setIncomes([...incomes, { amount: '', budgetPeriod: 'monthly' }]);
    };

    // const saveIncome = () => {
    //     db.transaction((tx) => {
    //         incomes.forEach((income) => {
    //             if (income.id) {
    //                 tx.executeSql(
    //                     'UPDATE income SET amount = ?, budgetPeriod = ? WHERE id = ?',
    //                     [income.amount, income.budgetPeriod, income.id]
    //                 );
    //             } else {
    //                 tx.executeSql(
    //                     'INSERT INTO income (amount, budgetPeriod) VALUES (?,?)',
    //                     [income.amount, income.budgetPeriod]
    //                 );
    //             }
    //         });
    //     });
    //     fetchAllIncome();
    // };

    // working
    // const saveIncome = () => {
    //     db.transaction((tx) => {
    //         incomes.forEach((income) => {
    //             if (income.amount && income.budgetPeriod) {
    //                 if (income.id) {
    //                     tx.executeSql(
    //                         'UPDATE Income SET amount = ?, budgetPeriod = ? WHERE id = ?',
    //                         [income.amount, income.budgetPeriod, income.id],
    //                         (tx, results) => {
    //                             console.log('Updated: ', { id: income.id, amount: income.amount, budgetPeriod: income.budgetPeriod });
    //                         },
    //                     );
    //                 } else {
    //                     tx.executeSql(
    //                         'INSERT INTO Income (amount, budgetPeriod) VALUES (?, ?)',
    //                         [income.amount, income.budgetPeriod],
    //                         (tx, results) => {
    //                             if (results.insertId) {
    //                                 income.id = results.insertId;
    //                                 console.log('Inserted: ', { id: results.insertId, amount: income.amount, budgetPeriod: income.budgetPeriod });
    //                                 fetchAllIncome(); 
    //                             }
    //                         }
    //                     );
    //                 }
    //             }
    //         });
    //     }, null, fetchAllIncome);
    // };

    const saveIncome = () => {
        db.transaction((tx) => {
            incomes.forEach((income) => {
                if (income.amount && income.budgetPeriod) {
                    if (income.id) {
                        tx.executeSql(
                            'UPDATE Income SET amount = ?, budgetPeriod = ? WHERE id = ?',
                            [income.amount, income.budgetPeriod, income.id],
                            (tx, results) => {
                                console.log('Updated: ', { id: income.id, amount: income.amount, budgetPeriod: income.budgetPeriod });
                            },
                            error => console.error('Error updating income:', error)
                        );
                    } else {
                        tx.executeSql(
                            'INSERT INTO Income (amount, budgetPeriod) VALUES (?, ?)',
                            [income.amount, income.budgetPeriod],
                            (tx, results) => {
                                if (results.insertId) {
                                    income.id = results.insertId;
                                    console.log('Inserted: ', { id: results.insertId, amount: income.amount, budgetPeriod: income.budgetPeriod });
                                }
                            },
                            error => console.error('Error inserting income:', error)
                        );
                    }
                }
            });
        },
            error => console.error('Transaction error:', error),
            () => {
                fetchAllIncome();
                navigation.navigate('SetupBudget');
            });
    };

    const logAllIncome = () => {
        db.transaction((tx) => {
            tx.executeSql('SELECT * FROM Income', [], (tx, results) => {
                console.log('Current Income Table: ', results.rows.raw());
            });
        });
    };

    // const handleAmountChange = (index, amount, budgetPeriod) => {
    //     const newIncomes = [...incomes];
    //     newIncomes[index] = { ...newIncomes[index], amount, budgetPeriod };
    //     setIncomes(newIncomes);
    // };

    // const handleDelete = (index) => {
    //     const itemToDelete = incomes[index];
    //     if (itemToDelete.id) {
    //         db.transaction((tx) => {
    //             tx.executeSql('DELETE FROM income WHERE id = ?', [itemToDelete.id], () => {
    //                 fetchAllIncome();
    //             });
    //         });
    //     } else {
    //         const newIncomes = incomes.filter((_, i) => i !== index);
    //         setIncomes(newIncomes);
    //     }
    // };

    const handleAmountChange = (index, amount, budgetPeriod) => {
        const newIncomes = [...incomes];
        newIncomes[index] = { ...newIncomes[index], amount, budgetPeriod };
        setIncomes(newIncomes);
    };

    const handleDelete = (index) => {
        const itemToDelete = incomes[index];
        if (itemToDelete.id) {
            db.transaction((tx) => {
                tx.executeSql('DELETE FROM Income WHERE id = ?', [itemToDelete.id], () => {
                    fetchAllIncome();
                    console.log('item deleted with id: ', itemToDelete.id )
                });
            });
        } else {
            const newIncomes = incomes.filter((_, i) => i !== index);
            setIncomes(newIncomes);
        }
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
                data={incomes}
                renderItem={({ item, index }) => (
                    <IncomeInput
                        // key={item.key} // Ensure each item has a unique key
                        item={item}
                        index={index}
                        // onRemove={() => handleRemoveIncomeInput(index)}
                        // selectedIndex={selectedIndex}
                        // setSelectedIndex={setSelectedIndex}
                        // onChange={(amount, budgetPeriod) => handleInputChange(amount, budgetPeriod, index)} // Update input values
                        onAmountChange={handleAmountChange}
                        onDelete={handleDelete}
                    />
                )}
                // keyExtractor={(item) => item.key}
                keyExtractor={(item, index) => index.toString()}
                style={styles.incomeList}
                ListFooterComponent={
                    <Button
                        mode="contained"
                        // onPress={handleAddIncomeInput}
                        // onPress={addIncome}
                        onPress={() => setIncomes([...incomes, { id: null, amount: '', budgetPeriod: 'monthly' }])}
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
                <Button mode="text" textColor={colors.gray} onPress={() => {navigation.navigate('SetupBudget')}}>
                    NOTHANKS
                </Button>
                <Button 
                mode="text" 
                textColor={colors.androidbluebtn} 
                onPress={saveIncome}
                // onPress={() => {handleSave();}}
                >
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
        paddingHorizontal: 0,
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
