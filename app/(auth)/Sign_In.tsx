import React from 'react'
import { Text, View, Alert } from 'react-native'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'
import { Link, router } from 'expo-router'
import { useState } from 'react'
const Sign_IN = () => {

  const [isSubmitting, setisSubmitting] = useState(false)
  const [form, setform] = useState({email:"", password:""})

  const submit = async() => {
      if (!form.email || !form.password) return Alert.alert('Error', 'Please enter valid email address and Password')

      setisSubmitting(true);
      try{

        Alert.alert('Success', 'User Signed in successfully');
        router.replace('./')
      } catch(error:any){
        Alert.alert('Error', error.message)
      } finally{
        setisSubmitting(false);
      }
  }


  return (
    <View className="flex-1 gap-10 bg-white rounded-t-[40px] p-7 -mt-10">
      <CustomInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setform((prev) => ({...prev, email:text}))}
                label="Email"
                keyboardType="email-address"        
              />
      <CustomInput
                placeholder="Enter your Password"
                value={form.password}
                onChangeText={(text) => setform((prev) => ({...prev, password:text}))}
                label="Password"
                secureTextEntery={true}       
              />
      <CustomButton
        title="Sign In"
        isLoading={isSubmitting}
        onPress={submit}
              
      />

      <View className='flex justify-center mt-5 flex-row gap-2'>
        <Text className="text-gray-300">
          Don't have an account?
        </Text>
        <Link href="/Sign_Up" className="font-bold text-secondary">
          Sign Up        
        </Link>
      </View>
    </View>
    
  )
}

export default Sign_IN