import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { CustomButtonProps } from '@/type'
import cn from 'clsx'

const CustomButton = ({onPress, title="click Me", style, textStyle, leftIcon, isLoading=false} : CustomButtonProps) => {
  return (
    <TouchableOpacity className={cn('bg-secondary p-4 rounded-3xl items-center', style)} onPress={onPress}>
      {leftIcon}

      <View className='flex-center flex-row'>
        {isLoading ? 
        (<ActivityIndicator size="small" color="white"/>
        ): (
          <Text className={cn("text-white font-bold paragrapgh-semibold", textStyle)}>
            {title}
          </Text>
        )}


      </View>


    </TouchableOpacity>
  )
}

export default CustomButton