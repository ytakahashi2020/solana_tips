import React, { useEffect, useState } from "react";
import { getAuth, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // Firebase設定ファイルをインポート

const GithubLogin = ({ setUser }) => {
  const [username, setUsername] = useState("");

  const handleGithubLogin = async () => {
    const auth = getAuth();
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      console.log("GitHub User:", user);

      // GitHub APIを使用してユーザー名を取得
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const githubUsername = response.data.login;
      console.log("GitHub Username:", githubUsername);

      // ユーザー情報にGitHubユーザー名を追加
      const userWithGithub = { ...user, githubUsername };
      setUser(userWithGithub);
      setUsername(githubUsername);

      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        githubUsername: githubUsername,
      });
    } catch (error) {
      console.error("GitHub Login Error:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleGithubLogin}
        className="bg-gray-800 text-white p-2 rounded"
      >
        GitHubでログイン
      </button>
      {username && <p>GitHub Username: {username}</p>}
    </div>
  );
};

export default GithubLogin;
