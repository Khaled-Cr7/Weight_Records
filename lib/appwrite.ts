import { CreateUserParams, SignInParams } from '@/type';
import {Client, Account, Databases, Avatars, ID, TablesDB, Query} from 'react-native-appwrite';


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


export const account = new Account(client);
export const tables = new TablesDB(client);
const avatars = new Avatars(client);

export const createUser = async ({email, password, name} : CreateUserParams) => {
    try {
        const newAccount = await account.create({
            userId: ID.unique(),
            email, 
            password, 
            name
        });
        if(!newAccount) throw Error;

        await SignIn({email, password})

        const avatarUrl = avatars.getInitialsURL(name);

        return await tables.createRow({
            databaseId : appwriteConfig.databaseId,
            tableId: appwriteConfig.userTableId,
            rowId: ID.unique(),
            data: {email, name, avatar: avatarUrl, accountId: newAccount.$id},

        });
    } catch (e) {
        throw new Error(e as string)
    }

}

export const SignIn = async ({email, password} : SignInParams) => {
    try {

        try {
            await account.deleteSession('current');
        } catch (e) {}

        const session = await account.createEmailPasswordSession({email, password});
        return session;
    } catch (e) {
        throw new Error (e as string);
        
    }
}

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCurrentUser = async () => {
    
    try{
        const currentAccount = await account.get();
        if (!currentAccount) throw Error;

        const currentUser = await tables.listRows({
           databaseId : appwriteConfig.databaseId,
           tableId: appwriteConfig.userTableId,
           queries: [Query.equal("accountId", currentAccount.$id)]
           

    })

    if (!currentUser) throw Error;

    return currentUser.rows[0];

    } catch (e) {
        console.log(e);
        throw new Error(e as string);

    }
}