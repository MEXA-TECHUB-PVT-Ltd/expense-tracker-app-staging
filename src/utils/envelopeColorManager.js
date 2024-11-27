// utils/envelopeColorManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import randomColor from 'randomcolor';

// Helper function to get or generate a color for a given envelope name
export const getOrAssignEnvelopeColor = async (envelopeName) => {
    try {
        // Get the stored envelope colors from AsyncStorage
        const storedColors = await AsyncStorage.getItem('envelopeColors');
        const envelopeColors = storedColors ? JSON.parse(storedColors) : {};

        // If the color for the given envelopeName doesn't exist, generate a new color
        if (!envelopeColors[envelopeName]) {
            const newColor = randomColor();
            envelopeColors[envelopeName] = newColor;

            // Save the updated color mapping to AsyncStorage
            await AsyncStorage.setItem('envelopeColors', JSON.stringify(envelopeColors));

            // Return the newly generated color
            return newColor;
        }

        // If the color already exists for the envelopeName, return the existing color
        return envelopeColors[envelopeName];
    } catch (error) {
        console.error('Error getting or setting envelope color:', error);
        return randomColor(); // Fallback to a random color if an error occurs
    }
};
