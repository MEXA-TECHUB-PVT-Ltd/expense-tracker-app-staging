import { StyleSheet, Text, View, StatusBar} from 'react-native'
import React from 'react'
import colors from '../../constants/colors'

const Reports = () => {
  return (
    <View>
      <StatusBar backgroundColor={colors.munsellgreen} />
      <Text>Reports</Text>
    </View>
  )
}

export default Reports

const styles = StyleSheet.create({})