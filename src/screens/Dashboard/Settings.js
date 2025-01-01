import { StyleSheet, Text, View, Animated, Pressable, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useRef } from 'react'
import colors from '../../constants/colors';
import { Appbar, Divider, Checkbox, Dialog, Portal, Modal, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/userSlice';
import { dropTables } from '../../utils/databaseUtils';
import { removeUserData } from '../../utils/authUtils';
import dimensions from '../../constants/dimensions';
import { db } from '../../database/database';
import { initializeDatabase } from '../../database/database';

import RNFS from 'react-native-fs';

const { width: screenWidth } = dimensions;

const About = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const handleLeftIconPress = () => {
        navigation.goBack();
    };

    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;
    const handleRightIconPress = () => {
        toggleTooltip();
    };
    const toggleTooltip = () => {
        if (isTooltipVisible) {
            Animated.timing(slideAnim, {
                toValue: screenWidth,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setIsTooltipVisible(false));
        } else {
            setIsTooltipVisible(true);
            Animated.timing(slideAnim, {
                toValue: screenWidth * 0.5,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };
    const handleOutsidePress = () => {
        if (isTooltipVisible) {
            toggleTooltip();
        }
    };
    const handleTooltipPress = () => {
        toggleTooltip();
        navigation.navigate('Help', { from_settings: true });
    };

    // to take user name and show in logout box
    const user = useSelector((state) => state.user.user);
    // console.log('values inside setting of state user: ' , user);
    const email = user?.email;
    const username = email ? email.split('@')[0] : '';

    // code to logout user and remove its data
    // code for modal logout
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const showLogoutModal = () => setLogoutModalVisible(true);
    const hideLogoutModal = () => setLogoutModalVisible(false);

    // clear check of copying months...
    const clearLastCopyMonth = async () => {
        try {
            await AsyncStorage.removeItem('lastCopyMonth');
            console.log('lastCopyMonth cleared from AsyncStorage.');
        } catch (error) {
            console.error('Error clearing lastCopyMonth:', error);
        }
    };
    // clear check of copying year....
    const clearLastCopyYear = async () => {
        try {
            await AsyncStorage.removeItem('lastCopyYear');
            console.log('lastCopyYear cleared from AsyncStorage.');
        } catch (error) {
            console.error('Error clearing lastCopyYear:', error);
        }
    };
    // clear selected range of income vs spending
    const clearSelectedRange = async () => {
        try {
            await AsyncStorage.removeItem('selectedRange');
            console.log('Selected range cleared from AsyncStorage');
        } catch (error) {
            console.error('Error clearing selected range:', error);
        }
    };
    // clear selected range of spending by envelope
    const clearSelectedRangeSBE = async () => {
        try {
            await AsyncStorage.removeItem('selectedRangeSBE');
            console.log('Selected range cleared from AsyncStorage');
        } catch (error) {
            console.error('Error clearing selected range:', error);
        }
    };

    const handleLogoutOkPress = async () => {
        await removeUserData();
        // for now we can comment them means dont drop tables as we discussed these are 
        // conflicted either we drop them or either keep forgot password functionality

        dropTables();

        initializeDatabase();

        await clearLastCopyMonth(); 
        await clearLastCopyYear();  
        await clearSelectedRange();
        await clearSelectedRangeSBE();

        dispatch(logout());
        // navigation.navigate('Onboarding');  // this is for cross confirmation although it navigates on basis of isAuthenticated state in redux
        setLogoutModalVisible(false);
    };

    // for toogle theme
    const [isChecked, setIsChecked] = useState(false);
    const handleCheckboxToggle = () => {
        setIsChecked(!isChecked);
        // toogling theme code here
    };

    // code for modal clearing default payees
    const [modalVisible, setModalVisible] = useState(false); // State for modal visibility

    // Function to show the modal
    const showModal = () => setModalVisible(true);

    // Function to hide the modal
    const hideModal = () => setModalVisible(false);

    // Function to handle the OK button press
    const handleOkPress = () => {
        console.log('OK pressed');
        clearDefaultPayees();
        hideModal();
    };


    // query to clear default payees
    const clearDefaultPayees = () => {
        db.transaction(tx => {
            tx.executeSql(
                `DELETE FROM Payees WHERE isDefault = 1;`,
                [],
                () => console.log("Default payees cleared successfully"),
                (tx, error) => console.error("Error clearing default payees:", error)
            );
        });
    };


    // function to export database file
    const exportDatabase = async () => {
        try {
            // Path of your internal SQLite database
            const dbPath = '/data/user/0/com.expensetrackerapp/databases/ExpenseTrackerDB.db';

            // External directory path where you want to export the database (e.g., Downloads)
            const externalPath = RNFS.ExternalDirectoryPath + '/ExpenseTrackerDB.db';  // Or use RNFS.DownloadDirectoryPath

            // Check if external directory exists, if not create it
            const exists = await RNFS.exists(RNFS.ExternalDirectoryPath);
            if (!exists) {
                console.log('Creating external directory...');
                await RNFS.mkdir(RNFS.ExternalDirectoryPath);  // Create the directory if it doesn't exist
            }

            // Copy the database file to the external directory
            await RNFS.copyFile(dbPath, externalPath);
            console.log('Database exported successfully to:', externalPath);
        } catch (error) {
            console.error('Error exporting database:', error);
        }
    };



    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
            <View style={styles.container}>
                <Appbar.Header style={styles.appBar}>
                    <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                    <Appbar.Content title="Settings" titleStyle={styles.appbar_title} />
                    <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
                </Appbar.Header>

                <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                    <TouchableOpacity onPress={handleTooltipPress}>
                        <Text style={styles.tooltipText}>Help</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.heading_view}>
                    <Text style={styles.heading_txt}>Account</Text>
                </View>
                <TouchableOpacity
                    onPress={showLogoutModal}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>Log Out</Text>
                    <Text style={styles.subtitle_text}>{username}</Text>
                </TouchableOpacity>
                <Divider />
                <View style={styles.heading_view}>
                    <Text style={styles.heading_txt}>Device</Text>
                </View>
                <TouchableOpacity
                    style={styles.touchable_view}
                    onPress={handleCheckboxToggle}
                >
                    <View style={styles.row}>
                        <View style={styles.textContainer}>
                            <Text style={styles.title_text}>Theme</Text>
                            <Text style={styles.subtitle_text}>Use Dark Theme</Text>
                        </View>
                        <Checkbox
                            status={isChecked ? 'checked' : 'unchecked'}
                            onPress={handleCheckboxToggle}
                            color={colors.brightgreen}
                            uncheckedColor={colors.brightgreen}
                        />
                    </View>
                </TouchableOpacity>
                <Divider />
                <View style={styles.heading_view}>
                    <Text style={styles.heading_txt}>Advanced</Text>
                </View>
                <TouchableOpacity
                    onPress={showModal}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>Clear Default Payees</Text>
                    <Text style={styles.subtitle_text}>Remove default store names</Text>
                </TouchableOpacity>
                <Divider />
                <View style={styles.heading_view}>
                    <Text style={styles.heading_txt}>About</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('TermsAndConditions')}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>Terms & Conditions</Text>
                    <Text style={styles.subtitle_text}>Please budget responsibly.</Text>
                </TouchableOpacity>
                <Divider />
                <TouchableOpacity
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>Privacy Policy</Text>
                    <Text style={styles.subtitle_text}>Your data is safe with us.</Text>
                </TouchableOpacity>
                <Divider />
                <TouchableOpacity
                    onPress={() => navigation.navigate('Help', { from_settings: true })}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>About Goodbudget</Text>
                    <Text style={styles.subtitle_text}>Come say hi.</Text>
                </TouchableOpacity>
                <Divider />

                <TouchableOpacity
                    onPress={exportDatabase}
                    style={styles.touchable_view
                    }>
                    <Text style={styles.title_text}>Export Database</Text>
                    <Text style={styles.subtitle_text}>To export database file as .db file in storage.</Text>
                </TouchableOpacity>
                <Divider />


                <Modal
                    visible={modalVisible}
                    onDismiss={hideModal}
                    contentContainerStyle={styles.modalContainer}
                >
                    <TouchableWithoutFeedback onPress={hideModal}>
                        <View style={styles.modalContainer}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Clear Default Payees</Text>
                                    <Text style={styles.modalText}>This will clear out default Payees. All of your transaction data will be kept. Should I continue?</Text>
                                    <View style={styles.modalButtons}>
                                        <Button
                                            onPress={hideModal}
                                            mode="text"
                                            textColor={colors.androidbluebtn}
                                            rippleColor={colors.gray}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onPress={handleOkPress}
                                            mode="text"
                                            textColor={colors.androidbluebtn}
                                            rippleColor={colors.gray}
                                        >
                                            OK
                                        </Button>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>


                {/* for logout modal */}
                <Modal
                    visible={logoutModalVisible}
                    onDismiss={hideLogoutModal}
                    contentContainerStyle={styles.modalContainer}
                >
                    <TouchableWithoutFeedback onPress={hideLogoutModal}>
                        <View style={styles.modalContainer}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Log Out</Text>
                                    <Text style={styles.modalText}>This will clear out all of your envelopes. All of your data will be lost. Should I continue?</Text>
                                    <View style={styles.modalButtons}>
                                        <Button
                                            onPress={hideLogoutModal}
                                            mode="text"
                                            textColor={colors.androidbluebtn}
                                            rippleColor={colors.gray}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onPress={handleLogoutOkPress}
                                            mode="text"
                                            textColor={colors.androidbluebtn}
                                            rippleColor={colors.gray}
                                        >
                                            OK
                                        </Button>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>





            </View>
        </Pressable>
    )
}

export default About

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

    heading_view: {
        justifyContent: 'center',
        marginTop: hp('1%'),
        marginHorizontal: hp('1.5%'),
        marginVertical: hp('1%'),
    },
    heading_txt: {
        fontSize: hp('2.3%'),
        fontWeight: '500',
        color: colors.brightgreen

    },

    touchable_view: {
        marginHorizontal: hp('1.5%'),
        marginVertical: hp('1.3%'),
    },
    title_text: {
        fontSize: hp('2.4%'),
        fontWeight: '400',
        color: colors.black,
    },
    subtitle_text: {
        fontSize: hp('2.2%'),
        fontWeight: '400',
        color: colors.gray,
    },

    // for theme view
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },

    // for modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: colors.white,
        padding: hp('3.2%'),
        marginHorizontal: hp('3%'),
        borderRadius: hp('0.3%'),
    },
    modalTitle: {
        fontSize: hp('2.5%'),
        fontWeight: '500',
        color: 'black',
    },
    modalText: {
        fontSize: hp('2.1%'),
        color: 'black',
        marginTop: hp('1%'),
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },

})
