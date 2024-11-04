import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (user) => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};

export const removeUserData = async () => {
    try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.setItem('isAuthenticated', 'false');
    } catch (error) {
        console.error("Error removing user data:", error);
    }
};

export const getUserData = async () => {
    try {
        const storedUser = await AsyncStorage.getItem('user');
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        return storedUser && isAuthenticated === 'true' ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};
