import {Client} from 'react-native-appwrite';



export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: "com.khaled.weightrecord",
    databaseId: "6992ddff000338a10d59",
    userTableId: "6992dfa20027923ec100",
    
}

export const client = new Client()
client 
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

