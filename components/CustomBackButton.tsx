import { TouchableOpacity, View, Image } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { icons } from "@/constants/icons"
 // Built into Expo

export const CustomBackButton = () => {
  const router = useRouter();
  
  return (
    <View className="flex-row items-center justify-between w-full px-4 pt-2">
        {/* Left Side: Back Button */}
        <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-white size-10 rounded-full items-center justify-center shadow-sm border border-gray-100"
            activeOpacity={0.7}
        >
            <Ionicons name="chevron-back" size={24} color="#344c66" />
        </TouchableOpacity>

        {/* Right Side: App Icon */}
        <TouchableOpacity onPress={() => router.push('/') as any}>
        <Image 
            source={icons.appIcon} 
            className="size-20" // Slightly reduced size to fit header better
            
        />
        </TouchableOpacity>
        </View>

  );
};