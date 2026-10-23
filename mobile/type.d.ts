import { Image } from "react-native";
import { Models } from "react-native-appwrite";

interface CustomInputProps {
    placeholder: string;
    value?: string;
    onChangeText: (text: string) => void;
    label: string;
    secureTextEntery?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface CustomButtonProps{
    onPress: () => void;
    title?: string;
    style?: string;
    textStyle?: string;
    leftIcon?: React.ReactNode;
    isLoading?: boolean;


}
interface CreateUserParams{
    email: string;
    name: string;
    password: string;
}

interface SignInParams{
    email: string;
    password: string;
}

export interface User extends Models.Document {
    name: string;
    email: string;
    avatar: string;
}

export {
    CustomInputProps,
    CustomButtonProps,
    CreateUserParams,
    SignInParams,
    
};