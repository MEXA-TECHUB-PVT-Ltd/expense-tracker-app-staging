import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React from 'react'
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const TermsAndContions = () => {
    const navigation = useNavigation();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };
    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content title="Terms & Conditions" titleStyle={styles.appbar_title} />
                {/* <Appbar.Action icon="dots-vertical" color={colors.white} /> */}
            </Appbar.Header>

            <ScrollView style={{flex: 1}}>
                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Terms & Conditions</Text>
                    <Text style={styles.summary_text}>
                        By using the Expense Tracker app, you agree to these Terms & Conditions. If you do not agree with these terms, please discontinue use of the app.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Offline Use and Local Data Storage</Text>
                    <Text style={styles.summary_text}>
                        Expense Tracker is an offline application. All your data is stored locally on your device using SQLite. The app does not sync data to any server or online platform.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>User Responsibilities</Text>
                    <Text style={styles.summary_text}>
                        You are responsible for managing your device’s security to prevent unauthorized access to your stored data. The app is not liable for data loss due to device issues or user error.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Limitations of Liability</Text>
                    <Text style={styles.summary_text}>
                        Expense Tracker is provided "as is" without warranties. The app is not responsible for financial losses, device failures, or other damages resulting from its use.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>App Updates and Changes</Text>
                    <Text style={styles.summary_text}>
                        The app may be updated periodically to improve features or fix bugs. Continued use of the app after updates indicates acceptance of any modified terms.
                    </Text>
                </View>
             
            </ScrollView>
        </View>
    )
}

export default TermsAndContions

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

    // title and summary
    title_summary_view: {
        marginHorizontal: hp('1.3%'),
        paddingRight: hp('1%'),
        marginVertical: hp('1.5%'),
    },
    title_text: {
        fontSize: hp('2.5%'),
        fontWeight: '600',
        color: colors.black,
    },
    subtitle_text: {
        fontSize: hp('2%'),
        fontWeight: '600',
        color: colors.black,
    },
    summary_text: {
        fontSize: hp('1.9%'),
        color: colors.black,
        fontWeight: '400',
        marginTop: hp('1%'),
    },
})