import { StyleSheet, Text, View, StatusBar, Animated, BackHandler, TouchableOpacity, Image, Pressable, TouchableWithoutFeedback } from 'react-native'
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

const { width: screenWidth } = dimensions;

// Validation schema for the form
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [centerModalVisible, setCenterModalVisible] = useState(false);

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
    navigation.navigate('About');
  };

  const handleCancelPress = () => {
    setCenterModalVisible(false);
    formik.resetForm();
    setEmail('');
    setPassword('');
  };

  const handleCreateNewHousehold = () => {
    navigation.navigate('SetupBudget');
  };

  // Use Formik
  // const formik = useFormik({
  //   initialValues: {
  //     email: '',
  //     password: '',
  //   },
  //   validationSchema: validationSchema,
  //   onSubmit: (values) => {
  //     loginUser(values.email, values.password);
  //     formik.resetForm(); // Reset the form after submission
  //   },
  // });

  const handleLogin = (values) => {
    loginUser(values.email, values.password);
    setEmail('');
    setPassword('');
  };

  // transaction to login user
  const loginUser = (email, password) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT password FROM Users WHERE email = ?',
        [email],
        (tx, results) => {
          if (results.rows.length > 0) {
            const { password: hashedPassword } = results.rows.item(0);

            // Compare the hashed password with the entered password
            const isPasswordValid = bcrypt.compareSync(password, hashedPassword);

            if (isPasswordValid) {
              setCenterModalVisible(false);
              // Dispatch the user details to Redux
              dispatch(setUser({ email }));
              console.log('Login successful');
              // setSnackbarLoginVisible(true);

              saveUserData({ email, isAuthenticated: true })
                .then(() => console.log('User data saved to Async Storage'))
                .catch(error => console.error('Error saving user data to Async Storage:', error));

            } else {
              console.log('Invalid password');
              setSnackbarVisiblePassword(true);
            }
          } 
          else {
            console.log('Login failed. Please try again.');
            setSnackbarVisible(true);
          }
        },
        error => console.error('Error fetching user for login:', error)
      );
    });
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.munsellgreen} />
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleLeftIconPress} color={colors.black} />
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
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.login_container}>
                  <Text style={styles.title}>Log In to ExpensePlanner</Text>
                  <Text style={styles.label}>Household Name or Email</Text>
                  <TextInput
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}

                    // value={email}
                    // onChangeText={setEmail}
                    mode="flat"
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
                    <Pressable>
                      <Text style={styles.forgotText}>FORGOT?</Text>
                    </Pressable>
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
                    <Pressable onPress={handleCancelPress}>
                      <Text style={styles.cancelText}>CANCEL</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSubmit}
                    // onPress={handleLogin}
                    >
                      <Text style={styles.loginText}>LOG IN</Text>
                    </Pressable>
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
              <Text style={styles.snack_bar_text}>Login failed. Please try again.</Text>
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
    fontSize: hp('2.2%'),
    color: colors.gray,
  },
  forgotText: {
    fontSize: hp('2.2%'),
    color: colors.gray,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  cancelText: {
    fontSize: hp('2%'),
    color: colors.androidbluebtn,
    fontWeight: '500',
  },
  loginText: {
    fontSize: hp('2%'),
    color: colors.androidbluebtn,
    fontWeight: '500',
    marginRight: wp('5%'),
    marginLeft: wp('10%'),
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

})
