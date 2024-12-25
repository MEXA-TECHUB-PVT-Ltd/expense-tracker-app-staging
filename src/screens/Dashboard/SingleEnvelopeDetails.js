import { StyleSheet, Text, View, Image, FlatList, Animated, TouchableOpacity, ImageBackground } from 'react-native'
import React, { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar, FAB, TextInput, Modal, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Images from '../../constants/images';
import { db } from '../../database/database';
import dimensions from '../../constants/dimensions';
import CustomProgressBar from '../../components/CustomProgressBar';
import { useSelector } from 'react-redux';

const { width: screenWidth } = dimensions;

const SingleEnvelopeDetails = ({ route }) => {
  const navigation = useNavigation();
  const { envelope } = route.params;
  // console.log('value of envelope in singel envelope screen: ', envelope);
  const envelopeName = envelope.envelopeName;
  const handleLeftIconPress = () => {
    navigation.goBack();
    setIsSearched(false);
  };

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector(state => state.user.user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  // console.log('value of tempUserId in state inside single envelope: ', tempUserId);
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  // code for tooltip
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const handleRightIconPress = () => {
    toggleTooltip();
  };

  const toggleTooltip = () => {
    if (isTooltipVisible) {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: screenWidth, // Hide by moving off-screen
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsTooltipVisible(false));
    } else {
      setIsTooltipVisible(true);
      // Slide in
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.5, // Show at 50% width from the right
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleOutsidePress = () => {
    if (isTooltipVisible) {
      toggleTooltip(); // Hide if open
    }
  };

  const handleTooltipPress = () => {
    toggleTooltip();
    // console.log('tooltip pressed');
    navigation.navigate('Help', {from_singleenvelopedetails: true});
  };
  // code for tooltip end here


  // code to get all transactions in Transaction table 
  const [envelopeTransactions, setEnvelopeTransactions] = useState([]);
  useFocusEffect(
    useCallback(() => {
      getTransactionsByEnvelope(envelopeName, tempUserId);
    }, [envelopeName, tempUserId])
  );
  const getTransactionsByEnvelope = (envelopeName, tempUserId) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM Transactions WHERE envelopeName = ? AND user_id = ? ORDER BY id DESC;`,
        [envelopeName, tempUserId], // Pass envelopeName as a parameter to the query
        (_, results) => {
          const rows = results.rows;
          let allTransactions = [];
          for (let i = 0; i < rows.length; i++) {
            allTransactions.push(rows.item(i));
          }
          setEnvelopeTransactions(allTransactions);
          // console.log('Transactions for envelope:', envelopeName, 'are:', allTransactions);
        },
        (error) => {
          console.error('Error fetching transactions', error);
        }
      );
    });
  };

  const handleEditTransaction = (transaction) => {
    // console.log('transactionAmount is: ', transaction.transactionAmount);
    console.log('singel transaction details are when try to edit: ', transaction);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  // for searching transactions
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchEnvelopeName, setSearchEnvelopeName] = useState('');
  const [searchedTransactions, setSearchedTransactions] = useState([]);
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = () => {
    searchTransactions(searchEnvelopeName);
    setIsModalVisible(false);
    setIsSearched(true);
  };

  const searchTransactions = (searchEnvelopeName = '') => {
    let allTransactions = envelopeTransactions;
    // Log the envelopeTransactions array and the search term for debugging
    console.log('Envelope Transactions:', envelopeTransactions);
    console.log('Search Envelope Name:', searchEnvelopeName);
    // If searchEnvelopeName is provided, filter the array to match the payee
    if (searchEnvelopeName) {
      allTransactions = allTransactions.filter((transaction) => {
        // Log each transaction's payee for checking the match
        console.log('Transaction payee:', transaction.payee);
        // Use a case-insensitive partial match for the payee
        return transaction.payee && transaction.payee.toLowerCase().includes(searchEnvelopeName.toLowerCase());
      });
    }
    // Set the filtered transactions to the state
    setSearchedTransactions(allTransactions);
    // Log the filtered transactions
    console.log('Searched Transactions:', allTransactions);
  };

  const showBackground = envelope.budgetPeriod === "Goal" && envelope.filledIncome >= envelope.amount;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
        <Appbar.Content title={envelope.envelopeName} titleStyle={styles.appbar_title} />
        <Appbar.Action onPress={() => setIsModalVisible(true)} icon="magnify" color={colors.white} />
        <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
      </Appbar.Header>

      {!isSearched && (
        <ImageBackground
          style={[
            styles.envelope_details_view,
            showBackground && { backgroundColor: 'transparent' } // Optional: modify this if needed
          ]}
          imageStyle={styles.imageStyle}
          source={showBackground ? Images.goalbackgroundimage : null}
        >
        <View style={styles.envelope_details_view}>
          <View style={styles.name_amount_view}>
            <Text style={styles.envelope_name}>{envelope.envelopeName}</Text>
            <Text style={styles.filledIncome_text}>{envelope.filledIncome}.00</Text>
          </View>
          <View style={styles.bar_amount_view}>
            <View style={styles.bar_view}>
              <CustomProgressBar filledIncome={envelope.filledIncome} amount={envelope.amount} />
            </View>
            <View style={styles.amount_view}>
              <Text style={styles.amount_text}>{envelope.amount}.00</Text>
            </View>
          </View>
          <View style={styles.text_image_view}>
            {/* apply different logic in this view to show relevent text msg and amount */}
              <View style={styles.emotional_text_view}>
                <Text style={styles.emotional_text}>
                  {(() => {
                    if (envelope.filledIncome < 0) {
                      return "Hmm, negative money. Interesting...";
                    } 
                    else if (envelope.filledIncome === envelope.amount) {
                      return envelope.budgetPeriod === "Goal"
                        ? "Hooray! You have reached your set goal."
                        : "You haven't spent yet!";
                    }
                    else if (envelope.amount === 0) {
                      return "No budget set yet!";
                    } 
                    else if (
                      envelope.filledIncome > 0 &&
                      envelope.amount > 0 &&
                      envelope.filledIncome > envelope.amount
                    ) {
                      return `You have ${envelope.filledIncome - envelope.amount} more to spend!`;
                    }
                    else if (
                      envelope.filledIncome > 0 &&
                      envelope.amount > 0 &&
                      envelope.filledIncome < envelope.amount
                    ) {
                      return `You have ${envelope.amount - envelope.filledIncome} more to fill!`;
                    }
                    else if (envelope.filledIncome === 0 || " " && envelope.amount > 0) {
                      return envelope.budgetPeriod === "Goal"
                        ? "You have not started saving yet. Time to fill?"
                        : "Time to refill Envelope!";
                    } 
                  })()}
                </Text>
              </View>
            {/* <View style={styles.emotional_text_view}>
              <Text style={styles.emotional_text}>
                {envelope.filledIncome < 0 ? "Hmm, negative money. Interesting..." : `You are spending ${envelope.filledIncome - envelope.amount} more than your budget.`}
              </Text>
            </View> */}

            <View style={styles.image_view}>
              <Image
                style={styles.image}
                source={envelope.filledIncome < 0 ? Images.expenseplannerimagegray : Images.expenseplannerimage}
              />
            </View>
          </View>
        </View>
        </ImageBackground>
      )}
      {isSearched && (
        <View style={styles.searched_view}>
          <Text style={styles.searched_for_text}>Searched for: <Text style={styles.searched_text}>{searchEnvelopeName}</Text></Text>
        </View>
      )}
      <View style={styles.transaction_text_view}>
        <Text style={styles.transactions_text}> {isSearched ? 'Search Results' : 'Transactions'}</Text>
      </View>
      <View style={styles.flatlist_view}>
        {!isSearched && (
          envelopeTransactions.length > 0 ? (
          <FlatList
            data={envelopeTransactions}
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
          ) : (
            <View style={styles.emptyState}>
              <Image source={Images.expenseplannerimagegray} style={styles.emptyImage} />
              <View style={styles.emptyTextContainer}>
                <Text style={styles.emptyText}>You have not made any transaction yet</Text>
              </View>
            </View>
          )
        )}

        {isSearched && (
          searchedTransactions.length > 0 ? (
          <FlatList
            data={searchedTransactions}
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
          ) : (
            <View style={styles.emptyState}>
              <Image source={Images.expenseplannerimagegray} style={styles.emptyImage} />
              <View style={styles.emptyTextContainer}>
                <Text style={styles.emptyText}>You have not made any transaction yet</Text>
              </View>
            </View>
          )
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditDeleteTransaction')}
      />
      
      <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity onPress={handleTooltipPress}>
          <Text style={styles.tooltipText}>Help</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={isModalVisible} onDismiss={() => setIsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
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

export default SingleEnvelopeDetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,  
  },
  appBar: {
    backgroundColor: colors.brightgreen,
    height: hp('7%'),
  },
  appbar_title: {
    color: colors.white,
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
  },
  envelope_details_view: {
    height: hp('17%'),
    marginHorizontal: hp('1.5%'),
  },
  imageStyle: {
    resizeMode: 'repeat',
  },
  name_amount_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  envelope_name: {
    fontSize: hp('2.4%'),
    fontWeight: 'bold',
    color: colors.gray,
  },
  filledIncome_text: {
    fontSize: hp('2.3%'),
    fontWeight: '500',
    color: colors.gray,
  },
  bar_amount_view: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bar_view: {
    height: hp('3%'),
    width: wp('65%'),
    justifyContent: 'center',
  },
  amount_view: {
    height: hp('3%'),
    justifyContent: 'center',
  },
  amount_text: {
    fontSize: hp('2%'),
    fontWeight: '500',
    color: colors.gray,
  },
  text_image_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('3%'),
  },
  emotional_text_view: {
    width: '70%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  emotional_text: {
    fontSize: hp('2%'),
    fontWeight: '400',
    color: colors.gray,
  },
  image_view: {
    height: hp('6%'),
    width: wp('11%'),
  },
  image: {
    height: hp('6%'),
    width: wp('11%'),
    resizeMode: 'contain',

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
  flatlist_view: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: hp('9%'),
    height: hp('9%'),
    marginBottom: hp('5%'),
  },
  emptyTextContainer: {
    maxWidth: hp('30%'),
    // backgroundColor: 'yellow',
  },
  emptyText: {
    fontSize: hp('2.4%'),
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

  // fab styles
  fab: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: colors.androidbluebtn,
    margin: 20,
    right: 5,
    bottom: 0,
  },

  // tooltip styles
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

  // modal styles
  modalContainer: {
    backgroundColor: 'white',
    paddingVertical: hp('2%'),
    paddingHorizontal: hp('2%'),
    width: '85%',
    maxWidth: hp('50%'),
    alignSelf: 'center',
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
