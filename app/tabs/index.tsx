import { Text, TouchableOpacity, View } from "react-native";


export default function Index() {
  return (
    <View className ="flex-1 items-center bg-white">
      <Text className="text-4xl font-bold mt-20">Gym Weight Records</Text>
      <TouchableOpacity className="bg-blue-500 p-4 rounded-lg mt-10">
        <Text className="text-white text-lg">Go to the Tracking page</Text>
      </TouchableOpacity>
    </View>
    
  );
}
