import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Footer } from './Footer';

type ScreenWrapperProps = {
  children: ReactNode;
  scrollable?: boolean; // Use ScrollView for normal scrollable screens
  withFooter?: boolean; // Whether to show footer (default: true)
  listScreen?: boolean; // If true → assume FlatList/SectionList handles footer
  withTagline?: boolean; // Whether to show tagline (default: true)
};

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  withFooter = true,
  listScreen = false,
  withTagline = true,
}) => {
  const Tagline = () =>
    withTagline ? (
      <View style={styles.taglineContainer}>
        <Text style={styles.taglineText}>
          Efficiency Secured. Warranties Assured
        </Text>
      </View>
    ) : null;

  if (scrollable) {
    // ✅ For scrollable static screens (NOT FlatList)
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Tagline />
        <View style={styles.content}>{children}</View>
        {withFooter && !listScreen && <Footer />}
      </ScrollView>
    );
  }

  // ✅ For non-scrollable screens
  return (
    <View style={styles.container}>
      <Tagline />
      <View style={styles.content}>{children}</View>
      {withFooter && !listScreen && <Footer />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
  },
  taglineContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e8f4fd', // soft blue background
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});
