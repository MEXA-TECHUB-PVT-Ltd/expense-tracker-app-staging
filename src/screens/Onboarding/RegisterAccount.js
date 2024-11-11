import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Pressable, TouchableOpacity } from 'react-native';
import { Appbar, TextInput, Checkbox, Button, Modal, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import colors from '../../constants/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Images from '../../constants/images';
import dimensions from '../../constants/dimensions';
import { VectorIcon } from '../../constants/vectoricons';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import bcrypt from 'react-native-bcrypt';
import { db, fetchUsers } from '../../database/database';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/userSlice';
import { saveUserData } from '../../utils/authUtils';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

const { width: screenWidth } = dimensions;

// code for formik validation
const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string()
        .min(8, '* minimum 8 characters long')
        .matches(/[A-Z]/, '* at least 1 uppercase letter')
        .matches(/[0-9]/, '* at least one number')
        .matches(/[@$!%*?&]/, '*at least 1 special character')
        .required('Password is required'),
    repeatPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Repeat Password is required'),
});

const RegisterAccount = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    const [focusedInput, setFocusedInput] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [featureUpdates, setFeatureUpdates] = useState(false);
    const [agree, setAgree] = useState(false);

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [laterModel, setLaterModel] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({});
    const showErrorModal = (title, message, image) => {
        setModalContent({ title, message, image });
        setShowModal(true);
    };

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

    // transaction for register user
    const registerUser = async (email, password, featureUpdates) => {
        console.log('Registering user with values:', { email, password, featureUpdates });
        // Generate a salt and hash the password
        const salt = bcrypt.genSaltSync(3); // Generate salt with 3 rounds strengthening it
        const hashedPassword = bcrypt.hashSync(password, salt); // convert plain text password to hashed

        db.transaction(tx => {
            tx.executeSql(
                'INSERT INTO Users (email, password, featureUpdates) VALUES (?, ?, ?)',
                [email, hashedPassword, featureUpdates ? 1 : 0],
                async () => {
                    console.log('User registered successfully');
                    console.log('Registered user values:', { email, hashedPassword, featureUpdates });
                    setSnackbarVisible(true);

                    // Dispatch the user details to Redux
                    dispatch(setUser({ email }));
                    // navigation.navigate('TopTab');
                    try {
                        await saveUserData({ email, isAuthenticated: true });
                        console.log('User data saved to Async Storage');
                        // navigation.navigate('TopTab'); // Navigate to Dashboard or TopTab if needed
                    } catch (error) {
                        console.error('Error saving user data to Async Storage:', error);
                    }
                },
                error => console.error('Error registering user:', error)
            );
        });
    };

    const handleFinishPress = async (values, { setFieldError, validateForm }) => {

        // console.log('values input from formik: ', values);
        const errors = await validateForm();

        // If Formik has any validation errors, don't proceed
        if (Object.keys(errors).length > 0) {
            // You can set specific field errors if needed
            Object.keys(errors).forEach((field) => {
                setFieldError(field, errors[field]);
            });
            return; // Stops execution if there are validation errors
        }

        // to log all registered users 
        // fetchUsers();
        // Check if all fields are filled
        // if (!email || !password || !repeatPassword) {
        //     showErrorModal(
        //         'Oops!',
        //         'Please make sure all fields are filled in and your passwords match.',
        //         Images.expenseplannerimagegray
        //     );
        //     return;
        // }
        // Check if passwords match
        // if (password !== repeatPassword) {
        //     showErrorModal(
        //         'Oops!',
        //         'Please make sure all fields are filled in and your passwords match.',
        //         Images.expenseplannerimagegray
        //     );
        //     return;
        // }
        // Check if agreement is accepted or not
        if (!agree) {
            setModalContent({
                title: 'Terms of Use',
                message: (
                    <>
                        To use this app you must agree to the ExpenseTracker{' '}
                        <Text style={styles.termsText} onPress={navigateToTermsOfUse}>
                            Terms of Use
                        </Text>.
                    </>
                ),
                image: Images.expenseplannerimage,
                isTerms: true,
            });
            setShowModal(true);
            return;
        }
        // Check if email already exists
        checkEmailExists(values.email, values.password, values.featureUpdates);
    };

    // transaction to check if email already exists to avoid same user registration
    const checkEmailExists = (email, password, featureUpdates) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Users WHERE email = ?',
                [email],
                (tx, results) => {
                    if (results.rows.length > 0) {
                        showErrorModal(
                            'Sorry!',
                            'I already have an account with that email. Can I interest you in another?',
                            Images.sorryet,
                        );
                    } else {
                        // Proceed with registration
                        // console.log('before registrUser is called input values are :', email, password, featureUpdates);
                        registerUser(email, password, featureUpdates);
                    }
                },
                error => console.error('Error checking email:', error)
            );
        });
    };

    const handleAgreePress = () => {
        setAgree(true);
        setShowModal(false);
    };

    const handleCancelPress = () => {
        setShowModal(false);
    };

    const navigateToTermsOfUse = () => {
        navigation.navigate('TermsOfUse');
        setShowModal(false);
    };

    const handleLaterPress = () => {
        setLaterModel(true);
    };
    const handleLaterCancel = () => {
        setLaterModel(false);
    };
    const handleLaterAgree = () => {
        console.log('agree pressed');
        // setAgree(true);
        // setLaterModel(false);
        // navigation.navigate('TopTab');
        // navigation.navigate('FillEnvelopes');
    };


    return (
        <Pressable style={{ flex: 1, backgroundColor: colors.white }} onPress={handleOutsidePress}>
            <Formik
                initialValues={{ email: '', password: '', repeatPassword: '' }}
                validationSchema={validationSchema}
                // onSubmit={(values) => handleFinishPress(values)}
                onSubmit={handleFinishPress}
            >
                {({ handleChange, handleBlur, handleSubmit, values, errors, validateForm, touched }) => (
                    <View style={{ flex: 1 }}>
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
                                <View style={styles.TextInput_view}>
                                    <TextInput
                                        value={values.email}
                                        // onChangeText={setEmail}
                                        onChangeText={handleChange('email')}
                                        onBlur={handleBlur('email')}
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
                                    // onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                                <View style={styles.error_view}>
                                    {touched.email && errors.email && (
                                        <Text style={styles.error}>{errors.email}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.name_input_view}>
                            <View style={styles.name_view}>
                                <Text style={styles.name_text}>Password</Text>
                            </View>
                            <View style={styles.input_view}>
                                <View style={styles.TextInput_view}>
                                <TextInput
                                    value={values.password}
                                    // onChangeText={setPassword}
                                    onChangeText={handleChange('password')}
                                    onBlur={handleBlur('password')}
                                    mode="flat"
                                    style={styles.input}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    secureTextEntry={true}
                                    dense={true}
                                    onFocus={() => setFocusedInput('password')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                                </View>
                                <View style={styles.error_view}>
                                {touched.password && errors.password && (
                                    <Text style={styles.error}>{errors.password}</Text>
                                )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.name_input_view}>
                            <View style={styles.name_view}>
                                <Text style={styles.name_text}>Repeat Password</Text>
                            </View>
                            <View style={styles.input_view}>
                                <View style={styles.TextInput_view}>
                                <TextInput
                                    value={values.repeatPassword}
                                    // onChangeText={setRepeatPassword}
                                    onChangeText={handleChange('repeatPassword')}
                                    onBlur={handleBlur('repeatPassword')}
                                    mode="flat"
                                    style={styles.input}
                                    theme={{ colors: { primary: focusedInput ? colors.brightgreen : colors.gray } }}
                                    textColor={colors.black}
                                    secureTextEntry={true}
                                    dense={true}
                                    onFocus={() => setFocusedInput('repeatPassword')}
                                // onBlur={() => setFocusedInput(null)}
                                />
                                </View>
                                <View style={styles.error_view}>
                                {touched.repeatPassword && errors.repeatPassword && (
                                    <Text style={styles.error}>{errors.repeatPassword}</Text>
                                )}
                                </View>
                            </View>
                        </View>

                        {/* <Button
                            mode="contained"
                            title="Finish"
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        /> */}


                        {/* <View style={styles.name_input_view}>
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
                        </View> */}

                        <View style={styles.name_input_view}>
                            <View style={styles.name_view}>
                                <TouchableWithoutFeedback
                                    onPress={() => navigation.navigate('TermsOfUse')}
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
                            <View style={styles.left_icon_btn_view}>
                                {/* <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii" /> */}
                                {/* <Button
                                    mode="text"
                                    onPress={handleLaterPress}
                                    // onPress={() => console.log('later press')}
                                    style={styles.backButton}
                                    labelStyle={styles.backText}
                                    rippleColor={colors.gray}
                                >
                                    LATER
                                </Button> */}
                            </View>
                            <View style={styles.right_icon_btn_view}>
                                <Button
                                    mode="text"
                                    // onPress={handleFinishPress}
                                    // onPress={() => navigation.navigate('TopTab')}
                                    onPress={handleSubmit}
                                    // onPress={() => handleFinishPress(values, errors, validateForm)}
                                    style={styles.nextButton}
                                    labelStyle={styles.nextText}
                                    rippleColor={colors.gray}
                                >
                                    FINISH
                                </Button>
                                <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii" />
                            </View>
                        </View>

                        <Modal visible={showModal} onDismiss={handleCancelPress} contentContainerStyle={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.img_title_view}>
                                    <Image source={modalContent.image} style={styles.image} />
                                    <Text style={styles.modalTitle}>{modalContent.title}</Text>
                                </View>

                                <Text style={styles.modalMessage}>{modalContent.message}</Text>
                                <View style={styles.modalButtons}>
                                    {modalContent.isTerms ? (
                                        <>
                                            <TouchableOpacity onPress={handleCancelPress}>
                                                <Text style={styles.cancelButton}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleAgreePress}>
                                                <Text style={styles.agreeButton}>I Agree</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <Button
                                            mode="text"
                                            onPress={handleCancelPress}
                                            labelStyle={styles.ok_btn}
                                        >
                                            OK
                                        </Button>
                                    )}
                                </View>
                            </View>
                        </Modal>

                        <Snackbar
                            visible={snackbarVisible}
                            onDismiss={() => setSnackbarVisible(false)}
                            duration={3000}
                            style={styles.snack_bar}
                        >
                            <View style={styles.img_txt_view}>
                                <Image
                                    source={Images.expenseplannerimage}
                                    style={styles.snack_bar_img}
                                />
                                <Text style={styles.snack_bar_text}>User registered successfully!</Text>
                            </View>
                        </Snackbar>

                        <Modal visible={laterModel} onDismiss={handleLaterCancel} contentContainerStyle={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.img_title_view}>
                                    <Image source={Images.expenseplannerimage} style={styles.image} />
                                    <Text style={styles.modalTitle}>Terms of Use</Text>
                                </View>

                                <Text style={styles.modalMessage}>
                                    To use this app you must agree to the ExpenseTracker { }
                                    <Text style={styles.termsText} onPress={navigateToTermsOfUse}>
                                        Terms of Use
                                    </Text>.</Text>
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity onPress={handleLaterCancel}>
                                        <Text style={styles.cancelButton}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleLaterAgree}>
                                        <Text style={styles.agreeButton}>I Agree</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                    </View>
                )}
            </Formik>
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

    // registration form styles
    name_input_view: {
        height: hp('8%'),
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
    },
    TextInput_view: {
        flex: 1,
    },
    input: {
        flex: 1,
        height: hp('5%'),
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
    error_view: {
        height: hp('2.5%'),
        justifyContent: 'center',
    },
    error: {
        color: 'red',
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
        paddingHorizontal: hp('3%'),
        marginHorizontal: hp('3%'),
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    left_icon_btn_view: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    right_icon_btn_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    backText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
    },
    nextText: {
        fontSize: hp('2%'),
        color: colors.androidbluebtn,
    },

    //modal styles
    modalContainer: {
        backgroundColor: colors.white,
        padding: hp('2%'),
        margin: hp('3.5%'),
    },
    modalContent: {
        alignItems: 'flex-start',
        paddingHorizontal: hp('1.5%'),
    },
    img_title_view: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    image: {
        width: hp('4%'),
        height: hp('4%'),
        resizeMode: 'contain',
    },
    modalTitle: {
        color: colors.black,
        fontSize: hp('2.5%'),
        fontWeight: '600',
        marginLeft: hp('1%'),
    },
    modalMessage: {
        fontSize: hp('2%'),
        fontWeight: '400',
        color: colors.black,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginVertical: hp('1.8%'),
    },
    ok_btn: {
        color: colors.androidbluebtn,
    },
    cancelButton: {
        color: colors.androidbluebtn,
        marginRight: hp('7%'),
    },
    agreeButton: {
        color: colors.androidbluebtn,
        marginRight: hp('2.5%'),
    },
    termsText: {
        color: colors.androidbluebtn,
        textDecorationLine: 'underline',
    },

    snack_bar: {
        backgroundColor: colors.gray,
        borderRadius: 50,
    },
    img_txt_view: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    snack_bar_img: {
        width: wp('10%'),
        height: hp('3%'),
        marginRight: 10,
        resizeMode: 'contain',
    },
    snack_bar_text: {
        color: colors.white,
        fontSize: hp('2%'),
    },

});

export default RegisterAccount;
