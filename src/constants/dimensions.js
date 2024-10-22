import { Dimensions as RNDimensions } from 'react-native';

const { width, height } = RNDimensions.get('window');

const dimensions = {
    width,
    height,
};

export default dimensions;

