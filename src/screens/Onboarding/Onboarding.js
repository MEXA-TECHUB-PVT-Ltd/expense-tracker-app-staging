import { StyleSheet, Text, View, StatusBar, Animated, Alert, BackHandler, TouchableOpacity, Image, Pressable, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useRef } from 'react'
import colors from '../../constants/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import Images from '../../constants/images';
import { VectorIcon } from '../../constants/vectoricons';
import { Appbar, Button, Portal, Modal, TextInput, Snackbar } from 'react-native-paper';
import dimensions from '../../constants/dimensions';
import { db, fetchUsers } from '../../database/database';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/userSlice';
import { saveUserData } from '../../utils/authUtils';
import bcrypt from 'react-native-bcrypt';
import { useFormik, Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const { width: screenWidth } = dimensions;

// Validation schema for login modal
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

// Validation schema for forgot password
const validationSchemaFP = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
});

// validation schema for otp
const validationSchemaOTP = Yup.object({
  otp: Yup.string()
    .length(4, 'OTP must be exactly 4 digits')
    .matches(/^\d{4}$/, 'OTP must be a valid 4-digit number')
    .required('OTP is required'),
});

// validation schema for reset password modal
const validationSchemaRP = Yup.object().shape({
  rPassword: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
  rConfirmPassword: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('rPassword')], 'Passwords do not match'),
});

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [centerModalVisible, setCenterModalVisible] = useState(false);

  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const toggleModal = () => {
    setForgotPasswordModal(!forgotPasswordModal);
  };

  const [confirmationModal, setConfirmationModal] = useState(false);
  const toggleConfirmationModal = () => setConfirmationModal(!confirmationModal);

  const [focusedInput, setFocusedInput] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarVisiblePassword, setSnackbarVisiblePassword] = useState(false);
  const [snackbarLoginVisible, setSnackbarLoginVisible] = useState(false);


  const handleLeftIconPress = () => {
    BackHandler.exitApp();
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
    navigation.navigate('Help', { from_onboarding: true });
  };

  const handleCancelPress = () => {
    setCenterModalVisible(false);
    setEmail('');
    setPassword('');
  };

  const handleCreateNewHousehold = () => {
    // navigation.navigate('SetupBudget');
    navigation.navigate('SetupBudget', { fromOnboarding: true });
  };

  const handleLogin = (values) => {
    loginUser(values.email, values.password);
    setEmail('');
    setPassword('');
  };


  const loginUser = (email, password) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id, password FROM Users WHERE email = ?',
        [email],
        (tx, results) => {
          if (results.rows.length > 0) {
            const { id: user_id, password: hashedPassword } = results.rows.item(0);

            // Compare the hashed password with the entered password
            const isPasswordValid = bcrypt.compareSync(password, hashedPassword);

            if (isPasswordValid) {
              setCenterModalVisible(false);

              // Dispatch the user details and user_id to Redux
              dispatch(setUser({ email, user_id }));

              console.log('Login successful');

              // Save the user data to Async Storage
              saveUserData({ email, user_id, isAuthenticated: true })
                .then(() => console.log('User data saved to Async Storage'))
                .catch(error => console.error('Error saving user data to Async Storage:', error));

              // Navigate to the TopTab screen
              navigation.navigate('TopTab');

            } else {
              console.log('Invalid password');
              setSnackbarVisiblePassword(true);
            }
          } else {
            console.log('Login failed. Please try again.');
            setSnackbarVisible(true);
          }
        },
        error => console.error('Error fetching user for login:', error)
      );
    });
  };


  // code that will call our forgot password api

  const [newPassword, setNewPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  console.log('saved eamil against which we will update password:', savedEmail);

  const handleResetPassword = async (values) => {
    console.log('email at which we want to send otp is: ', values);
    await sendResetEmail(values.email);
    setSavedEmail(values.email);
  };

  const sendResetEmail = async (email) => {
    console.log('email at which we want to send otp is: ', email);
    try {
      const response = await axios.post(
        'https://expense-planner-be.caprover-demo.mtechub.com/forgot-password',
        { email }
      );

      if (response.data.success) {
        console.log('OTP sent to your email.');
        setForgotPasswordModal(false);
        setIsOtpModalVisible(true);
        // setConfirmationModal(true);
      } else {
        console.log(response.data.message || 'Failed to send OTP.');
      }
    } catch (error) {
      // console.error('Network Error:', error.response || error.message || error);
      console.log('Something went wrong while sending OTP or Network Error.');
      // setForgotPasswordModal(false);
      // setIsOtpModalVisible(true);
    }
  };


  // second api call it on verify otp button after inpputing otp sent in email, if otp verified then show modal reset password...

  // function to show otp modal
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [snackbarVisibleInvalidPassword, setSnackbarVisibleInvalidPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const refs = useRef([]); // Initialize refs array for inputs

  const handleOkPress = () => {
    toggleConfirmationModal();
    setIsOtpModalVisible(true);
  };

  // function to call verify otp api
  const handleVerifyOTP = async (otp) => {
    try {
      const response = await axios.post('https://expense-planner-be.caprover-demo.mtechub.com/verify-otp', { otp });
      console.log(response.data);
      if (response.data.success) {
        setIsOtpModalVisible(false);
        resetOtpValues();
        setResetModalVisible(true);
      } else {
        console.log('Invalid OTP:', response.data.message);
        setSnackbarVisibleInvalidPassword(true);
      }
    } catch (error) {
      // console.error('Error verifying OTP:', error);
      console.log('Failed to verify OTP. or AxiosError: Network Error');
    }
  };

  const resetOtpValues = () => {
    setOtp(['', '', '', '']); // Reset OTP state to an empty array for all 4 digits
  };

  const handleOTPCancelPress = () => {
    setIsOtpModalVisible(false);
  };


  // after otp is verified show modal to reset password then after entering new password and confirm new password on update password button call this transaction
  // remember to convert plain text password into hash password then update in users table against this email

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [snackbarUpdatePassword, setSnackbarUpdatePassword] = useState(false);

  const updatePassword = async (newPassword) => {
    try {
      // Log the email and plain newPassword
      console.log('Updating password for email:', savedEmail);
      console.log('New password (plain):', newPassword);

      // Generate a salt and hash the password using bcrypt (3 rounds here)
      const salt = bcrypt.genSaltSync(3); // Generate salt with 3 rounds
      const hashedPassword = bcrypt.hashSync(newPassword, salt); // Hash the password

      // Log the hashed password (for debugging purposes)
      console.log('Hashed password:', hashedPassword);

      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM Users WHERE email = ?',
          [savedEmail],
          (tx, results) => {
            if (results.rows.length > 0) {
              console.log('Email found in database:', savedEmail);
            } else {
              console.log('Email not found in database:', savedEmail);
            }
          },
          (error) => {
            console.error('Error selecting email:', error);
          }
        );
      });

      // Now update the password in the database
      db.transaction((tx) => {
        tx.executeSql(
          `UPDATE Users SET password = ? WHERE email = ?`, // Update query
          [hashedPassword, savedEmail], // Pass the hashed password to update query
          (tx, results) => {
            if (results.rowsAffected > 0) {
              setResetModalVisible(false);
              setSnackbarUpdatePassword(true);
            } else {
              Alert.alert('Error', 'Failed to update password in the database.');
            }
          },
          (error) => {
            console.error(error);
            Alert.alert('Error', 'Database error.');
          }
        );
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while updating the password.');
    }
  };

  


  return (
    <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.munsellgreen} />
        <Appbar.Header style={styles.appBar}>
          {/* <Appbar.BackAction onPress={handleLeftIconPress} color={colors.black} /> */}
          <Appbar.Content title="ExpensePlanner" titleStyle={styles.appbar_title} />
          <Appbar.Action icon="dots-vertical" onPress={handleRightIconPress} color={colors.white} />
        </Appbar.Header>
        <View style={styles.image_name_container}>
          <Image
            source={Images.expenseplannerimage}
            style={styles.image}
          />
          <View style={styles.text_container}>
            <View style={styles.ep_tm_text_view}>
              <Text style={styles.ep_text}>Expense Planner</Text>
              <Text style={styles.tm_text}>TM</Text>
            </View>
            <Text style={styles.slogen_text}>Budget well. Live life. Do good.</Text>
          </View>
        </View>
        <Text style={styles.haveExpenseApp_text}>Have ExpensePlanner Account?</Text>
        <View style={styles.btn_view}>
          <Button
            mode="contained"
            onPress={setCenterModalVisible}
            style={styles.buttonbody}
            textColor={colors.white}
            labelStyle={styles.addIncome_label}
          >
            LOG IN
          </Button>
        </View>
        <Text style={styles.haveExpenseApp_text}>New to ExpensePlanner?</Text>
        <View style={styles.btn_view}>
          <Button
            mode="contained"
            onPress={handleCreateNewHousehold}
            style={styles.buttonbody}
            textColor={colors.white}
            labelStyle={styles.addIncome_label}
          >
            CREATE NEW ACCOUNT
          </Button>
        </View>
        {/* <View style={styles.icon_text}>
          <VectorIcon name="lock" size={24} color={colors.gray} type="mi" />
          <Text style={styles.secured_text}>Secured using bank-grade 256-bit SSL</Text>
        </View> */}
        {/* <View style={styles.icon_text}>
          <Text style={styles.secured_text}>Version 2.16 (180)</Text>
        </View> */}
        <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
          <TouchableOpacity onPress={handleTooltipPress}>
            <Text style={styles.tooltipText}>About</Text>
          </TouchableOpacity>
        </Animated.View>

        <Portal>
          <Modal
            visible={centerModalVisible}
            dismissable={true}
            // onDismiss={() => setCenterModalVisible(false)}
            onDismiss={handleCancelPress}
          >
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={handleLogin}  // Pass handleLogin as onSubmit
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <View style={styles.login_container}>
                  <Text style={styles.title}>Log In to ExpensePlanner</Text>
                  <Text style={styles.label}>Enter Your Email</Text>
                  <TextInput
                    value={values.email}
                    // onChangeText={handleChange('email')}
                    // onBlur={handleBlur('email')}
                    onChangeText={(text) => setFieldValue('email', text.trim())} // Trims spaces in real-time
                    onBlur={() => {
                      setFieldValue('email', values.email.trim()); // Trims any remaining spaces on blur
                      handleBlur('email'); // Calls handleBlur without extra parentheses
                    }}

                    // value={email}
                    // onChangeText={setEmail}
                    mode="flat"
                    autoCapitalize='none'
                    keyboardType='email-address'
                    style={[
                      styles.input,
                      focusedInput === 'email' ? styles.focusedInput : {}
                    ]}
                    theme={{ colors: { primary: focusedInput ? colors.androidbluebtn : colors.androidbluebtn } }}
                    textColor={colors.black}
                    dense={true}
                    onFocus={() => setFocusedInput('email')}
                  // onBlur={() => setFocusedInput(null)}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                  <View style={styles.passwordContainer}>
                    <Text style={styles.passwordLabel}>Password</Text>
                    <Button
                      mode="text"
                      compact={true}
                      onPress={() => {
                        toggleModal();
                        setCenterModalVisible(false);
                      }}
                      style={styles.forgotButton}
                      rippleColor={colors.gray}
                    >
                      <Text style={styles.forgotText}>FORGOT?</Text>
                    </Button>
                    {/* <Pressable
                      onPress={() => {
                        toggleModal(); // Call the toggleModal function
                        setCenterModalVisible(false); // Set center modal visibility to false
                      }}
                    >
                      <Text style={styles.forgotText}>FORGOT?</Text>
                    </Pressable> */}
                  </View>
                  <TextInput
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}

                    // value={password}
                    // onChangeText={setPassword}
                    mode="flat"
                    style={styles.input}
                    theme={{ colors: { primary: focusedInput ? colors.androidbluebtn : colors.androidbluebtn } }}
                    textColor={colors.black}
                    secureTextEntry={true}
                    dense={true}
                    onFocus={() => setFocusedInput('password')}
                  // onBlur={() => setFocusedInput(null)}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                  <View style={styles.buttonContainer}>
                    <Button
                      mode="text"
                      onPress={handleCancelPress}
                      style={styles.button}
                      labelStyle={styles.buttonText}
                      contentStyle={styles.buttonContent}
                      rippleColor={colors.gray}
                    >
                      CANCEL
                    </Button>
                    <Button
                      mode="text"
                      onPress={handleSubmit}
                      style={styles.button}
                      labelStyle={styles.buttonText}
                      contentStyle={styles.buttonContent}
                      rippleColor={colors.gray}
                    >
                      LOG IN
                    </Button>
                  </View>
                </View>
              )}
            </Formik>
          </Modal>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={1000}
            style={[
              styles.snack_bar,
              {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
              }
            ]}
          >
            <View style={styles.img_txt_view}>
              <Image
                source={Images.expenseplannerimage}
                style={styles.snack_bar_img}
              />
              <Text style={styles.snack_bar_text}>Invalid Credentials. Try again.</Text>
            </View>
          </Snackbar>

          <Snackbar
            visible={snackbarVisiblePassword}
            onDismiss={() => setSnackbarVisiblePassword(false)}
            duration={1000}
            style={[
              styles.snack_bar,
              {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
              }
            ]}
          >
            <View style={styles.img_txt_view}>
              <Image
                source={Images.expenseplannerimage}
                style={styles.snack_bar_img}
              />
              <Text style={styles.snack_bar_text}>Invalid Password. Please try again.</Text>
            </View>
          </Snackbar>

          <Snackbar
            visible={snackbarLoginVisible}
            onDismiss={() => setSnackbarLoginVisible(false)}
            duration={1000}
            style={[
              styles.snack_bar,
              {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
              }
            ]}
          >
            <View style={styles.img_txt_view}>
              <Image
                source={Images.expenseplannerimage}
                style={styles.snack_bar_img}
              />
              <Text style={styles.snack_bar_text}>Login Successful!</Text>
            </View>
          </Snackbar>
        </Portal>

        <Portal>
          <Modal
            visible={forgotPasswordModal}
            onDismiss={toggleModal}
            contentContainerStyle={styles.fp_modalContainer}
          >
            <Text style={styles.fp_title}>Forgot Your Password?</Text>
            <Text style={styles.fp_subText}>
              No worries! I'll send you an email to reset your password.
            </Text>

            <Formik
              initialValues={{ email: '' }}
              validationSchema={validationSchemaFP}
              onSubmit={(values) => {
                handleResetPassword(values);
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <View>
                  <Text style={styles.fp_label}>Email Address</Text>
                  <TextInput
                    mode="flat"
                    placeholder="johnj@email.com"
                    placeholderTextColor={colors.gray}
                    onFocus={() => (styles.fp_input.borderBottomColor = colors.androidbluebtn)}
                    theme={{ colors: { primary: focusedInput ? colors.androidbluebtn : colors.androidbluebtn } }}
                    textColor={colors.black}
                    // onBlur={handleBlur('email')}
                    // onChangeText={handleChange('email')}
                    onBlur={() => {
                      setFieldValue('email', values.email.trim()); // Trims any remaining spaces on blur
                      handleBlur('email'); // Calls Formik’s handleBlur for validation
                    }}
                    onChangeText={(text) => setFieldValue('email', text.trim())}
                    value={values.email}
                    style={styles.fp_input}
                    underlineColor="transparent"
                    dense={true}
                    autoCapitalize='none'
                    keyboardType='email-address'
                  />

                  {/* Show validation error if email is incorrect */}
                  {touched.email && errors.email && (
                    <Text style={styles.fp_errorText}>{errors.email}</Text>
                  )}

                  <Button
                    mode="text"
                    onPress={handleSubmit}
                    style={styles.fp_resetButton}
                    textColor={colors.androidbluebtn}
                    rippleColor={colors.gray}
                  >
                    RESET PASSWORD
                  </Button>
                </View>
              )}
            </Formik>
          </Modal>
        </Portal>

        <Portal>
          <Modal
            visible={confirmationModal}
            // onDismiss={toggleConfirmationModal}
            contentContainerStyle={styles.c_modalContainer}
          >
            <Text style={styles.c_confirmationText}>
              I just sent you an email with an otp. Please enter that otp in next form. After verifying otp you can reset your password.
            </Text>

            <Button
              mode="text"
              onPress={handleOkPress}
              style={styles.c_okButtonText}
              textColor={colors.androidbluebtn}
              rippleColor={colors.gray}
            >
              OK
            </Button>
          </Modal>
        </Portal>


        {/* code of modal for otp */}

        <Portal>
          <Modal
            visible={isOtpModalVisible}
            contentContainerStyle={styles.otp_modalContainer}
          >
            <Text style={styles.fp_title}>Enter OTP</Text>
            <Text style={styles.fp_subText}>Enter 4 digit OTP you received on your email</Text>

            <Formik
              initialValues={{ otp: otp.join('') }} // Bind initial value as a string
              validationSchema={validationSchemaOTP}
              onSubmit={(values) => {
                handleVerifyOTP(values.otp);
               
              }}
            >
              {({ handleBlur, handleSubmit, errors, touched, setFieldValue }) => (
                <View>
                  <View style={styles.otpInputsContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        style={[
                          styles.otp_input,
                          {
                            borderColor:
                              touched.otp && !digit ? colors.danger : colors.gray,
                          },
                        ]}
                        mode="flat"
                        keyboardType="numeric"
                        underlineColor='transparent'
                        cursorColor={colors.brightgreen}
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => {
                          const newOtp = [...otp];
                          newOtp[index] = text.trim();

                          setFieldValue('otp', newOtp.join(''));

                          if (text.trim() && index < otp.length - 1) {
                            refs[index + 1].focus();
                          }

                          setOtp(newOtp);
                        }}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === 'Backspace' && !otp[index]) {
                            if (index > 0) {
                              refs[index - 1].focus();
                            }
                          }
                        }}
                        onBlur={handleBlur('otp')}
                        ref={(input) => (refs[index] = input)}
                        autoFocus={index === 0}
                        textColor={colors.brightgreen}
                        activeUnderlineColor={colors.brightgreen}
                      />
                    ))}
                  </View>

                  {/* Validation error for OTP */}
                  {touched.otp && errors.otp && (
                    <Text style={styles.fp_errorText}>{errors.otp}</Text>
                  )}

                  <View style={styles.otp_btns_Container}>
                    <Button
                      mode="text"
                      onPress={handleOTPCancelPress}
                      style={styles.fp_resetButton}
                      textColor={colors.androidbluebtn}
                      rippleColor={colors.gray}
                    >
                      CANCEL
                    </Button>
                    <Button
                      mode="text"
                      onPress={handleSubmit}
                      style={styles.fp_resetButton}
                      textColor={colors.androidbluebtn}
                      rippleColor={colors.gray}
                    >
                      VERIFY
                    </Button>
                  </View>
                </View>
              )}
            </Formik>
          </Modal>
          {/* snackbar for invalid password */}
          <Snackbar
            visible={snackbarVisibleInvalidPassword}
            onDismiss={() => setSnackbarVisibleInvalidPassword(false)}
            duration={1000}
            style={[
              styles.snack_bar,
              {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
              }
            ]}
          >
            <View style={styles.img_txt_view}>
              <Image
                source={Images.expenseplannerimage}
                style={styles.snack_bar_img}
              />
              <Text style={styles.snack_bar_text}>Entered otp is incorrect!</Text>
            </View>
          </Snackbar>
        </Portal>



        {/* modal for reset password or update password */}
        <Portal>
          <Modal
            visible={resetModalVisible}
          >
            <Formik
              initialValues={{ rPassword: '', rConfirmPassword: '' }}
              validationSchema={validationSchemaRP}
              onSubmit={({ rPassword }) => {
                updatePassword(rPassword);
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.rp_modalContainer}>
                  <Text style={styles.title}>Reset Password</Text>

                  <TextInput
                    value={values.rPassword}
                    onChangeText={handleChange('rPassword')}
                    onBlur={handleBlur('rPassword')}
                    mode="flat"
                    style={styles.input}
                    theme={{ colors: { primary: focusedInput === 'rPassword' ? colors.androidbluebtn : colors.androidbluebtn } }}
                    textColor="black"
                    secureTextEntry={true}
                    dense={true}
                    placeholder="New Password"
                    placeholderTextColor={colors.gray}
                    onFocus={() => setFocusedInput('rPassword')}
                  />
                  {touched.rPassword && errors.rPassword && (
                    <Text style={styles.rp_errorText}>{errors.rPassword}</Text>
                  )}

                  <TextInput
                    value={values.rConfirmPassword}
                    onChangeText={handleChange('rConfirmPassword')}
                    onBlur={handleBlur('rConfirmPassword')}
                    mode="flat"
                    style={styles.input}
                    theme={{ colors: { primary: focusedInput === 'rConfirmPassword' ? colors.androidbluebtn : colors.androidbluebtn } }}
                    textColor="black"
                    secureTextEntry={true}
                    dense={true}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.gray}
                    onFocus={() => setFocusedInput('rConfirmPassword')}
                  />
                  {touched.rConfirmPassword && errors.rConfirmPassword && (
                    <Text style={styles.rp_errorText}>{errors.rConfirmPassword}</Text>
                  )}

                  <View style={styles.buttonContainer}>
                    <Button
                      mode="text"
                      onPress={() => setResetModalVisible(false)}
                      style={styles.button}
                      labelStyle={styles.buttonText}
                      contentStyle={styles.buttonContent}
                      rippleColor="gray"
                    >
                      CANCEL
                    </Button>
                    <Button
                      mode="text"
                      onPress={handleSubmit}
                      style={styles.button}
                      labelStyle={styles.buttonText}
                      contentStyle={styles.buttonContent}
                      rippleColor="gray"
                    >
                      RESET
                    </Button>
                  </View>
                </View>
              )}
            </Formik>
          </Modal>
        </Portal>


        <Snackbar
          visible={snackbarUpdatePassword}
          onDismiss={() => setSnackbarUpdatePassword(false)}
          duration={1000}
          style={[
            styles.snack_bar,
            {
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              zIndex: 1000,
            }
          ]}
        >
          <View style={styles.img_txt_view}>
            <Image
              source={Images.expenseplannerimage}
              style={styles.snack_bar_img}
            />
            <Text style={styles.snack_bar_text}>Password updated successfully.</Text>
          </View>
        </Snackbar>

      </View>
    </Pressable >
  )
}

export default Onboarding

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
    color: colors.black,
    fontSize: hp('2.8%'),
    fontWeight: '600',
  },
  image_name_container: {
    height: hp('20%'),
    backgroundColor: colors.brightgreen,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    flexDirection: 'row',
  },
  image: {
    width: wp('12.5%'),
    height: hp('7%'),
    marginRight: 10,
  },
  text_container: {
    // flex: 1,
  },
  ep_tm_text_view: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tm_text: {
    fontSize: hp('1.3%'), //near to 18
    fontWeight: '400',
    textAlign: 'center',
    color: colors.black,
    marginLeft: wp('1%')
  },
  ep_text: {
    fontSize: hp('3.4%'), //near to 18
    fontWeight: '400',
    textAlign: 'center',
    color: colors.black,
  },
  slogen_text: {
    fontSize: hp('2%'), //near to 18
    fontWeight: '400',
    textAlign: 'center',
    color: colors.black,
  },

  haveExpenseApp_text: {
    fontSize: hp('1.9%'),
    fontWeight: '400',
    textAlign: 'center',
    color: colors.black,
    marginTop: hp('5%'),
  },
  btn_view: {
    alignItems: "center",
    marginTop: hp('2%'),
  },
  buttonbody: {
    width: wp('70%'),
    height: hp('5%'),    //near to 40 px
    borderRadius: hp('0.1%'),
    backgroundColor: colors.androidbluebtn,
    justifyContent: 'center',
  },
  addIncome_label: {
    fontSize: hp('1.8%'),
    fontWeight: '400',
    lineHeight: hp('1.8%'),
  },

  icon_text: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('6%'),
  },
  secured_text: {
    fontSize: hp('2%'),
    fontWeight: '400',
    textAlign: 'center',
    color: colors.gray,
    marginLeft: wp('2%'),

  },

  tooltipContainer: {
    position: 'absolute',
    top: 3,
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

  //login modal css
  login_container: {
    width: wp('85%'),
    padding: 10,
    backgroundColor: colors.white,
    alignSelf: 'center',
    paddingTop: hp('2.5%'),
    paddingBottom: hp('3%'),
    paddingHorizontal: hp('3%'),
  },
  title: {
    fontSize: hp('2.5%'),
    color: colors.black,
    fontWeight: '500',
    marginBottom: 7,
  },
  label: {
    fontSize: hp('2%'),
    color: colors.gray,
  },
  input: {
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
    borderBottomColor: colors.androidbluebtn,
    marginVertical: 7,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: hp('2.5%'),
    color: colors.black,
    marginBottom: 5,
  },
  focusedInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.androidbluebtn,
  },

  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passwordLabel: {
    fontSize: hp('2.3%'),
    color: colors.gray,
    fontWeight: 'bold',
    marginTop: 5,
    marginLeft: 6,
  },
  forgotButton: {
  },
  forgotText: {
    fontSize: hp('2.1%'),
    color: colors.gray,
    fontWeight: 'bold',
  },
  // button styles from paper
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: 'transparent',
    borderRadius: 50,
  },
  buttonText: {
    fontSize: hp('2%'),
    color: colors.androidbluebtn,
    fontWeight: '500',
  },
  buttonContent: {
    // paddingVertical: 10, // Adjust the padding inside the button
  },

  // snackbar styles
  snack_bar: {
    backgroundColor: colors.gray,
    borderRadius: 50,
    zIndex: 1000,
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
  errorText: {
    color: 'red',
    fontSize: 12,
  },

  //forgot password modal
  fp_modalContainer: {
    backgroundColor: colors.white,
    padding: hp('2.5%'),
    margin: hp('5.5%'),
  },
  fp_title: {
    fontSize: hp('2.6%'),
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: hp('1.5%'),
  },
  fp_subText: {
    fontSize: hp('2.3%'),
    color: 'gray',
    marginBottom: hp('1.5%'),
  },
  fp_label: {
    fontSize: hp('2.3%'),
    color: 'gray',
    marginBottom: hp('1%'),
  },
  fp_input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.androidbluebtn,
    marginBottom: hp('1%'),
    paddingHorizontal: 0,
  },
  fp_errorText: {
    fontSize: hp('1.8%'),
    color: 'red',
  },
  fp_resetButton: {
    fontSize: hp('1.8%'),
    fontWeight: 'bold',
    textAlign: 'right',
    marginVertical: hp('1%'),
    alignSelf: 'flex-end',
  },

  // confirmation modal styles
  c_modalContainer: {
    backgroundColor: colors.white,
    padding: hp('3.2%'),
    margin: hp('7%'),
  },
  c_confirmationText: {
    fontSize: hp('2.3%'),
    marginBottom: hp('1.5%'),
    color: 'gray',
  },
  c_okButtonContainer: {
    alignSelf: 'flex-end',
    marginRight: hp('1.5%'),
  },
  c_okButtonText: {
    alignSelf: 'flex-end',
    
  },

  // styles for otp modal could be some same u can remove same

  otp_modalContainer: {
    padding: hp('2.5%'),
    backgroundColor: 'white',
    borderRadius: 2,
    marginHorizontal: hp('5.2%'),
    overflow: 'hidden',
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
    overflow: 'hidden',
    padding: hp('1%'),
  },
  otp_input: {
    width: hp('7%'),
    height: hp('7%'),
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: hp('3%'),
    fontWeight: 'bold',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginHorizontal: hp('0.7%'),
    backgroundColor: 'lightgray',
  },
  otp_btns_Container: {
   flexDirection: 'row',
   justifyContent: 'flex-end',
   alignItems: 'center',
   marginTop: hp('1%'),
 },

// styles for update password modal
  rp_modalContainer: {
    padding: hp('2.5%'),
    backgroundColor: 'white',
    borderRadius: 2,
    marginHorizontal: hp('5.2%'),
    overflow: 'hidden',
  },
  rp_title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rp_input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  rp_errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  rp_buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rp_button: {
    flex: 1,
    marginHorizontal: 5,
  },
  rp_buttonText: {
    fontSize: 14,
  },
  rp_buttonContent: {
    paddingVertical: 8,
  },

})
