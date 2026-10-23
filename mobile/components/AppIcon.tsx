import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import {useLoading} from '@/context/LoadingContext'
import { useRouter } from 'expo-router'
import { icons } from '@/constants/icons'


interface AppIconProps {
  page: string;
}


const AppIcon = ( { page }:AppIconProps ) => {
  const { setLoading } = useLoading();
  const router = useRouter();
  return (
    <TouchableOpacity
            onPress={async () => {
                setLoading(true);
                try{
                  await new Promise(resolve => setTimeout(resolve, 250));
                  router.push(`/${page}` as any)
                } finally{
                  setTimeout(() => setLoading(false), 250);
    
                }
            } 
    
    
            }>
            <Image source={icons.appIcon} className="size-40 mt-12 self-center" />
            </TouchableOpacity>
  )
}

export default AppIcon