import { View, Text, Alert} from 'react-native'
import React from 'react'
import CustomInput from '@/components/CustomInput'
import CustomButton from '@/components/CustomButton'
import { Link, router } from 'expo-router'
import { useState } from 'react'
const Sign_Up = () => {

  const [isSubmitting, setisSubmitting] = useState(false)
    const [form, setform] = useState({name:"", email:"", password:""})
    
    const submit = async() => {
        if (!form.email || !form.password || !form.name) return Alert.alert('Error', 'Please enter valid name, email address, and Password')
  
        setisSubmitting(true);
        try{
  
          Alert.alert('Success', 'User Signed Up successfully');
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
                placeholder="Enter your Name"
                value={form.name}
                onChangeText={(text) => setform((prev) => ({...prev, name:text}))}
                label="Name"
                keyboardType="default"        
              />

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
        title="Sign Up"
        isLoading={isSubmitting}
        onPress={submit}
              
      />

      <View className='flex justify-center mt-5 flex-row gap-2'>
              <Text className="text-gray-300">
                Already have an account?
              </Text>
              <Link href="/Sign_In" className="font-bold text-secondary">
                Sign In        
              </Link>
            </View>


    </View>
  )
}

export default Sign_Up