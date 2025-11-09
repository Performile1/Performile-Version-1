import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface Claim {
  claim_id: string;
  order_id: string;
  order_number: string;
  claim_type: string;
  status: string;
  description: string;
  created_at: string;
  resolved_at?: string;
}

export default function ClaimsScreen() {
  const navigation = useNavigation();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [orderId, setOrderId] = useState('');
  const [claimType, setClaimType] = useState('damaged');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/consumer/claims');
      // const data = await response.json();
      // setClaims(data);
      
      // Mock data
      setClaims([]);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const submitClaim = async () => {
    try {
      // TODO: Submit to API
      // const response = await fetch('/api/consumer/claims', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     orderId,
      //     claimType,
      //     description,
      //     photos,
      //   }),
      // });
      
      setShowCreateModal(false);
      resetForm();
      await fetchClaims();
    } catch (error) {
      console.error('Failed to submit claim:', error);
    }
  };

  const resetForm = () => {
    setOrderId('');
    setClaimType('damaged');
    setDescription('');
    setPhotos([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'rejected':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderClaim = ({ item }: { item: Claim }) => {
    const StatusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity style={styles.claimCard}>
        <View style={styles.claimHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
            <StatusIcon color={statusColor} size={20} />
          </View>
          <View style={styles.claimInfo}>
            <Text style={styles.claimType}>
              {item.claim_type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.orderNumber}>Order #{item.order_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.claimFooter}>
          <Text style={styles.claimDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.resolved_at && (
            <Text style={styles.resolvedDate}>
              Resolved {new Date(item.resolved_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <AlertCircle color="#9ca3af" size={64} />
      <Text style={styles.emptyTitle}>No claims filed</Text>
      <Text style={styles.emptyText}>
        If you have an issue with a delivery, you can file a claim here
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus color="#fff" size={20} />
        <Text style={styles.createButtonText}>File a Claim</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Claims</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus color="#3b82f6" size={24} />
        </TouchableOpacity>
      </View>

      {/* Claims List */}
      <FlatList
        data={claims}
        renderItem={renderClaim}
        keyExtractor={(item) => item.claim_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Create Claim Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>File a Claim</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Order ID */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Order Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter order number"
                value={orderId}
                onChangeText={setOrderId}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Claim Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Issue Type</Text>
              <View style={styles.radioGroup}>
                {['damaged', 'lost', 'delayed', 'wrong_item'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.radioButton,
                      claimType === type && styles.radioButtonActive,
                    ]}
                    onPress={() => setClaimType(type)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        claimType === type && styles.radioTextActive,
                      ]}
                    >
                      {type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Photos */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Photos (Optional)</Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Camera color="#3b82f6" size={20} />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Plus color="#3b82f6" size={20} />
                  <Text style={styles.photoButtonText}>Choose Photos</Text>
                </TouchableOpacity>
              </View>

              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <X color="#fff" size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitClaim}
              disabled={!orderId || !description}
            >
              <Text style={styles.submitButtonText}>Submit Claim</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  claimInfo: {
    flex: 1,
  },
  claimType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orderNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  claimDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  resolvedDate: {
    fontSize: 12,
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radioButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  radioText: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#fff',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
