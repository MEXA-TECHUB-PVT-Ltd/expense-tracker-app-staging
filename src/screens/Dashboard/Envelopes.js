import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, Button, FlatList, TouchableOpacity, StatusBar, TouchableWithoutFeedback, Pressable, Keyboard } from 'react-native'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors';
import { VectorIcon } from '../../constants/vectoricons';
import { useNavigation } from '@react-navigation/native'
import { db, fetchTotalEnvelopesAmount } from '../../database/database'
import CustomProgressBar from '../../components/CustomProgressBar';
import { useSelector } from 'react-redux';
import { getUserData } from '../../utils/authUtils';

const Envelopes = () => {
  const navigation = useNavigation();

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user_id = useSelector(state => state.user.user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  console.log('value of tempUserId in state inside envelopes', tempUserId);
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  // for showing total sum of all envelopes incomes single sumup of all
  const [totalIncome, setTotalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setTotalIncome, tempUserId);
    }, [tempUserId])
  );

  // for flatlist
  const [filledIncomes, setFilledIncomes] = useState([]);

  const [envelopes, setEnvelopes] = useState([]);

  const fetchEnvelopes = useCallback(() => {
    getAllEnvelopes(setEnvelopes, tempUserId);
    fetchAndLogFilledIncomes(tempUserId);
  }, [tempUserId]);

  // Use useFocusEffect to call the function when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEnvelopes();
    }, [fetchEnvelopes]) // Ensure fetchEnvelopes is a dependency
  );

  // function to get all envelopes their rows
  const getAllEnvelopes = (callback, tempUserId) => {
    db.transaction(tx => {
      const sqlQuery = 'SELECT * FROM envelopes WHERE user_id = ? ORDER BY orderIndex';
      tx.executeSql(
        sqlQuery,
        [tempUserId],
        (_, results) => {
          if (results.rows && results.rows.length > 0) {
            let envelopesArray = [];
            for (let i = 0; i < results.rows.length; i++) {
              envelopesArray.push(results.rows.item(i));
            }
            callback(envelopesArray);
          } else {
            callback([]);
          }
        },
        (_, error) => {
          console.log('Error getting envelopes:', error);
          return true;
        }
      );
    }, (error) => {
      console.log('Transaction Error:', error);
    }, () => {
      // console.log('Transaction Success');
    });
  };

  const fetchAndLogFilledIncomes = (tempUserId) => {
    console.log('fetchAndLogFilledIncomes called with tempUserId:', tempUserId);
    db.transaction(tx => {
      tx.executeSql(
        `SELECT envelopeId, envelopeName, amount, budgetPeriod, filledIncome, fillDate, user_id FROM envelopes WHERE user_id = ?;`,
        [tempUserId],
        (tx, results) => {
          const rows = results.rows;
          let records = [];

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            console.log(`Row ${i} item:`, item);
            records.push({
              envelopeId: item.envelopeId,
              envelopeName: item.envelopeName,
              amount: item.amount,
              budgetPeriod: item.budgetPeriod,
              filledIncome: item.filledIncome,
              fillDate: item.fillDate,
              user_id: item.user_id,
            });
          }
          setFilledIncomes(records)
          console.log('Filled Incomes record in Envelopes file is:', records);
        },
        (tx, error) => {
          console.error('Error fetching filled incomes:', error);
        }
      );
    });
  };


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.munsellgreen} />
      <View style={styles.budget_period_view}>
        <Text style={styles.monthly_txt}>Monthly</Text>
        <Text style={styles.monthly_txt}>{totalIncome}.00</Text>
      </View>

      <FlatList
        data={envelopes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {

          // const filledIncome = filledIncomes.find(filled => filled.envelopeId === item.envelopeId)?.filledIncome || 0;

          return (
            <View style={styles.item_view}>
              <TouchableOpacity 
              onPress={() => navigation.navigate('SingleEnvelopeDetails', { envelope: item })}
              style={styles.item}
              >
                <View style={styles.name_filledIncome_view}>
                  <Text style={styles.item_text_name}>{item.envelopeName}</Text>
                  <Text style={styles.item_text_filledIncome}>{item.filledIncome || 0}.00</Text>
                </View>
                <View style={styles.bar_icon_view}>
                  <View style={styles.progress_bar_view}>
                    <CustomProgressBar filledIncome={item.filledIncome} amount={item.amount} />
                  </View>
                  <View style={styles.progress_bar_view_icon}>
                    <Text style={styles.item_text_amount}>{item.amount}.00</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        scrollEnabled={false}
      />
    </View>
  )
}

export default Envelopes

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  budget_period_view: {
    height: hp('5%'),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: hp('1.5%'),
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    paddingBottom: hp('0.3%'),
  },
  monthly_txt: {
    fontSize: hp('2%'),
    fontWeight: '500',
    color: colors.gray,
  },

  //flatlist styles
  item_view: {
    marginHorizontal: hp('1.5%'),
  },
  item: {
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderColor: colors.gray,
  },
  name_filledIncome_view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: hp('1%'),
  },
  item_text_name: {
    fontSize: hp('2.2%'),
    color: colors.black,
    fontWeight: '500',
  },
  item_text_filledIncome: {
    fontSize: hp('2.4%'),
    color: colors.black,
    fontWeight: '400',
  },
  item_text_amount: {
    color: colors.black,
  },

  bar_icon_view: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: hp('1%'),

  },
  progress_bar_view: {
    paddingVertical: hp('0.2'),
    flex: 1,
    paddingRight: hp('8%'),
  },
  progress_bar_view_icon: {
    flexDirection: 'row',
    alignItems: 'center',
  },

})
