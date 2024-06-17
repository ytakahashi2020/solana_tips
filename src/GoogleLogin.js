// GoogleLogin.js
import React from "react";
import { auth, GoogleAuthProvider, signInWithPopup } from "./firebase";
import { FcGoogle } from "react-icons/fc";

const GoogleLogin = ({ setUser }) => {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
    } catch (error) {
      console.error("Google認証中にエラーが発生しました:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-white text-gray-700 flex items-center justify-center px-4 py-2 rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
    >
      <FcGoogle className="text-2xl mr-2" />
      <span>Googleでログイン</span>
    </button>
  );
};

export default GoogleLogin;
