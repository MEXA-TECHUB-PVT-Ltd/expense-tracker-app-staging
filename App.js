import 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import store from './src/redux/store';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './src/navigation/mainstack/MainStack';

const App = () => {
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
      </PaperProvider>
    </ReduxProvider>
  );
};

export default App

const styles = StyleSheet.create({})