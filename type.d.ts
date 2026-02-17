import { Image } from "react-native";

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
    title: string;
    style?: string;
    textStyle?: string;
    leftIcon?: React.ReactNode;
    isLoading?: boolean;


}

export {
    CustomInputProps,
    CustomButtonProps
};