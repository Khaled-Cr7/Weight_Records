import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';

const CollapsibleSection = ({ title, children }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <View className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      {/* The Heading / Trigger */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
        className="flex-row justify-between items-center p-4 bg-gray-50"
      >
        <Text className="text-lg font-semibold text-gray-800 flex-1">{title}</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          className="text-gray-600" 
        />
      </TouchableOpacity>

      {/* The Content (only shows when isOpen is true) */}
      {isOpen && (
        <View className="p-4 bg-white border-t border-gray-100">
          {children}
        </View>
      )}
    </View>
  );
};

export default CollapsibleSection;
