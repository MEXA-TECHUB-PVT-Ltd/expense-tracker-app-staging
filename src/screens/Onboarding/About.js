import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CustomHeader from '../../components/CustomHeader'
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';


const About = () => {
  const navigation = useNavigation();
  const handleLeftIconPress = () => {
    navigation.goBack();
  };
  return (
    <View>
      <CustomHeader
        containerStyle={{ backgroundColor: colors.brightgreen, }}
        leftIcon={<MCIcons name="keyboard-backspace" size={24} color={colors.white} />}
        leftIconPress={handleLeftIconPress}
        headerText="About  ExpensePlanner"
        headerTextStyle={{ color: colors.white }}
      />
    </View>
  )
}

export default About

const styles = StyleSheet.create({})