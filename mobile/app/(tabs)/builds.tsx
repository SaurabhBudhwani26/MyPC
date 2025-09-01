import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function BuildsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>PC Builds</Text>
        
        <TouchableOpacity style={styles.buildCard}>
          <Text style={styles.buildTitle}>Gaming Build - ₹80,000</Text>
          <Text style={styles.buildDesc}>High-performance gaming setup</Text>
          <Text style={styles.buildSpecs}>• AMD Ryzen 5 7600 • RTX 4060 Ti • 16GB DDR5</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buildCard}>
          <Text style={styles.buildTitle}>Budget Build - ₹35,000</Text>
          <Text style={styles.buildDesc}>Entry-level PC for basic tasks</Text>
          <Text style={styles.buildSpecs}>• AMD Ryzen 5 5600G • Integrated Graphics • 8GB DDR4</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buildCard}>
          <Text style={styles.buildTitle}>Workstation Build - ₹1,50,000</Text>
          <Text style={styles.buildDesc}>Professional workstation for content creation</Text>
          <Text style={styles.buildSpecs}>• AMD Ryzen 9 7900X • RTX 4070 Ti • 32GB DDR5</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Create New Build</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  buildCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buildTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  buildDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  buildSpecs: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
