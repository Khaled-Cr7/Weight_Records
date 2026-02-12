import { icons } from '@/constants/icons';
import React from 'react';
import { Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants/images';
import { useRouter, Href } from 'expo-router';
import { useLoading } from '@/context/LoadingContext';
import AppIcon from "@/components/AppIcon"


const Headings = ({ title }: any) => {
  return (
    <Text className="text-2xl font-bold text-secondary mt-4">{title}</Text>
  )
}


// Updated TrainingCard with border, frequency, and button
const TrainingCard = ({ title, days, pic, v, route}: { title: string, days: string, pic: any, v: boolean, route: string }) => {
  // Determine alignment classes based on v
  const textAlign = v ? "" : "self-end mr-10";
  const imageAlign = v ? "self-end" : "self-start";
  const iconPosition = v ? "left-4" : "right-[50px]";
  const router = useRouter();
  const { setLoading } = useLoading()

  return (
    <TouchableOpacity 
      className="bg-white border border-[#344c66] rounded-2xl p-4 mb-4 justify-between"
      style={{ width: '100%', height: 160 }} 
      activeOpacity={0.7} 
      onPress={async () => {
        setLoading(true);
        try{
          router.push({
            pathname: '/schedule',
            params: { route: route }
          } as any)
        } finally {
          setTimeout(() => setLoading(false), 200);
        }
    
      }
    }
    >
      <View>
        <View>
          <Text className={`text-secondary font-bold text-xl leading-tight ${textAlign}`}>{title}</Text>
          <Text className={`text-gray-500 text-sm mt-1 ${textAlign}`}>{days}</Text>
          <Image 
            source={pic} 
            className={`size-40 -mt-12 ${imageAlign}`} 
            resizeMode='contain' 
          />
        </View>

        <Image 
          source={images.right} 
          className={`size-12 absolute bottom-8 ${iconPosition}`} 
          style={{ tintColor: '#344c66'}} 
        />
      </View>
    </TouchableOpacity>
  );
};

type BoxProps = {
  exercise?: string[];
};

const Box = ({ exercise }: BoxProps) => {
  // Check if all titles are missing, empty, or null
  if (!exercise || exercise.length === 0) {
    return (
      <View className="mt-4 mb-4 border border-white rounded-lg p-4 bg-white shadow-sm">
      <Text className="text-secondary">
        No favorite exercises yet. Start adding some!
      </Text>
      </View>
    );
  }

  return (
    <View className="mt-4 mb-4 border border-white rounded-lg p-4 bg-white shadow-sm">
      {exercise.map((title, index) => (
        <Text key={index} className="text-secondary mb-2 last:mb-0 leading-tight" numberOfLines={1}>{index + 1}. {title}</Text>
      ))}
    </View>
  );
};

export default function Index() {
  // Data for the splits
  const trainingData = [
    { title: "Bro Split", days: "5 times a week", pic: images.bench, v: true, route: "broSplit" },
    { title: "PPL Split", days: "6 times a week", pic: images.dumbell, v: false, route: "pplSplit" },
    { title: "Upper Lower", days: "4 times a week", pic: images.plates, v: true, route: "ulSplit" },
    { title: "Full Body", days: "3 times a week", pic: images.incline, v: false, route: "fullSplit" }
  ];

  const {setLoading} = useLoading();
  const router = useRouter();

  return (
    
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView 
        className="px-5 flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120, // Space for the bottom tab bar
        }}
      >
        <AppIcon page= ""/>
        {/* <Headings title="Favorite List" />
        <Box/> */}

        <Headings title="Training Schedules" />
        
        {/* 2x2 Grid Container */}
        <View className="flex-row flex-wrap justify-between mt-4">
          {trainingData.map((item, index) => (
            <TrainingCard 
              key={index} 
              title={item.title} 
              days={item.days} 
              pic={item.pic}
              v={item.v}
              route={item.route}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}