import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React from 'react'
import colors from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const PrivacyPolicy = () => {
    const navigation = useNavigation();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };
    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content title="Privacy Policy" titleStyle={styles.appbar_title} />
                {/* <Appbar.Action icon="dots-vertical" color={colors.white} /> */}
            </Appbar.Header>

            <ScrollView style={{ flex: 1 }}>
                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Privacy Policy</Text>
                    <Text style={styles.summary_text}>
                        Expense Tracker respects your privacy. Here is how we handle your data.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Local Data Collection</Text>
                    <Text style={styles.summary_text}>
                        Expense Tracker stores your data locally on your device. No data is collected, transmitted, or stored on any online server or cloud platform.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Data Security</Text>
                    <Text style={styles.summary_text}>
                        As your data resides on your device, it is your responsibility to secure your device with proper security measures (e.g., passwords, encryption). The app does not provide built-in backup or recovery for your data.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>No Third-Party Sharing</Text>
                    <Text style={styles.summary_text}>
                        Since Expense Tracker does not connect to the internet, no data is shared with third parties or advertisers.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>Data Retention</Text>
                    <Text style={styles.summary_text}>
                        All your financial records and personal data remain on your device until you delete them. Uninstalling the app may result in data loss.
                    </Text>
                </View>

                <View style={styles.title_summary_view}>
                    <Text style={styles.title_text}>User Rights</Text>
                    <Text style={styles.summary_text}>
                        You have full control over your data. You can delete or modify any information stored in the app at any time.
                    </Text>
                </View>

            </ScrollView>
        </View>
    )
}

export default PrivacyPolicy

const styles = StyleSheet.create({
    container: {
        flex: 1,
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