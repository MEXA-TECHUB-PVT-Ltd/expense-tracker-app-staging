import React from 'react';
import ii from 'react-native-vector-icons/Ionicons';
import fa from 'react-native-vector-icons/FontAwesome';
import mi from 'react-native-vector-icons/MaterialIcons';
import ad from 'react-native-vector-icons/AntDesign';
import mci from 'react-native-vector-icons/MaterialCommunityIcons';
import fa6 from 'react-native-vector-icons/FontAwesome6';
import fa5 from 'react-native-vector-icons/FontAwesome5';
import sli from 'react-native-vector-icons/SimpleLineIcons';


const Icons = {
    ii,
    fa,
    mi,
    ad,
    mci,
    fa5,
    fa6,
    sli,
};

const VectorIcon = ({ name, size, color, type }) => {
    const Icon = Icons[type];
    return <Icon name={name} size={size} color={color} />;
};

export { VectorIcon };
