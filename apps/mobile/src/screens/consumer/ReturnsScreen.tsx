import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  RotateCcw,
  Camera,
  Plus,
  X,
  CheckCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ReturnsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('defective');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch(`/api/consumer/orders/${orderId}`);
      // const data = await response.json();
      // setOrderDetails(data);
      
      // Mock data
      setOrderDetails({
        order_id: orderId,
        order_number: 'ORD-20251109-1234',
        merchant_name: 'Test Store',
        total_amount: 299.99,
        items: [
          { name: 'Product 1', quantity: 1, price: 149.99 },
          { name: 'Product 2', quantity: 1, price: 150.00 },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
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

  const submitReturn = async () => {
    if (!description.trim()) {
      alert('Please provide a description');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Submit to API
      // const response = await fetch('/api/consumer/returns', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     orderId,
      //     returnReason,
      //     description,
      //     photos,
      //   }),
      // });
      
      // Success - navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to submit return:', error);
      alert('Failed to submit return. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <RotateCcw color="#10b981" size={32} />
        <Text style={styles.headerTitle}>Request Return</Text>
        <Text style={styles.headerSubtitle}>
          Order #{orderDetails?.order_number}
        </Text>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.orderCard}>
          <Text style={styles.merchantName}>{orderDetails?.merchant_name}</Text>
          {orderDetails?.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {item.quantity}x ${item.price.toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${orderDetails?.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Return Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reason for Return</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'defective', label: 'Defective/Damaged' },
            { value: 'wrong_item', label: 'Wrong Item' },
            { value: 'not_as_described', label: 'Not as Described' },
            { value: 'changed_mind', label: 'Changed Mind' },
            { value: 'other', label: 'Other' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioButton,
                returnReason === option.value && styles.radioButtonActive,
              ]}
              onPress={() => setReturnReason(option.value)}
            >
              <Text
                style={[
                  styles.radioText,
                  returnReason === option.value && styles.radioTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Please describe the issue in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Add photos to help us process your return faster
        </Text>
        
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Camera color="#10b981" size={20} />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Plus color="#10b981" size={20} />
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

      {/* Return Policy */}
      <View style={styles.section}>
        <Text style={styles.policyTitle}>Return Policy</Text>
        <Text style={styles.policyText}>
          • Returns accepted within 30 days of delivery{'\n'}
          • Items must be in original condition{'\n'}
          • Refund will be processed within 5-7 business days{'\n'}
          • Return shipping may be free or paid depending on reason
        </Text>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitReturn}
          disabled={submitting || !description.trim()}
        >
          <CheckCircle color="#fff" size={20} />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radioButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  radioText: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
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
    borderColor: '#10b981',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
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
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  submitContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
