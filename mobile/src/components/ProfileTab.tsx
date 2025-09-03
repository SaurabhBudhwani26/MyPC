import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';

interface ProfileItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}) => {
  const { theme } = useTheme();
  
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Text style={styles.arrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const ProfileTab: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const styles = getStyles(theme);

  // Show auth screens if user is not authenticated
  if (!isAuthenticated) {
    if (authMode === 'login') {
      return <LoginScreen onSwitchToSignup={() => setAuthMode('signup')} />;
    } else {
      return <SignupScreen onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  const showComingSoonToast = (feature: string) => {
    const message = `${feature} - Coming Soon! 🚀`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Coming Soon', `${feature} feature will be available soon!`);
    }
  };

  const handleEditProfile = () => {
    showComingSoonToast('Edit Profile');
  };

  const handleSavedBuilds = () => {
    showComingSoonToast('Saved Builds');
  };

  const handlePriceAlerts = () => {
    showComingSoonToast('Price Alerts');
  };

  const handleWishlist = () => {
    showComingSoonToast('Wishlist');
  };

  const handleNotifications = () => {
    showComingSoonToast('Notifications');
  };

  const handleSupport = () => {
    showComingSoonToast('Help & Support');
  };

  const handleAbout = () => {
    Alert.alert('About MyPC', 'MyPC v1.0.0\n\nBuild your dream PC with the best prices from Amazon, Flipkart, and other retailers.\n\nDeveloped with ❤️ for PC enthusiasts.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'user@email.com'}</Text>
        {user?.joinDate && (
          <Text style={styles.joinDate}>
            Member since {new Date(user.joinDate).toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        )}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Saved Builds</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Wishlist Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Price Alerts</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="💾"
            title="Saved Builds"
            subtitle="View and manage your PC builds"
            onPress={handleSavedBuilds}
          />
          <ProfileItem
            icon="❤️"
            title="Wishlist"
            subtitle="Components you want to buy"
            onPress={handleWishlist}
          />
          <ProfileItem
            icon="🔔"
            title="Price Alerts"
            subtitle="Get notified when prices drop"
            onPress={handlePriceAlerts}
          />
          <ProfileItem
            icon="📊"
            title="Order History"
            subtitle="Track your purchases"
            onPress={() => showComingSoonToast('Order History')}
          />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="🌙"
            title="Dark Mode"
            subtitle={theme.isDark ? 'Enabled' : 'Disabled'}
            showArrow={false}
            rightComponent={
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            }
          />
          <ProfileItem
            icon="🔔"
            title="Notifications"
            subtitle="Push notifications and alerts"
            onPress={handleNotifications}
          />
          <ProfileItem
            icon="🌍"
            title="Language"
            subtitle="English"
            onPress={() => showComingSoonToast('Language Settings')}
          />
          <ProfileItem
            icon="💰"
            title="Currency"
            subtitle="INR (₹)"
            onPress={() => showComingSoonToast('Currency Settings')}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <View style={styles.sectionContent}>
          <ProfileItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help and contact us"
            onPress={handleSupport}
          />
          <ProfileItem
            icon="📋"
            title="Terms of Service"
            onPress={() => showComingSoonToast('Terms of Service')}
          />
          <ProfileItem
            icon="🔒"
            title="Privacy Policy"
            onPress={() => showComingSoonToast('Privacy Policy')}
          />
          <ProfileItem
            icon="ℹ️"
            title="About"
            subtitle="Version 1.0.0"
            onPress={handleAbout}
          />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surface,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    joinDate: {
      fontSize: 14,
      color: theme.colors.textMuted,
      marginBottom: 20,
    },
    editButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 25,
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 16,
      padding: 20,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.isDark ? '#ffffff' : theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionContent: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    profileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    profileItemLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    icon: {
      fontSize: 20,
    },
    textContainer: {
      flex: 1,
    },
    profileItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    profileItemSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    profileItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrow: {
      fontSize: 20,
      color: theme.colors.textMuted,
      marginLeft: 8,
    },
    logoutButton: {
      backgroundColor: theme.colors.error,
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    logoutText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSpacing: {
      height: 40,
    },
  });
