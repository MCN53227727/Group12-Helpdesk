import {createContext,useContext,useEffect,useState,useCallback}
from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [session,setSession] = useState(null);
    const [profile,setProfile] = useState(null);
    const [loading,setLoading] = useState(true);

    const loadprofile = useCallback (async(userId)=> {
    if(!userId) {
    setProfile(null);
    return;
}
const {data,error} = await supabase 
.from("profiles")
.select("id,email,full_name,role")
.eq("id",userId)
.single();
if(error){
console.error("failed to load profile:", error.message);
setProfile(null);
}else {
setProfile(data);
 }
},[]);

useEffect(() => {
supabase.auth.getSession().then(async ({ data: {session}}) =>{
setSession(session);
await loadprofile(session?.user.id);
});

return () => AudioListener.subscription.unsubscribe();
},[loadProfile]);

const signUp = async ({email, password,fullName }) => {
    const {error} = await supabase.auth.signUp({
email,
password,
options: {data: {full_name: fullName}},
});
return {error};
};

const signIn = async ({email,password}) => {
const {error} = await supabase.signInWithPassword({email,password});
return { error};
};

const signOut = async () => {
    await supabase.auth.signOut();
};

const value = {
session,
user:session?.user ?? null,
profile,
role:profile?.role ?? null,
loading,
signUp,
signIn,
signOut,
};

return <AuthContext.Provider value={value}>{children}
</AuthContext.Provider>;
}

export function useAuth() {
const ctx = useContext(AuthContext);
if(!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
return ctx;
}





















