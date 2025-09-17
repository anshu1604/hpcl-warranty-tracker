import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';
import { Google_Sheet_Creds } from '../sheetCredentials';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ROLES } from '../helper/constant';
import { parseDate } from '../helper';
import { ScreenWrapper } from '../components/ScreenWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemsList'>;

export const ItemsListScreen: React.FC<Props> = ({ route }) => {
  const { outletName, workType, make, warrantyTillDate, vendor } = route.params;
  const [itemsData, setItemsData] = useState<string[][]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [approveLoader, setApproveLoader] = useState<{
    [key: string]: boolean;
  }>({});
  const [showApproveButton, setShowApproveButton] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    fetchItemsList();
  }, [outletName]);

  const fetchItemsList = async () => {
    try {
      setLoading(true); // start loading
      const response = await axios.get(Google_Sheet_Creds.itemsList);
      const allItems: Array<Array<string>> = (response.data.values || []).slice(
        1,
      );

      // Get user ID from AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      const parsedStroedUser = JSON.parse(storedUser || '{}');
      const userId = parsedStroedUser.userID;
      const userRole = parsedStroedUser.role;

      let filteredItems = allItems;

      // Filter by outlet
      if (outletName && outletName.trim() !== '') {
        filteredItems = allItems.filter(item => item[3] === outletName);
      }

      // Filter by workType
      if (workType && workType.trim() !== '') {
        filteredItems = filteredItems.filter(item => item[4] === workType);
      }

      // Filter by make
      if (make && make.trim() !== '') {
        filteredItems = filteredItems.filter(item => item[5] === make);
      }

      // Filter by warrantyTillDate
      if (warrantyTillDate && warrantyTillDate.trim() !== '') {
        const selectedDate = parseDate(warrantyTillDate); // Convert to Date
        filteredItems = filteredItems.filter(item => {
          const itemDate = parseDate(item[13]); // Index 11 has warranty date
          return itemDate <= selectedDate; // Include only items within date
        });
      }

      // Filter by user role
      if (userId && userRole !== USER_ROLES.HPCL) {
        if (userRole === USER_ROLES.VENDOR) {
          filteredItems = filteredItems.filter(
            item => item[item.length - 2] === userId,
          );
        } else {
          const [users, outlets] = await Promise.all([
            axios.get(Google_Sheet_Creds.userList),
            axios.get(Google_Sheet_Creds.outletMasterData),
          ]);
          const usersData: Array<Array<string>> = (
            users?.data.values || []
          ).slice(1);
          const outletData: Array<Array<string>> = (
            outlets.data.values || []
          ).slice(1);
          let dealerOutlets: string = '';
          if (usersData && usersData.length > 0) {
            usersData.forEach(user => {
              if (userId === user[0]) dealerOutlets = user[7];
            });
          }

          // Parse dealerOutlets to array of IDs
          const dealerOutletIds: string[] = dealerOutlets
            ? JSON.parse(dealerOutlets).map((id: number) => id.toString())
            : [];

          // Map dealerOutletIds to outlet names
          const allowedOutletNames: string[] = outletData
            .filter(outlet => dealerOutletIds.includes(outlet[0])) // outlet[0] = ID
            .map(outlet => outlet[1]); // outlet[1] = name

          // Filter items based on outlet names
          if (allowedOutletNames.length > 0) {
            filteredItems = filteredItems.filter(
              item => allowedOutletNames.includes(item[3]), // item[3] = outlet name
            );
          }
        }
        setShowApproveButton(false);
      } else {
        // Filter by vendor
        if (vendor && vendor.trim() !== '') {
          filteredItems = filteredItems.filter(item => item[17] === vendor);
        }
        setShowApproveButton(true);
      }
      setItemsData(filteredItems);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // done loading
    }
  };

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleApproveItem = async (itemId: string) => {
    setApproveLoader(prev => ({ ...prev, [itemId]: true }));
    await axios.post(Google_Sheet_Creds.WEB_APP_URL, {
      action: 'approveItem',
      itemId, // ID of the item to approve
    });
    fetchItemsList();
  };

  return (
    <ScreenWrapper scrollable>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={{ marginTop: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 8, color: '#555' }}>
              Loading items...
            </Text>
          </View>
        ) : itemsData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={styles.emptyText}>Oops! No items found.</Text>
            <Text style={styles.emptySubText}>
              Try adjusting your filters or check back later.
            </Text>
          </View>
        ) : (
          itemsData.map((item, index) => {
            const displayData = item.slice(0, item.length - 2);
            const [
              itemId,
              itemName,
              warranty,
              outlet,
              typeOfWork,
              make,
              oemName,
              oemTollFree,
              vendorName,
              vendorContact,
              poNumber,
              poDate,
              dateOfInstallation,
              warrantyTillDate,
              approved,
              imageURLs,
              suppliedBy,
            ] = displayData;

            const listOfImageURLs = imageURLs.split(',');

            const isApproved = approved === 'TRUE';

            const isExpanded = expandedIndex === index;

            return (
              <View key={index} style={styles.card}>
                <View style={styles.headerRow}>
                  <View style={styles.headerLeft}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {suppliedBy === 'HPCL' && (
                        <View style={styles.hpclBadge}>
                          <Text style={styles.hpclBadgeText}>By HPCL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardTitle}>{itemName}</Text>
                    <Text style={styles.outletNameText}>{outlet}</Text>
                  </View>
                  <View style={styles.headerRight}>
                    {!isApproved && (
                      <View>
                        {showApproveButton ? (
                          <TouchableOpacity
                            onPress={() => handleApproveItem(itemId)}
                            style={[
                              styles.approveButton,
                              approveLoader[itemId] && { opacity: 0.6 },
                            ]}
                          >
                            <Text style={styles.approveButtonText}>
                              {approveLoader[itemId]
                                ? 'Approving...'
                                : 'Approve'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{warranty} yrs</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.icon}>🔧</Text>
                    <View>
                      <Text style={styles.label}>Work Type</Text>
                      <Text style={styles.value}>{typeOfWork}</Text>
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.icon}>🏭</Text>
                    <View>
                      <Text style={styles.label}>Make</Text>
                      <Text style={styles.value}>{make}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.icon}>📅</Text>
                    <View>
                      <Text style={styles.label}>Installed</Text>
                      <Text style={styles.value}>{dateOfInstallation}</Text>
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.icon}>⏳</Text>
                    <View>
                      <Text style={styles.label}>Warranty Till</Text>
                      <Text style={styles.value}>{warrantyTillDate}</Text>
                    </View>
                  </View>
                </View>

                {/* Images Section */}
                {listOfImageURLs.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 8 }}
                  >
                    {listOfImageURLs.map((url, imgIndex) => (
                      <Image
                        key={imgIndex}
                        source={{ uri: url }}
                        style={{
                          width: 120,
                          height: 80,
                          borderRadius: 8,
                          marginRight: 8,
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}

                {/* Expand/Collapse Section */}
                {isExpanded && (
                  <View style={styles.expandSection}>
                    <Text style={styles.expandItem}>OEM: {oemName}</Text>
                    <Text style={styles.expandItem}>
                      OEM Toll Free: {oemTollFree}
                    </Text>
                    <Text style={styles.expandItem}>
                      P.O Number: {poNumber}
                    </Text>
                    <Text style={styles.expandItem}>P.O Date: {poDate}</Text>
                    {(suppliedBy === '' || suppliedBy === 'VENDOR') && (
                      <>
                        <Text style={styles.expandItem}>
                          Vendor: {vendorName}
                        </Text>
                        <Text style={styles.expandItem}>
                          Vendor Contact: {vendorContact}
                        </Text>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => toggleExpand(index)}
                  style={styles.expandButton}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? 'Show Less ▲' : 'Show More ▼'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  outletText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#e0f7fa',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#00796B',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#f2f2f2',
    padding: 6,
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  expandSection: {
    marginTop: 8,
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  expandItem: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  expandButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingButtonText: {
    color: 'red',
    fontSize: 12,
    fontWeight: '600',
  },
  headerLeft: {
    flex: 1, // allow text block to shrink/wrap
    marginRight: 8, // space between text and pills
  },
  outletNameText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd54f',
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6f00',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ff8f00',
    textAlign: 'center',
  },
  hpclBadge: {
    backgroundColor: '#F3E5F5', // very light purple, lighter tone of text
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
  },
  hpclBadgeText: {
    color: '#6A1B9A', // dark purple
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FFEBEE', // light red background
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
  },
  pendingBadgeText: {
    color: '#C62828', // dark red text
    fontSize: 12,
    fontWeight: '600',
  },
});
