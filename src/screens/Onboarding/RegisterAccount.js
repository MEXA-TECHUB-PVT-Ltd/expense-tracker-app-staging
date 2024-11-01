import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Pressable, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Checkbox, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import colors from '../../constants/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

const { width: screenWidth } = dimensions;

const RegisterAccount = () => {
    const navigation = useNavigation();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    const [focusedInput, setFocusedInput] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [featureUpdates, setFeatureUpdates] = useState(false);
    const [agree, setAgree] = useState(false);

    const handleLeftIconPress = () => {
        navigation.goBack();
    };

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
        navigation.navigate('About');
    };

    return (
        <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>

            <Appbar.Header style={styles.appBar}>
                <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
                <Appbar.Content
                    title="Register Account"
                    titleStyle={styles.appbar_title} />
                <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
            </Appbar.Header>
            <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
                <TouchableOpacity onPress={handleTooltipPress}>
                    <Text style={styles.tooltipText}>Help</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.infoBox}>
                <Image
                    source={Images.expenseplannerimage}
                    style={styles.infoImage}
                />
                <Text style={styles.infoText}>
                    Envelopes Filled! Register to see your budget on the web, share to your partner’s phone, and get reports too.
                </Text>
            </View>

            <View style={styles.name_input_view}>
                <View style={styles.name_view}>
                    <Text style={styles.name_text}>Email Address</Text>
                </View>
                <View style={styles.input_view}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        mode="flat"
                        placeholder='johnj@email.com'
                        style={[
                            styles.input,
                            focusedInput === 'email' ? styles.focusedInput : {}
                        ]}
                        theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                        textColor={colors.black}
                        dense={true}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>

            <View style={styles.name_input_view}>
                <View style={styles.name_view}>
                    <Text style={styles.name_text}>Password</Text>
                </View>
                <View style={styles.input_view}>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        mode="flat"
                        style={styles.input}
                        theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                        textColor={colors.black}
                        secureTextEntry={true}
                        dense={true}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>

            <View style={styles.name_input_view}>
                <View style={styles.name_view}>
                    <Text style={styles.name_text}>Repeat Password</Text>
                </View>
                <View style={styles.input_view}>
                    <TextInput
                        value={repeatPassword}
                        onChangeText={setRepeatPassword}
                        mode="flat"
                        style={styles.input}
                        theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                        textColor={colors.black}
                        secureTextEntry={true}
                        dense={true}
                        onFocus={() => setFocusedInput('repeatPassword')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>

            <View style={styles.name_input_view}>
                <View style={styles.name_view}>
                    <Text style={styles.name_text}>Yes, email me updates</Text>
                </View>
                <View style={styles.input_view}>
                    <View style={styles.checkboxContainer}>
                        <Checkbox
                            status={featureUpdates ? 'checked' : 'unchecked'}
                            onPress={() => setFeatureUpdates(!featureUpdates)}
                            color={colors.brightgreen}
                        />
                        <Text style={styles.checkboxLabel}>Get feature updates</Text>
                    </View>
                </View>
            </View>


            <View style={styles.name_input_view}>
                <View style={styles.name_view}>
                    <TouchableWithoutFeedback
                    onPress={()=> navigation.navigate('TermsOfUse')}
                    >
                        <Text style={styles.link}>Terms of Use</Text>
                    </TouchableWithoutFeedback>
                </View>
                <View style={styles.input_view}>
                    <View style={styles.checkboxContainer}>
                        <Checkbox
                            status={agree ? 'checked' : 'unchecked'}
                            onPress={() => setAgree(!agree)}
                            color={colors.brightgreen}
                        />
                        <Text style={styles.checkboxLabel}>I agree.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.secondView}>
                <Pressable onPress={()=> console.log('later press')} style={styles.backButton}>
                    {/* <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii" /> */}
                    <Text style={styles.backText}>LATER</Text>
                </Pressable>

                <Pressable onPress={() => console.log('finish press')} style={styles.nextButton}>
                    <Text style={styles.nextText}>FINISH</Text>
                    <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii" />
                </Pressable>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
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
    appBar: {
        backgroundColor: colors.brightgreen,
        height: 55,
    },
    appbar_title: {
        color: colors.white,
        fontSize: hp('2.5%'),
        fontWeight: 'bold',
    },
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

    name_input_view: {
        marginHorizontal: hp('1.3%'),
        flexDirection: 'row',
    },
    name_view: {
        width: hp('18%'),
        justifyContent: 'center',
    },
    name_text: {
        color: colors.gray,
    },
    input_view: {
        flex: 1,
        flexDirection: 'row',
    },
    input: {
        flex: 1,
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
        borderBottomColor: colors.gray,
        paddingHorizontal: 0,
        paddingVertical: 0,
        fontSize: hp('2.5%'),
        color: colors.black,
    },
    focusedInput: {
        borderBottomWidth: 1,
        borderBottomColor: colors.brightgreen,
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: hp('2%'),
        color: colors.black,
    },
    link: {
        color: colors.androidbluebtn,
        textDecorationLine: 'underline',
        fontSize: 14,
        marginBottom: 15,
    },
    secondView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: hp('7%'),
        paddingHorizontal: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
        marginLeft: wp('11%')
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
        marginRight: wp('5%')
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    finishButton: {
        marginLeft: 10,
    },
});

export default RegisterAccount;
