import { StyleSheet, Text, View, StatusBar, Animated, Dimensions, BackHandler, TouchableOpacity, Image, TextInput, Pressable, TouchableWithoutFeedback } from 'react-native'
import React, { useState, useRef } from 'react'
import CustomHeader from '../../components/CustomHeader';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CustomButton from '../../components/CustomButton';
import CustomCenterModal from '../../components/CustomCenterModal';
import { useNavigation } from '@react-navigation/native';
import Images from '../../constants/images';

const { width: screenWidth } = Dimensions.get('window');

const Onboarding = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const [centerModalVisible, setCenterModalVisible] = useState(false);
  const navigation = useNavigation();

  const [focusedInput, setFocusedInput] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLeftIconPress = () => {
    BackHandler.exitApp();
  };
  const handleRightIconPress = () => {
    toggleTooltip();
  };

  const toggleTooltip = () => {
    if (isTooltipVisible) {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: screenWidth, // Hide by moving off-screen
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsTooltipVisible(false));
    } else {
      setIsTooltipVisible(true);
      // Slide in
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.5, // Show at 50% width from the right
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
    setEmail('');
    setPassword('');
  };
  const handleLoginPress = () => {
    setCenterModalVisible(false);
    setEmail('');
    setPassword('');
  };

  const handleCreateNewHousehold = () => {
    navigation.navigate('SetupBudget');
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={handleOutsidePress}>
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.munsellgreen} />
        <CustomHeader
          containerStyle={{ backgroundColor: colors.brightgreen, }}
          leftIcon={<MCIcons name="keyboard-backspace" size={24} color={colors.black} />}
          leftIconPress={handleLeftIconPress}
          headerText="ExpensePlanner"
          headerTextStyle={{ color: colors.black }}
          secondRightIcon={<MCIcons name="dots-vertical" size={24} color={colors.white} />}
          secondRightIconPress={handleRightIconPress}
        />
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
        <Text style={styles.haveExpenseApp_text}>Have ExpensePlanner Household?</Text>
        <View style={styles.btn_view}>
          <CustomButton
            title="LOG IN"
            titleStyle={styles.buttontitle}
            buttonStyle={styles.buttonbody}
            onPress={setCenterModalVisible}
          />
        </View>
        <Text style={styles.haveExpenseApp_text}>New to ExpensePlanner?</Text>
        <View style={styles.btn_view}>
          <CustomButton
            title="CREATE NEW HOUSEHOLD"
            titleStyle={styles.buttontitle}
            buttonStyle={styles.buttonbody}
            onPress={handleCreateNewHousehold}
          />
        </View>
        <View style={styles.icon_text}>
          <MIcons name="lock" size={24} color={colors.gray} />
          <Text style={styles.secured_text}>Secured using bank-grade 256-bit SSL</Text>
        </View>
        <View style={styles.icon_text}>
          <Text style={styles.secured_text}>Version 2.16 (180)</Text>
        </View>
        <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
          <TouchableOpacity onPress={handleTooltipPress}>
            <Text style={styles.tooltipText}>About</Text>
          </TouchableOpacity>
        </Animated.View>
        <CustomCenterModal
          visible={centerModalVisible}
          onClose={() => setCenterModalVisible(false)}
        >
          <View style={styles.login_container}>
            <Text style={styles.title}>Log In to ExpensePlanner</Text>

            <Text style={styles.label}>Household Name or Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                focusedInput === 'email' && styles.focusedInput,
              ]}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Enter email"
            />

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Password</Text>
              <Pressable>
                <Text style={styles.forgotText}>FORGOT?</Text>
              </Pressable>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[
                styles.input,
                focusedInput === 'password' && styles.focusedInput,
              ]}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Enter password"
            />

            <View style={styles.buttonContainer}>
              <Pressable onPress={handleCancelPress}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={handleLoginPress}>
                <Text style={styles.loginText}>LOG IN</Text>
              </Pressable>
            </View>
          </View>
        </CustomCenterModal>
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp('2%'),
  },
  buttontitle: {
    fontSize: hp('1.8%'),
    fontWeight: '400',
    color: colors.white,
    textAlign: 'center'
  },
  buttonbody: {
    width: wp('70%'),
    height: hp('5%'),    //near to 40 px
    borderRadius: hp('0.1%'),
    backgroundColor: colors.androidbluebtn,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 10,
  },
  title: {
    fontSize: hp('2.5%'),
    color: colors.black,
    fontWeight: '500',
    marginBottom: 5,
  },
  label: {
    fontSize: hp('2%'),
    color: colors.gray,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.androidbluebtn,
    paddingVertical: 0,
    marginVertical: 5,
    paddingHorizontal: 0,
    fontSize: hp('2.5%'),
    color: colors.black,
    marginBottom: 5,
  },
  focusedInput: {
    borderBottomWidth: 2,
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
})
