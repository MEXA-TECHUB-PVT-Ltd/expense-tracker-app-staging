import { StyleSheet, Text, View, FlatList, TouchableOpacity, Animated, Pressable } from 'react-native'
import React, {useState, useRef, useEffect, useCallback} from 'react'
import colors from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Appbar, Modal, Portal, TextInput, Button} from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { db } from '../../database/database';
import { useSelector } from 'react-redux';
import dimensions from '../../constants/dimensions';

const { width: screenWidth } = dimensions;

const TransactionsSearch = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
    const user_id = useSelector(state => state.user.user_id);
    const temp_user_id = useSelector(state => state.user.temp_user_id);
    const [tempUserId, setTempUserId] = useState(user_id);
    console.log('value of tempUserId in state inside TransactionSearch', tempUserId);
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                setTempUserId(user_id);
            } else {
                setTempUserId(temp_user_id);
            }
        }, [isAuthenticated, user_id, temp_user_id])
    );

    // Fetch `searchEnvelopeName` from route params if available
    const propSearchEnvelopeName = route.params?.searchEnvelopeName;

    // States for transactions
    const [searchedTransactions, setSearchedTransactions] = useState([]);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchEnvelopeName, setSearchEnvelopeName] = useState(propSearchEnvelopeName || '');

    // Fetch transactions based on whether `searchEnvelopeName` prop is provided
    useEffect(() => {
        if (propSearchEnvelopeName) {
            // Directly fetch and display matching results if `searchEnvelopeName` is passed as a prop
            searchTransactionsInDB(propSearchEnvelopeName);
        } else {
            // Otherwise, fetch all transactions
            getAllTransactions(tempUserId);
        }
    }, [propSearchEnvelopeName, tempUserId]);

    // Function to get all transactions if no search term is provided
    const getAllTransactions = (tempUserId) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT * FROM Transactions WHERE user_id = ? ORDER BY id DESC;`,
                [tempUserId],
                (_, results) => {
                    const rows = results.rows;
                    let allTransactions = [];
                    for (let i = 0; i < rows.length; i++) {
                        allTransactions.push(rows.item(i));
                    }
                    setSearchedTransactions(allTransactions); // Show all transactions initially
                    console.log('all searched transactions inside transaction search results', allTransactions);
                },
                (error) => {
                    console.error('Error fetching all transactions', error);
                }
            );
        });
    };

    // Function to search and fetch transactions from the database based on `searchEnvelopeName`
    const searchTransactionsInDB = (searchTerm) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT * FROM Transactions WHERE user_id = ? AND payee LIKE ? ORDER BY id DESC;`,  // Searching based on user_id and payee
                [tempUserId, `%${searchTerm}%`],  // Add tempUserId to filter based on user_id
                (_, results) => {
                    const rows = results.rows;
                    let matchingTransactions = [];
                    for (let i = 0; i < rows.length; i++) {
                        matchingTransactions.push(rows.item(i));
                    }
                    setSearchedTransactions(matchingTransactions);  // Set filtered transactions based on payee
                },
                (error) => {
                    console.error('Error fetching filtered transactions', error);
                }
            );
        });
    };

    // Handle search functionality in modal
    const handleSearch = () => {
        if (searchEnvelopeName.trim()) {
            searchTransactionsInDB(searchEnvelopeName);
        } else {
            getAllTransactions(tempUserId);
        }
        setSearchModalVisible(false);
        setSearchEnvelopeName('');
    };

    const handleEditTransaction = (transaction) => {
        // console.log('transactionAmount is: ', transaction.transactionAmount);
        // console.log('singel transaction details are when try to edit: ', transaction);
        navigation.navigate('AddEditDeleteTransaction', {
            id: transaction.id, //
            payee: transaction.payee, //
            transactionAmount: transaction.transactionAmount,
            transactionType: transaction.transactionType, // 
            envelopeName: transaction.envelopeName, // 
            accountName: transaction.accountName, //
            transactionDate: transaction.transactionDate, //
            transactionNote: transaction.transactionNote, //
            user_id: transaction.user_id, 
            edit_transaction: true,
        });
    };
    

    // Handle the magnify icon press to show the search modal
    const handleMagnifyIconPress = () => {
        setSearchModalVisible(true);
    };

    // Handle the left icon press to go back
    const handleLeftIconPress = () => {
        navigation.goBack();
    };


    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
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
        navigation.navigate('Help', { from_transactionsearch: true });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    };
    
    return (
        <Pressable style={{ flex: 1 }}
            onPress={() => {
                handleOutsidePress();
            }}
        >
        <View style={styles.container}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content title="Transaction Search" titleStyle={styles.appbar_title} />
                <Appbar.Action onPress={handleMagnifyIconPress} icon="magnify" color={colors.white} />
                <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
            </Appbar.Header>
                <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity onPress={handleTooltipPress}>
                        <Text style={styles.tooltipText}>Help</Text>
                    </TouchableOpacity>
                </Animated.View>

            <View style={styles.searched_view}>
                <Text style={styles.searched_for_text}>Searched for: <Text style={styles.searched_text}>{searchEnvelopeName || '<any>'}</Text></Text>
            </View>
            <View style={styles.transaction_text_view}>
                <Text style={styles.transactions_text}>Search Results</Text>
            </View>

            <View style={styles.flatlist_view}>
            <FlatList
                data={searchedTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    return (
                        <View style={styles.item_view}>
                            <TouchableOpacity 
                            onPress={() => handleEditTransaction(item)} 
                            style={styles.touchable_view}
                            >
                                <View style={styles.date_view}>
                                    <Text style={styles.date_txt}>{formatDate(item.transactionDate)}</Text>
                                </View>
                                <View style={styles.name_payee_amt_view}>
                                    <View style={styles.payee_amt_view}>
                                        <View style={styles.payee_text_view}>
                                            <Text
                                                numberOfLines={1}
                                                elellipsizeMode="tail"
                                                style={styles.payee_txt}>{item.payee}</Text>
                                        </View>
                                        <View style={styles.amount_text_view}>
                                            <Text
                                                numberOfLines={1}
                                                elellipsizeMode="tail"
                                                style={[styles.amt_txt, { color: item.transactionType === 'Credit' ? colors.brightgreen : colors.black }]}>
                                                {item.transactionType === 'Credit' ? `+ ${item.transactionAmount}` : item.transactionAmount}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.envelope_account_txt_view}>
                                        <View style={styles.txt_amt_view}>
                                            <View style={styles.envelope_account_texts_view}>
                                                <Text style={styles.envelope_name_txt}>{item.envelopeName}</Text>
                                                <Text style={styles.account_name_txt}> | My Account</Text>
                                            </View>
                                            <View style={styles.amt_txt_view}>
                                                <Text style={styles.account_amount_txt}>{item.envelopeRemainingIncome}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
            </View>

            <Portal>
            <Modal visible={searchModalVisible} onDismiss={() => setSearchModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                <View style={styles.search_transaction_txt_view}>
                    <Text style={styles.modalText}>Search Transactions</Text>
                </View>
                <View style={styles.modal_textinput_view}>
                    <TextInput
                        placeholder='Search Transaction'
                        value={searchEnvelopeName}
                        onChangeText={setSearchEnvelopeName}
                        mode="flat"
                        dense={true}
                        textColor={colors.black}
                        style={styles.textInput}
                        theme={{
                            colors: {
                                primary: colors.androidbluebtn,
                            }
                        }}
                    />
                </View>
                <View style={styles.search_btn_view}>
                    <Button
                        mode="text"
                        onPress={handleSearch}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                    >
                        Search
                    </Button>
                </View>
            </Modal>
            </Portal>
        </View>
        </Pressable>
    )
}

export default TransactionsSearch

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
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

    searched_view: {
        height: hp('7%'),
        justifyContent: 'center',
        marginHorizontal: hp('1.5%'),
    },
    searched_for_text: {
        fontSize: hp('2.25%'),
        fontWeight: '400',
        color: colors.gray,
        marginLeft: hp('2.25%'),
    },
    searched_text: {
        fontSize: hp('2.25%'),
        fontWeight: '400',
        color: 'black',
        marginLeft: hp('2.25%'),
    },
    transaction_text_view: {
        height: hp('3%'),
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        marginHorizontal: hp('1.5%'),
    },
    transactions_text: {
        fontSize: hp('2%'),
        fontWeight: 'bold',
        color: colors.gray,
    },

    //flatlist styles
    flatlist_view: {
        flex: 1,
    },
    item_view: {
        marginHorizontal: hp('1.5%'),
        
    },
    touchable_view: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray,
        paddingTop: hp('0.5%'),
    },
    date_view: {
        flexDirection: 'row',
        // backgroundColor: colors.gray,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginRight: hp('1%'),
    },
    date_txt: {
        fontSize: hp('2.25%'),
        fontWeight: '400',
        color: colors.gray,
    },
    name_payee_amt_view: {
        flex: 1,
        // backgroundColor: colors.brightgreen,
    },
    payee_amt_view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // backgroundColor: 'green',
    },
    payee_text_view: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        // backgroundColor: 'blue',
    },
    payee_txt: {
        fontSize: hp('2.50%'),
        fontWeight: '500',
        color: colors.black,
    },
    amount_text_view: {
        width: hp('10%'),
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        // backgroundColor: 'red',
    },
    amt_txt: {
        fontSize: hp('2.25%'),
        fontWeight: '500',
        color: colors.black,
    },

    envelope_account_txt_view: {
        flexDirection: 'row',
        // backgroundColor: 'yellow',
    },
    txt_amt_view: {
        flexDirection: 'row',
        // backgroundColor: 'green',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    envelope_account_texts_view: {
        flexDirection: 'row',
        // backgroundColor: 'pink',
        alignItems: 'center',
    },
    envelope_name_txt: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.gray,
    },
    account_name_txt: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.gray,
    },
    amt_txt_view: {
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    account_amount_txt: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.gray,
        alignSelf: 'flex-end',
        // backgroundColor: 'red',
    },

    // modal styles
    modalContainer: {
        backgroundColor: 'white',
        paddingVertical: hp('2%'),
        paddingHorizontal: hp('2%'),
        width: '85%',
        maxWidth: hp('50%'),
        alignSelf: 'center',
        // top: -40,
    },
    search_transaction_txt_view: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    modalText: {
        fontSize: hp('2.4%'),
        fontWeight: 'bold',
        color: 'black',
        textAlign: 'flex-start',
    },
    modal_textinput_view: {
        marginTop: hp('2%'),
    },
    textInput: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        paddingHorizontal: 0,
    },
    search_btn_view: {
        marginTop: hp('3%'),
        alignItems: 'flex-end',
    },
    button: {
        color: colors.androidbluebtn,
    },
    buttonLabel: {
        color: colors.androidbluebtn,
    },

})
