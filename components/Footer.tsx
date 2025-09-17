import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Footer = () => {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.footer}>
        <Text style={styles.address}>
          Hindustan Petroleum Corporation Limited
        </Text>
        <Text style={styles.subAddress}>Panipat Retail Regional Office</Text>
        <Text style={styles.copyRight}>© Copy Rights Reserved</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f9f9f9',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
  subAddress: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  copyRight: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
