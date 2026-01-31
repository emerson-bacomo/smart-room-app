import { Alert } from 'react-native';

export const alertAsync = (title: string, message: string) =>
    new Promise<void>((resolve) => {
        Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }]);
    });
