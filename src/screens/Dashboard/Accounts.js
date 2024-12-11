import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, {useState, useEffect, useCallback} from 'react'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import colors from '../../constants/colors'
import { fetchTotalEnvelopesAmount} from '../../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { formatDateSql } from '../../utils/DateFormatter';


const Accounts = () => {
  const [totalIncome, setTotalIncome] = useState(0);

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  const user_id = useSelector(state => state.user.user_id);
  const temp_user_id = useSelector(state => state.user.temp_user_id);
  const [tempUserId, setTempUserId] = useState(user_id);
  // console.log('value of tempUserId in state inside Accounts is : ', tempUserId);
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        setTempUserId(user_id);
      } else {
        setTempUserId(temp_user_id);
      }
    }, [isAuthenticated, user_id, temp_user_id])
  );

  // to get current month dates and then formate them into our sql date formate
  const [formattedFromDate, setFormattedFromDate] = useState('');
  const [formattedToDate, setFormattedToDate] = useState('');

  // console.log('Formatted From Date in Envelopes:', formattedFromDate);
  // console.log('Formatted To Date in Envelopes:', formattedToDate);

  useFocusEffect(
    useCallback(() => {
      const fromDate = moment().startOf('month').format('YYYY-MM-DD');
      const toDate = moment().endOf('month').format('YYYY-MM-DD');

      // default dates set to todays date
      setFormattedFromDate(formatDateSql(fromDate));
      setFormattedToDate(formatDateSql(toDate));

      // hardcoded dates to set and retrieve data for testing purposes
      // setFormattedFromDate('2025-01-01');
      // setFormattedToDate('2025-01-30');
    }, [])
  );

  // for yearly filtering of envelopes
  const startOfYear = moment().startOf('year').toISOString();
  const endOfYear = moment().endOf('year').toISOString();
  // Format the dates using the formatDateSql function
  const formattedFromDateYearly = formatDateSql(startOfYear);
  const formattedToDateYearly = formatDateSql(endOfYear);

  // console.log('++++++++++++++++       formattedFromDateYearly in envelopes screen: ', formattedFromDateYearly);
  // console.log('++++++++++++++++       formattedToDateYearly in envelopes screen: ', formattedToDateYearly);

  useFocusEffect(
    useCallback(() => {
      fetchTotalEnvelopesAmount(setTotalIncome, tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly);
    }, [tempUserId, formattedFromDate, formattedToDate, formattedFromDateYearly, formattedToDateYearly])
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
    backgroundColor: colors.white,
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
