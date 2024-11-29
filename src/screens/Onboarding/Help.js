import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import colors from '../../constants/colors';
import Images from '../../constants/images';
import { useNavigation } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRoute } from '@react-navigation/native';

const Help = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { from_transactions, from_accounts, from_reports, from_envelopes, from_fillenvelopes, from_addeditdelete_transaction, from_transactionsearch, from_singleenvelopedetails, from_onboarding, from_setupbudget, from_addeditdelete_envelope, from_setincomeamount, from_registeraccount, from_settings, from_spendbyenvelope, from_envelopetransfer } = route.params || {};
    console.log('value of route in help is: ', route.params);
    const handleLeftIconPress = () => {
        navigation.goBack();
    };
    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content
                    title={(from_reports || from_onboarding || from_addeditdelete_envelope || from_setincomeamount || from_settings || from_spendbyenvelope) ? "About ExpenseTracker" : "Help"}
                    titleStyle={styles.appbar_title} />
            </Appbar.Header>

            {!(from_reports || from_onboarding || from_addeditdelete_envelope || from_setincomeamount || from_settings || from_spendbyenvelope) && (
                <View style={styles.infoBox}>
                    <Image
                        source={Images.expenseplannerimage}
                        style={styles.infoImage}
                    />
                    {from_envelopes && (
                        <Text style={styles.infoText}>
                            The key to staying on budget is knowing what you really have available to spend.
                        </Text>
                    )}
                    {(from_transactions || from_transactionsearch || from_singleenvelopedetails) && (
                        <Text style={styles.infoText}>
                            How are you doing with tracking everything?
                        </Text>
                    )}
                    {from_accounts && (
                        <Text style={styles.infoText}>
                            Make everything in your life match up!
                        </Text>
                    )}
                    {from_fillenvelopes && (
                        <Text style={styles.infoText}>
                            Let's put some money in your envelopes!
                        </Text>
                    )}
                    {from_addeditdelete_transaction && (
                        <Text style={styles.infoText}>
                            Record at point-of-sale so you don't forget any transactions!
                        </Text>
                    )}
                    {from_setupbudget && (
                        <Text style={styles.infoText}>
                            Make changes to your envelopes!
                        </Text>
                    )}
                    {from_registeraccount && (
                        <Text style={styles.infoText}>
                            I need some info so that i can create your ExpenseTracker account.
                        </Text>
                    )}
                    {from_envelopetransfer && (
                        <Text style={styles.infoText}>
                            Let's move some money around.
                        </Text>
                    )}
                </View>
            )}

            {from_envelopes && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Envelope Summary
                        </Text>
                        <Text style={styles.summary_text}>
                            Each envelope shows the balance remaining. The status bars show how 'full' (or un-full...) your envelope is. {'\n'}{'\n'}
                            Tap the envelope bars to see a list of transactions in that envelope. From there you can edit a transaction. {'\n'}{'\n'}
                            To control the order of the envelopes on this screen, find 'Edit Envelopes' in the overflow menu or visit the website and drag and drop the envelopes on the Add/ Edit Envelopes page.
                        </Text>
                    </View>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            What's the little black line?
                        </Text>
                        <Text style={styles.summary_text}>
                            When your budgeting period is set to monthly, weekly, or semi-monthly, the black line on the expanded view shows you where 'today' is.{'\n'}{'\n'}
                            If the green bar is to the right of the black line, you're on target! If not, time to play catch up...{'\n'}{'\n'}
                            You can change your budgeting period in Settings.
                        </Text>
                    </View>
                </>
            )}

            {(from_transactions || from_transactionsearch || from_singleenvelopedetails) && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Transaction History
                        </Text>
                        <Text style={styles.summary_text}>
                            This screen lists all transaction history within a particular envelope. Scroll down the items and press on a particular transaction in order to view/edit its details.{'\n'}{'\n'}
                            To look for a particular transaction, Search!
                        </Text>
                    </View>
                </>
            )}

            {from_accounts && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Account Summary
                        </Text>
                        <Text style={styles.summary_text}>
                            Each account shows the current balance. For bank accounts and cash, this should be the amount you currently have in the account. For credit cards, this should be your current balance on the card.{'\n'}{'\n'}
                            Tap the account name to see a list of recent transactions for that account.
                        </Text>
                    </View>
                </>
            )}

            {(from_reports || from_onboarding || from_addeditdelete_envelope || from_setincomeamount || from_settings || from_spendbyenvelope) && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            About ExpenseTracker
                        </Text>
                        <Text style={styles.summary_text}>
                            ExpenseTracker is a personal envelope budgeting system designed to help you manage your finances. It allows you to track and categorize your spending while staying in full control of your budget. With ExpenseTracker, your data is stored locally on your device, ensuring privacy and security.
                        </Text>
                    </View>
                    <View style={styles.features_view}>
                        <Text style={styles.feature_text}>
                            ExpenseTracker features:
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>Safe and secure: </Text>Your data is stored locally on your device, with no need for online services or cloud storage.
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>Offline accessibility: </Text>Access and manage your finances anytime, even without an internet connection.
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>Customizable envelopes: </Text>Create and manage custom categories for your income and expenses, and allocate funds to different envelopes.
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>Easy-to-use interface: </Text>Intuitive design that makes tracking your spending simple and straightforward.
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>Detailed expense tracking: </Text>View detailed reports of your spending habits and make informed decisions about your budget.
                        </Text>
                        <Text style={styles.feature_summary_text}>
                            <Text style={styles.sub_Heading}>No subscriptions or sign-ups:</Text> ExpenseTracker is a completely offline app, so you don't need to worry about signing up or subscribing to any services.
                        </Text>
                    </View>

                </>
            )}

            {from_fillenvelopes && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Fill All Envelopes
                        </Text>
                        <Text style={styles.summary_text}>
                            Selecting Fill All Envelopes will fill all envelopes with the same amount as monthly budged amount for that envelope. {'\n'}{'\n'}
                            For example, if an envelope has monthly budged amount of 20, selecting fill all will fill envelope with 20.
                        </Text>
                    </View>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Fill Individually
                        </Text>
                        <Text style={styles.summary_text}>
                            Selecting Fill Individually will allow you to fill each Envelope with a different amount. {'\n'}{'\n'}
                            For example, if an Envelope has monthly budged amount of 15, selecting fill individually will allow you to fill Envelope with 5, 10, 20 or some other amount.
                        </Text>
                    </View>
                </>
            )}

            {from_addeditdelete_transaction && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Recording a transaction
                        </Text>
                        <Text style={styles.summary_text}>
                            <Text style={styles.subtitle_text}>Payees:</Text> ExpenseTracker will suggest recent Payees that you've entered. Also, if you record at point-of-sale ExpenseTracker will help you the next time by suggesting Payees you've used that are located near where you are. {'\n'}{'\n'}
                            <Text style={styles.subtitle_text}>Refunds, returns:</Text> Use the Expense/Credit toggle to record these.
                        </Text>
                    </View>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Editing a transaction
                        </Text>
                        <Text style={styles.summary_text}>
                            Allows you to edit same transaction by tapping on it. Instead of deleting and adding a new transaction, you can just edit the existing one.
                        </Text>
                    </View>
                </>
            )}

            {from_setupbudget && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Edit Envelopes
                        </Text>
                        <Text style={styles.summary_text}>
                            Make new Envelopes, edit existing ones, or delete them on this screen.{'\n'}{'\n'}
                            You can also change your Envelope order, budget period, or budget amount. Then you can change the current balance in your Envelopes by going to the Fill Envelopes screen.
                        </Text>
                    </View>
                </>
            )}

            {from_registeraccount && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Registering for ExpenseTracker
                        </Text>
                        <Text style={styles.summary_text}>
                            Choose a username that your account will use to log in and choose a password.{'\n'}{'\n'}
                            You'll need to enter an email so that you can recover your password. Also, ExpenseTracker is getting new features frequently, so if you want to make sure you find out about them, make sure to check the opt-in box.{'\n'}{'\n'}
                            We do NOT sell or give away your personal information.
                        </Text>
                    </View>
                </>
            )}

            {from_envelopetransfer && (
                <>
                    <View style={styles.title_summary_view}>
                        <Text style={styles.title_text}>
                            Envelope Transfer
                        </Text>
                        <Text style={styles.summary_text}>
                            You can transfer money from one envelope to another.
                        </Text>
                    </View>
                </>
            )}

        </View>
    )
}

export default Help;

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

    // image and text box
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.lightGray,
        paddingHorizontal: hp('1.2%'),
        paddingVertical: hp('0.8%'),
        marginHorizontal: hp('1.3%'),
        marginVertical: hp('1.3%'),
    },
    infoImage: {
        resizeMode: 'contain',
        width: wp('11%'),
        height: hp('7%'),
    },
    infoText: {
        flex: 1,
        paddingHorizontal: hp('2%'),
        fontSize: hp('1.8%'),
        color: colors.black,
    },

    // title and summary
    title_summary_view: {
        marginHorizontal: hp('1.3%'),
        paddingRight: hp('1%'),
        marginVertical: hp('2%'),
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

    // features view
    features_view: {
        marginHorizontal: hp('1.3%'),
        paddingRight: hp('1%'),
        marginVertical: hp('2%'),
    },
    feature_text: {
        fontSize: hp('2.1%'),
        fontWeight: 'bold',
        color: colors.black,
    },
    feature_summary_text: {
        fontSize: hp('1.9%'),
        color: colors.black,
        fontWeight: '400',
        marginTop: hp('1%'),
        marginLeft: hp('1%'),
    },
    sub_Heading: {
        fontSize: hp('2%'),
        fontWeight: '600',
        color: colors.black,
        marginTop: hp('2%'),
    },
})