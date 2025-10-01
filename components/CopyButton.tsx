import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

type CopyButtonProps = {
  textToCopy: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  style,
  textStyle,
}) => {
  const handleCopy = () => {
    Clipboard.setString(textToCopy);
    Alert.alert('Copied!', 'Text has been copied to clipboard.');
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleCopy}>
      <Text style={[styles.icon, textStyle]}>📋</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
});

export default CopyButton;
