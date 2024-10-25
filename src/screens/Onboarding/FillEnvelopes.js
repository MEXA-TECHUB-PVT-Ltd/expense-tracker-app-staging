import React, {useState, useRef} from 'react';
import { View, StyleSheet, ScrollView, Animated,Pressable,TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Appbar, Text, Button, Checkbox, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
import colors from '../../constants/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dimensions from '../../constants/dimensions';
import { useNavigation } from '@react-navigation/native';
import { VectorIcon } from '../../constants/vectoricons';

const { width: screenWidth } = dimensions;

const FillEnvelopes = () => {
  const navigation = useNavigation();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const [visible, setVisible] = React.useState(false);
  const [checked, setChecked] = React.useState(true);
  const toggleMenu = () => setVisible(!visible);

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
    <TouchableWithoutFeedback style={{ flex: 1 }} onPress={isTooltipVisible ? handleOutsidePress : null}>
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={handleLeftIconPress} size={24} color={colors.white} />
        <Appbar.Content
          title="Fill Envelopes"
          titleStyle={styles.appbar_title} />
        <Appbar.Action onPress={handleRightIconPress} icon="dots-vertical" color={colors.white} />
      </Appbar.Header>
      <Animated.View style={[styles.tooltipContainer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity onPress={handleTooltipPress}>
          <Text style={styles.tooltipText}>Help</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scroll_view}>

      </ScrollView>
      
        <View style={styles.secondView}>
          <View style={styles.left_icon_btn_view}>
            <VectorIcon name="chevron-back" size={20} color={colors.androidbluebtn} type="ii" />
            <Button
              mode="text"
              onPress={()=> navigation.goBack()}
              // onPress={() => console.log('later press')}
              style={styles.backButton}
              labelStyle={styles.backText}
              rippleColor={colors.gray}
            >
              BACK
            </Button>
          </View>
          <View style={styles.right_icon_btn_view}>
            <Button
              mode="text" // Use 'contained' for a filled button
              onPress={()=> navigation.navigate('RegisterAccount')}
              // onPress={() => console.log('later press')}
              style={styles.nextButton}
              labelStyle={styles.nextText}
              rippleColor={colors.gray}
            >
              NEXT
            </Button>
            <VectorIcon name="chevron-forward" size={20} color={colors.androidbluebtn} type="ii" />
          </View>
        </View>
       
    </View>
    </TouchableWithoutFeedback>
  );
};

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
  scroll_view: {
    flex: 1,
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

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finishButton: {
    marginLeft: 10,
  },

});

export default FillEnvelopes;
