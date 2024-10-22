//this is how to use

// const [centerModalVisible, setCenterModalVisible] = useState(false);

{/* <CustomCenterModal
    visible={centerModalVisible}
    onClose={() => setCenterModalVisible(false)}
    crossIcon="close"
>
</CustomCenterModal> */}

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomButton from './CustomButton';

const CustomCenterModal = ({
    onClose,
    crossIcon,
    showCrossIcon = true,
    crossIconSize = 22,
    crossIconColor = 'black',
    visible,
    children,
}) => {
    if (!visible) return null;

    const handleOverlayPress = () => {
        onClose();
    };

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlay_touchable_opacity} onPress={handleOverlayPress}>
                <View style={styles.overlayContent}></View>
            </TouchableOpacity>
            <View style={styles.modalWrapper}>
                <View style={styles.header}>
                    {showCrossIcon && crossIcon && (
                        <TouchableOpacity onPress={onClose} style={styles.cross_iconContainer}>
                            <Icon name={crossIcon} size={crossIconSize} color={crossIconColor} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay_touchable_opacity: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContent: {
        flex: 1, // This takes up all the space of the overlay
    },
    modalWrapper: {
        backgroundColor: '#fff',
        // borderRadius: 24,
        padding: 10,
        minHeight: hp('30%'),
        width: wp('80%'),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    cross_iconContainer: {
        backgroundColor: 'transparent',
        marginRight: 5,
    },
    content: {
        
    },
});

export default CustomCenterModal;
