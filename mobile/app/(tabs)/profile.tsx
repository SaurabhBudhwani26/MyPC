import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';

export default function ProfileScreen() {
  const { apiOnline } = useAppContext();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>My Profile</Text>
        
        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>App Status</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>API Connection:</Text>
            <Text style={[styles.statusValue, { color: apiOnline ? '#10b981' : '#ef4444' }]}>
              {apiOnline ? '🟢 Online' : '🔴 Offline'}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionSubtitle}>My Activity</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>• Saved Builds:</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>• Price Alerts:</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>• Wishlist:</Text>
            <Text style={styles.statValue}>12 items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>• Searches:</Text>
            <Text style={styles.statValue}>47 this month</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.preferencesSection}>
          <View style={styles.preferenceHeader}>
            <Text style={styles.sectionSubtitle}>Preferences</Text>
          </View>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>💰 Price Alert Settings</Text>
            <Text style={styles.preferenceChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>🔔 Notification Settings</Text>
            <Text style={styles.preferenceChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>🛒 Preferred Retailers</Text>
            <Text style={styles.preferenceChevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>📊 Data & Privacy</Text>
            <Text style={styles.preferenceChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📤 Export My Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🔄 Sync Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>ℹ️ About & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>My PC App v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for PC builders</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  
  // Status Section
  statusSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Stats Section
  statsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },

  // Preferences Section
  preferencesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  preferenceHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#374151',
  },
  preferenceChevron: {
    fontSize: 18,
    color: '#94a3b8',
  },

  // Actions Section
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },

  // Version Section
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
