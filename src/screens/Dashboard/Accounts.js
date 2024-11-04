import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, {useState, useEffect, useCallback} from 'react'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors'
import { db, fetchTotalIncome, fetchTotalEnvelopesAmount} from '../../database/database';
import { useFocusEffect } from '@react-navigation/native';

const Accounts = () => {
  // for showing total monthly budget of default My Account
  const [accountBudget, setAccountBudget] = useState(0);
  // useFocusEffect(
  //   React.useCallback(() => {
  //     fetchTotalIncome(setTotalIncome);
  //   }, [])
  // );

  // for showing total sum of all envelopes incomes single sumup of all
  const [totalIncome, setTotalIncome] = useState(0);
  useEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setTotalIncome);
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.munsellgreen} />
      <View style={styles.all_accounts_txt_amt}>
        <Text style={styles.aa_amt_txt}>All Accounts : {totalIncome}.00</Text>
      </View>
      <View style={styles.account_amt_view}>
        <Text style={styles.account_amt_txt}>My Account</Text>
        <Text style={styles.account_amt_txt}>{totalIncome}.00</Text>
      </View>
      <View style={styles.subtotal_amt_view}>
        <Text style={styles.subtotal_txt}>Subtotal:</Text>
        <Text style={styles.subtotal_amt_txt}>{totalIncome}.00</Text>
      </View>
    </View>
  )
}

export default Accounts

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  all_accounts_txt_amt: {
    marginHorizontal: hp('1.5%'),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: hp('1%'),
    borderBottomColor: colors.lightGray,
    borderBottomWidth: 1,
    paddingBottom: hp('3.2%'),
  },
  aa_amt_txt: {
    fontSize: hp('1.8%'),
    fontWeight: '500',
    color: colors.gray,
    paddingRight: wp('5%'),
  },
  account_amt_view: {
    marginHorizontal: hp('2%'),
    flexDirection: 'row',
    justifyContent:'space-between',
  },
  account_amt_txt: {
    fontSize: hp('2.5%'),
    fontWeight: '400',
    color: colors.gray,
  },
  subtotal_amt_view: {
    marginHorizontal: hp('3%'),
    flexDirection: 'row',
    justifyContent:'flex-end',
  },
  subtotal_txt: {
    fontSize: hp('2.3%'),
    fontWeight: '600',
    color: colors.black,
  },
  subtotal_amt_txt: {
    fontSize: hp('2.3%'),
    fontWeight: '600',
    color: colors.black,
    marginLeft: hp('6%'),
  },
})
