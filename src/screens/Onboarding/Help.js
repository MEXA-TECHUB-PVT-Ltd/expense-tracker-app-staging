import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Help = () => {
    const navigation = useNavigation();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };
    return (
        <View>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content title="Help" titleStyle={styles.appbar_title} />
            </Appbar.Header>
        </View>
    )
}

export default Help;

const styles = StyleSheet.create({
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
})