import { StyleSheet, Text, View, FlatList, TouchableOpacity, StatusBar, Image, } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { TextInput, Modal, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { db } from '../../database/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Images from '../../constants/images';


const Transactions = ({ isSearched, setIsSearched, searchModalVisible, setSearchModalVisible }) => {
  // console.log('value of isSearched:', isSearched);
  const navigation = useNavigation();

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector(state => state.user.user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  // console.log('value of tempUserId in state inside Transactions is :', tempUserId);
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  // code to get all transactions in Transaction table 
  const [transactions, setTransactions] = useState([]);
  useFocusEffect(
    useCallback(() => {
      // console.log('Running getAllTransactions with tempUserId:', tempUserId);
      getAllTransactions(tempUserId);
    }, [tempUserId])
  );

  const getAllTransactions = (tempUserId) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM Transactions WHERE user_id = ? ORDER BY id DESC;`,
        [tempUserId],
        (_, results) => {
          // console.log("results : ", results);
          const rows = results.rows;
          let allTransactions = [];
          for (let i = 0; i < rows.length; i++) {
            allTransactions.push(rows.item(i));
          }
          setTransactions(allTransactions);
          // console.log('All Transactions in transactions screen are :', allTransactions);
        },
        (error) => {
          console.error('Error fetching transactions', error); // Capture any error
        }
      );
    });
  };


  const handleEditTransaction = (transaction) => {
    // console.log('transactionAmount is: ', transaction.transactionAmount);
    // console.log('singel transaction details are when try to edit: ', transaction);
    if (transaction.navigationScreen === 'fillEnvelops') {
      // Navigate to FillEnvelopesAuthenticated with the full transaction object
      navigation.navigate('FillEnvelopesAuthenticated', { transaction, editOrdelete: true });
    } else {
      navigation.navigate('AddEditDeleteTransaction', {
        id: transaction.id, //
        payee: transaction.payee, //
        transactionAmount: transaction.transactionAmount,
        transactionType: transaction.transactionType, // 
        envelopeName: transaction.envelopeName, // 
        // envelopeRemainingIncome: transaction.envelopeRemainingIncome, // check this if it is properly passed
        envelopeId: transaction.envelopeId,
        accountName: transaction.accountName, //
        transactionDate: transaction.transactionDate, //
        transactionNote: transaction.transactionNote, //
        edit_transaction: true,
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  // for searching transactions
  const [searchEnvelopeName, setSearchEnvelopeName] = useState('');
  // Effect to open the modal when isSearched is true
  useEffect(() => {
    if (isSearched) {
      setSearchModalVisible(true);
    }
  }, [isSearched]);

  const handleSearch = () => {
    setSearchModalVisible(false);
    navigation.navigate('TransactionsSearch', { searchEnvelopeName });
    setIsSearched(false); // used this so that modal dont open again
  };

  useFocusEffect(
    React.useCallback(() => {
      setSearchEnvelopeName(''); // Reset to empty when coming back to this screen
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.munsellgreen} />

      <View style={styles.all_transactions_view}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={Images.expenseplannerimagegray}
              style={styles.emptyImage}
            />
            <View style={styles.emptyTextContainer}>
              <Text style={styles.emptyText}>You have not made any transaction yet</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              return (
                <View style={styles.item_view}>
                  <TouchableOpacity onPress={() => handleEditTransaction(item)} style={styles.touchable_view}>
                    <View style={styles.date_view}>
                      <Text style={styles.date_txt}>{formatDate(item.transactionDate)}</Text>
                    </View>
                    <View style={styles.name_payee_amt_view}>
                      <View style={styles.payee_amt_view}>
                        <View style={styles.payee_text_view}>
                          <Text
                            // numberOfLines={1}
                            // elellipsizeMode="tail"
                            style={styles.payee_txt}>{item.payee}</Text>
                        </View>
                        <View style={styles.amount_text_view}>
                          <Text
                            // numberOfLines={1}
                            // elellipsizeMode="tail"
                            style={[styles.amt_txt, { color: item.transactionType === 'Credit' ? colors.brightgreen : colors.black }]}
                          >
                            {item.transactionType === 'Credit'
                              ? `+ ${Math.abs(item.transactionAmount)}`  // Apply Math.abs() to Credit as well to not show values in minus
                              : `${Math.abs(item.transactionAmount)}`     // Apply Math.abs() for non-Credit (Expense) to not show values in minus
                            }.00
                          </Text>
                        </View>
                      </View>
                      <View style={styles.envelope_account_txt_view}>
                        <Text style={styles.envelope_name_txt}>{item.envelopeName}</Text>
                        {item.accountName && (
                          <Text style={styles.account_name_txt}> | {item.accountName}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>

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
    </View>
  )
}

export default Transactions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  all_transactions_view: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: hp('10%'),
    height: hp('10%'),
    marginBottom: hp('5%'),
  },
  emptyTextContainer: {
    maxWidth: hp('30%'),
    // backgroundColor: 'yellow',
  },
  emptyText: {
    fontSize: hp('2.5%'),
    color: colors.gray,
    textAlign: 'center',
    alignSelf: 'center',
  },

  //flatlist styles
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
    alignItems: 'flex-start',
    // backgroundColor: 'blue',
  },
  payee_txt: {
    fontSize: hp('2.50%'),
    fontWeight: '500',
    color: colors.black,
    // backgroundColor: 'blue',
  },
  amount_text_view: {
    width: hp('20%'),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'fles-start',
    // backgroundColor: 'red',
  },
  amt_txt: {
    fontSize: hp('2.25%'),
    fontWeight: '500',
    color: colors.black,
  },
  envelope_account_txt_view: {
    flexDirection: 'row',
    // backgroundColor: 'blue',
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

  // modal styles
  modalContainer: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    paddingHorizontal: hp('2%'),
    width: '85%',
    maxWidth: hp('50%'),
    alignSelf: 'center',
    top: -40,
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