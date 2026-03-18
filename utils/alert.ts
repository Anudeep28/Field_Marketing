import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export function showAlert(title: string, message: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}\n${message}`);
      return;
    }
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    if (buttons.length === 1) {
      window.alert(`${title}\n${message}`);
      buttons[0].onPress?.();
      return;
    }

    const confirmed = window.confirm(`${title}\n${message}`);
    if (confirmed) {
      actionBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
