import React, { useState, useRef } from 'react';
import { Image, StyleSheet, Text, View, Pressable, Animated, TouchableOpacity } from 'react-native';
import { FAB, Modal, Portal } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { VectorIcon } from '../constants/vectoricons';
import Images from '../constants/images';
import colors from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import dimensions from '../constants/dimensions';

const { width: screenWidth } = dimensions;

const DashboardAppBar = ({ selectedTab, setIsSearched, setSearchModalVisible }) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const handleEnvelopeTransfer = () => {
        navigation.navigate('EnvelopeTransfer');
        closeMenu();
    }

    const user = useSelector((state) => state.user.user);
    const email = user?.email;
    const username = email ? email.split('@')[0] : '';

    const handleEnvelopePress = () => {
        navigation.navigate('FillEnvelopes', {
            fill_envelope: true,
        });
    };

    const handleSearchPress = () => {
        setIsSearched(true);
        setSearchModalVisible(true); 
    };

    // code for menu
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [trMenuVisible, setTrMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    const openMenuTr = () => setTrMenuVisible(true);
    const closeMenuTr = () => setTrMenuVisible(false);

    const handleRightIconPress = () => {
        if (isMenuVisible) {
            closeMenu(); // close if menu is open
        } else {
            openMenu();  // open if menu is closed
        }
    };

    const handleRightIconTrPress = () => {
        if (trMenuVisible) {
            closeMenuTr(); // close if menu is open
        } else {
            openMenuTr();  // open if menu is closed
        }
    };

    const handleMenuOptionPress = (screen) => {
        closeMenu();
        closeMenuTr();

        // Define the source prop based on the selected tab
        let tabSource = {};
        if (screen === 'Help') {
            switch (selectedTab) {
                case 'Transactions':
                    tabSource = { from_transactions: true };
                    break;
                case 'Accounts':
                    tabSource = { from_accounts: true };
                    break;
                case 'Reports':
                    tabSource = { from_reports: true };
                    break;
                default:
                    break;
            }
        }

        navigation.navigate(screen, tabSource);
    };

    const renderDynamicIcons = () => {
        switch (selectedTab) {
            case 'Envelopes':
                return (
                    <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                        <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                    </TouchableOpacity>
                );
            case 'Transactions':
                return (
                    <>
                        <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                            <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSearchPress} style={styles.iconSpacing}>
                            <VectorIcon name="search" size={20} color="white" type="ii" />
                        </TouchableOpacity>
                    </>
                );
            case 'Accounts':
                return (
                    <TouchableOpacity onPress={handleEnvelopePress} style={styles.iconSpacing}>
                        <VectorIcon name="envelope-open-text" size={20} color="white" type="fa6" />
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const handleThreeDotsPress = () => {
        switch (selectedTab) {
            case 'Envelopes':
                handleRightIconPress();
                break;
            case 'Transactions':
                handleRightIconTrPress();
                break;
            case 'Accounts':
                handleRightIconTrPress();
                break;
            case 'Reports':
                handleRightIconTrPress();
                break;
            default:
                break;
        }
    };

    return (
        <Pressable 
        // onPress={handleOutsidePress}
        >
            <View style={styles.container}>
                <View style={styles.leftContainer}>
                    <Image source={Images.expenseplannerimage} style={styles.profileImage} />
                    <Text style={styles.username}>{username}</Text>
                </View>
                <View style={styles.iconContainer}>
                    {renderDynamicIcons()}
                </View>
                <TouchableOpacity style={styles.three_dots_view} onPress={handleThreeDotsPress}>
                    <VectorIcon name="dots-vertical" size={24} color="white" type="mci" />
                </TouchableOpacity>
            </View>
            {/* <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View> */}

            {/* Full-Screen Overlay with Menu Options */}
            <Portal>
                <Modal
                    visible={isMenuVisible}
                    onDismiss={closeMenu} // Ensures the menu closes on overlay and back press
                    contentContainerStyle={{
                        backgroundColor: 'transparent',
                    }}
                    theme={{
                        colors: {
                            backdrop: 'transparent', // Sets the background overlay color to transparent
                        },
                    }}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={closeMenu} // Close the menu when overlay is pressed
                        activeOpacity={0}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity
                                onPress={() => {
                                    closeMenu();
                                    navigation.navigate('SetupBudget', { envelope_prop: true });
                                }}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Edit Envelopes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleEnvelopeTransfer}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Envelope Transfer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    closeMenu();
                                    navigation.navigate('Help', { from_envelopes: true });
                                }}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Help</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    closeMenu();
                                    navigation.navigate('Settings', { from_envelopes: true });
                                }}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </Portal>

            {/* transactions and report menu */}
            <Portal>
                <Modal
                    visible={trMenuVisible}
                    onDismiss={closeMenuTr}
                    contentContainerStyle={{
                        backgroundColor: 'transparent',
                    }}
                    theme={{
                        colors: {
                            backdrop: 'transparent',
                        },
                    }}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={closeMenuTr}
                        activeOpacity={0}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity
                                onPress={() => handleMenuOptionPress('Help')}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Help</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleMenuOptionPress('Settings')}
                                style={styles.menuOption}
                            >
                                <Text style={styles.menuText}>Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </Portal>

        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        height: hp('8%'),
        backgroundColor: colors.brightgreen,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: hp('5%'),
        height: hp('5%'),
        marginRight: hp('2%'),
        marginLeft: hp('2%'),
        resizeMode: 'contain',
    },
    username: {
        color: 'white',
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
    iconContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    iconSpacing: {
        marginHorizontal: wp('2%'),
    },
    three_dots_view: {
        marginLeft: hp('0%'),
    },

    // tooltip styles
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

    // menu styles
    overlay: {
        flex: 1,
        // backgroundColor: 'transparent',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    menuContainer: {
        width: 170,
        backgroundColor: '#fff',
        padding: 5,
        position: 'absolute',
        right: wp('3%'),
        top: hp('-49%'),  
    },
    menuOption: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },

});

export default DashboardAppBar;
