import 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './src/navigation/mainstack/MainStack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  return (
    // <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    // </GestureHandlerRootView>
  );
};

export default App

const styles = StyleSheet.create({})